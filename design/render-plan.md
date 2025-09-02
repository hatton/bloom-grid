# Render Pipeline Design Plan

## 1. Overview

The current approach of directly manipulating CSS styles and variables from UI components leads to rendering conflicts and an inconsistent state model. For example, a table's `border-radius` can clash with the `border-radius` of its corner cells, creating visual artifacts.

This plan proposes a new architecture centered around a **declarative semantic model** and a **render pipeline**.

- **Semantic Model (Source of Truth) in the DOM:** All properties of the grid (structure, borders, etc.) will be stored in `data-*` attributes on the `div.grid` and `div.cell` elements. This model represents the _intent_ of the user, not the final visual appearance.
- **A BloomTable class** Based on what we already have in structure.ts, but with the new approach. It takes a div.table in DOM, gives methods for reading and manipulating it. It will have a Render() method that uses the data-\* method, applies a set of conflict-resolution rules, and render the final CSS classes and inline styles to the DOM.
- **UI Components (Model Editors):** Components within `GridMenu` will be refactored to only use the BloomTable, not read or write directly to the dom.

This separation of concerns will make the system more predictable, extensible, and easier to debug.

## 2. The Semantic Model (`data-*` Attributes)

We will standardize and expand the use of `data-*` attributes to store the entire state of the grid. Inline `style` attributes will be used _only_ by the render pipeline as a final output target, not as a source of truth.

### Grid (`div.grid`) Attributes:

- `data-column-widths`: `hug,fill,100px,...`
- `data-row-heights`: `hug,fill,50px,...`
- `data-border-top`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-border-right`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-border-bottom`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-border-left`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-border-inner-v`: `{"weight": 1, "style": "solid", "color": "#444"}` (Vertical borders between cells)
- `data-border-inner-h`: `{"weight": 1, "style": "solid", "color": "#444"}` (Horizontal borders between cells)
- `data-corners`: `{"radius": 8}`

### Cell (`div.cell`) Attributes:

- `data-span-x`: (Exists as `--span-x` style) `1`, `2`, ...
- `data-span-y`: (Exists as `--span-y` style) `1`, `2`, ...
- `data-content-type`: (Exists) `text`, `image`, `grid`
- `data-border-top`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-border-right`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-border-bottom`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-border-left`: `{"weight": 1, "style": "solid", "color": "#000"}`
- `data-corners`: `{"radius": 0}`

## 3. The Render Pipeline

The BloomClass.Render() will be based on the mechanism currently in `cssGrid-style-updater.ts`.

**MutationObserver Approach:**
(TODO: not 100% confident if this should really be a mutationObserver or if we should just have to explictly call "Render()" when we want, e.g. after any UI command?) It will be triggered by a `MutationObserver` watching for changes to the `data-*` attributes on any `.grid` or `.cell`.

1.  A mutation is detected on a `data-*` attribute.
2.  The pipeline invalidates the styles for the affected element and potentially related elements (e.g., changing a cell's border affects its neighbors).
3.  A debounced `render()` function is called for the grid.
4.  The `render()` function iterates through all cells and the grid itself, calculating the final styles based on the conflict resolution rules.
5.  The calculated styles are applied directly to the elements' `style` attribute.

**Alternative Explicit Render Approach**
TODO

### Conflict Resolution Cases & Rules

This is the core logic of the renderer. It decides "who wins" when properties conflict.

| Conflict Case                            | Description                                                                                               | Proposed Resolution Rule                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Table vs. Corner Cell Radius**         | A table has `border-radius: 8px`, but the top-left cell has `border-radius: 0`.                           | **Outer wins.** The renderer will force the cell's `border-top-left-radius` to match the table's radius. The cell's `data-corner-top-left` model remains `0`, but its rendered style is `8px`.                                                                                                     |
| **Adjacent Cell Borders**                | Cell A has `border-right: 4px solid blue`. Cell B (to its right) has `border-left: 2px dotted red`.       | **Heaviest wins.** The renderer compares the two borders. The `4px` border is "heavier" than `2px`. The line between the cells will be `4px solid blue`. Both cells' `style` attributes will be adjusted to render this single, shared border correctly (one cell draws it, the other draws none). |
| **Table Inner vs. Cell Specific Border** | Table `data-border-inner-h` is `none`. A cell in the middle has `data-border-top: 2px solid green`.       | **Specific wins.** The cell's specific border definition overrides the table's general inner border style for that specific edge. The renderer will draw the `2px solid green` border above that cell.                                                                                             |
| **Nested Grid Borders**                  | A cell containing a nested grid has a `2px` bottom border. The nested grid itself has a `4px` top border. | **Parent cell wins.** The border of the cell containing the nested grid is considered the "outer" boundary. The nested grid's own perimeter border is suppressed if it conflicts with its container cell's border. The visual result would be the `2px` bottom border of the parent cell.          |

## 4. Implementation Plan & Component Changes

### Step 1: Data Model Layer

- Create a new module, `grid-model.ts`, with functions to get and set properties on grid and cell elements.
  - `getGridBorder(grid: HTMLElement, side: 'top' | ...): Border`
  - `setGridBorder(grid: HTMLElement, side: 'top' | ..., border: Border)`
  - `getCellBorder(cell: HTMLElement, side: 'top' | ...): Border`
  - `setCellBorder(cell: HTMLElement, side: 'top' | ..., border: Border)`
  - These functions will handle the JSON parsing and stringifying of the `data-*` attributes.

### Step 2: Refactor UI Components

- **`TableSection.tsx` & `CellSection.tsx`:**

  - Remove all logic that uses `getComputedStyle` or directly sets inline styles/CSS variables.
  - The `buildBorderMapFrom...` functions will be replaced with calls to the new `grid-model.ts` functions to read the `data-*` attributes.
  - The `applyBorderMapTo...` functions will be replaced with calls to the `set...` functions in `grid-model.ts`.
  - The state of the UI (`BorderControl`, `CornerMenu`) will be derived _only_ from the `data-*` model.

- **`BorderControl.tsx`:**

  - This component is already well-structured. Its `onChange` prop will now trigger the `set...` functions in `grid-model.ts`, which will in turn trigger the render pipeline.

- **`GridMenu.tsx`:**
  - This component will need to be aware of the new asynchronous rendering. When a change is made, the UI might not update instantly. We may need to show a subtle loading/pending state if rendering takes a noticeable amount of time, though it should be very fast.

### Step 3: Build the Renderer

- **`cssGrid-style-updater.ts` -> `grid-renderer.ts`:**

  - Rename and expand this file to be the home of the new render pipeline.
  - The `MutationObserver` will be updated to watch all the new `data-*` attributes.
  - Create the main `render(grid: HTMLElement)` function.
  - Implement the conflict resolution logic. A good approach would be to create a "render model" in memory—a 2D array representing the final state of all borders—and then apply that model to the DOM.

  ```typescript
  // pseudo-code for the renderer
  function render(grid: HTMLElement) {
    const gridInfo = getGridInfo(grid);
    const renderGrid = new RenderGrid(gridInfo.rowCount, gridInfo.columnCount);

    // 1. Populate RenderGrid with data from all data-* attributes
    for (const cell of getGridCells(grid)) {
      // ... read cell's data-* borders and add to renderGrid
    }
    // ... read grid's data-* borders and add to renderGrid

    // 2. Resolve conflicts
    renderGrid.resolveConflicts(); // Apply rules like "heaviest wins"

    // 3. Apply styles to DOM
    for (let r = 0; r < gridInfo.rowCount; r++) {
      for (let c = 0; c < gridInfo.columnCount; c++) {
        const cell = getCell(grid, r, c);
        const finalStyles = renderGrid.getStylesForCell(r, c);
        applyStylesToElement(cell, finalStyles);
      }
    }
    // ... apply final styles to the grid element itself
  }
  ```

### Step 4: Refactor `structure.ts`

- Functions like `setCellSpan` currently modify CSS custom properties (`--span-x`). These should be changed to modify `data-span-x` and `data-span-y` attributes instead, letting the render pipeline handle the CSS.

## 5. Value and Benefits

- **Single Source of Truth:** The `data-*` model provides a clear, readable, and authoritative representation of the grid's state.
- **Decoupling:** UI logic is separated from rendering logic. `GridMenu` components become pure "model editors."
- **Predictable Rendering:** Conflict resolution is centralized and explicit, eliminating visual bugs from competing styles.
- **Testability:** The render pipeline's logic can be unit-tested with pure functions that take a model state and produce a style output, without needing a full DOM.
- **Extensibility:** Adding new visual properties (e.g., cell backgrounds, text styles) becomes a matter of adding a new `data-*` attribute and a corresponding rule in the renderer.
