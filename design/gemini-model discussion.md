Excellent simplification. This is a common and very effective way to model dimensions in layout systems. Using a union type of `number | "grow" | "hug"` is clean, expressive, and easy to work with.

Here is the updated specification and TypeScript model reflecting this change.

---

### Part A: Functional Capabilities & Specifications

#### 1. Dimensions and Geometry

- **Column Width:** A column's width can be specified as either:

  - **A number:** An absolute width in pixels (e.g., `150`).
  - **The keyword `"grow"`:** The column expands to take an equal share of the horizontal space remaining after all pixel-width columns are laid out.

- **Row Height:** A row has two controlling properties:
  - **Height Value:** Similar to column width, this can be:
    - **A number:** A pixel value (e.g., `50`).
    - **The keyword `"grow"`:** The row participates in sharing the remaining vertical space.
  - **Height Behavior (`At Least` vs. `Exactly`):** This rule determines how the height value is interpreted in relation to the cell's content.
    - **`At Least`:** The final row height is the _greater_ of its calculated height (from the number or `"grow"`) or the height required by its content. The row can expand.
    - **`Exactly`:** The final row height is fixed to its calculated value. Content will be clipped if it doesn't fit.

#### 2. Structure and Content

- **Cell Content Type:** Can be `PrimaryContent` or a `Nested Table`.
- **Cell Merging (Spanning):** Supported for any rectangular group of cells.
- **Cell Insets:** Independent `Top`, `Left`, `Bottom`, `Right` padding.
- **First Baseline Offset:** Controls the vertical alignment of the first line of text.

#### 3. Strokes and Fills

- **Cell Fill:** `Solid Color` or `None`.
- **Cell Strokes (Borders):** Independent styling for each of the four sides.
- **Table Border:** A single exterior border for the entire table.
- **Stroke Drawing Order:** `Row Strokes in Front`, `Column Strokes in Front`, or `Best Joins`.

---

### Part B: Proposed Data Model

The key change is the introduction of a `Dimension` union type, which replaces the more verbose `sizingMode` and `value` properties in the `Row` and `Column` interfaces.

```typescript
// ===================================================================
//  Primitive & Style Types
// ===================================================================

type Color = string; // e.g., "#RRGGBB" or "rgba(...)"

type Dimension = number | "hug" | "grow";

interface Stroke {
  weight: number; // in pixels
  type: "solid" | "dashed" | "dotted";
  color: Color;
  tint?: number; // 0-100
  gapColor?: Color;
  overprint?: boolean;
}

interface SolidFill {
  type: "solid";
  color: Color;
  overprint?: boolean;
}

type Fill = SolidFill;

interface Insets {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

// ===================================================================
//  Geometric & Structural Types
// ===================================================================

type RowHeightBehavior = "AT_LEAST" | "EXACTLY";
type StrokeDrawingOrder = "ROW_IN_FRONT" | "COLUMN_IN_FRONT" | "BEST_JOINS";

interface FirstBaselineOffset {
  type: "ASCENT" | "CAP_HEIGHT" | "LEADING" | "X_HEIGHT" | "FIXED";
  fixedValue?: number; // Only used if type is 'FIXED'
}

// Represents the properties that can be applied as defaults or overrides
interface CellStyleProperties {
  fill?: Fill;
  topStroke?: Stroke;
  rightStroke?: Stroke;
  bottomStroke?: Stroke;
  leftStroke?: Stroke;
  insets?: Insets;
  firstBaselineOffset?: FirstBaselineOffset;
}

// ===================================================================
//  Core Table Objects
// ===================================================================

interface Column extends CellStyleProperties {
  width: Dimension;
}

interface Row extends CellStyleProperties {
  heightBehavior: RowHeightBehavior;
  height: Dimension;
}

// The content of a cell is either a nested table or primary content
type PrimaryContent = { type: "primary"; contentId: string };
type CellContent = PrimaryContent | Table;

interface Cell extends CellStyleProperties {
  content: CellContent;
  rowSpan: number; // Default is 1
  colSpan: number; // Default is 1

  /**
   * If this cell is covered by another cell due to spanning,
   * this will be a reference to the cell that spans over it.
   */
  isSpannedBy?: Cell;
}

interface Table {
  rows: Row[];
  columns: Column[];
  logicalGrid: Cell[][];

  tableBorder?: Stroke;
  strokeDrawingOrder: StrokeDrawingOrder;
  defaultCellProperties: CellStyleProperties;
}
```
