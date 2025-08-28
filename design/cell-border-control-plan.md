# Cell Border Control Requirements & Design

## Glossary

- Grid: The `.grid` container element representing the table layout.
- Cell: A `.cell` element; may be a span-anchor or a skip cell.
- Gap (Grid gap): The spacing between adjacent grid tracks in a CSS Grid layout, as determined by the computed `row-gap` and `column-gap` (or shorthand `gap`). If both computed gaps are 0, borders are rendered as shared edges; if either axis has a positive gap, borders are rendered as independent boxes.
- Span: A cell spanning multiple columns/rows via `--span-x`/`--span-y` (or equivalent). When span > 1, the span-anchor cell covers a rectangle.
- Span-anchor cell: The real DOM cell that defines a span rectangle; it carries any overrides for that merged area.
- Skip cell: A DOM cell covered by a span (inside the span-anchor’s rectangle). It’s visually inactive and ignored for overrides.
- Merged cell (spanned rectangle): The rectangular area represented by the span-anchor cell and any covered skip cells; treated as a single unit for edges.
- Edge: A potential border segment between adjacent merged cells (internal) or between a merged cell and the grid perimeter (perimeter).
- Internal edge: Edge between two neighboring merged cells inside the grid.
- Perimeter edge: Edge on the outer boundary of the grid/table.
- Owner (of an internal edge): The side that paints the edge to avoid double lines. Horizontal edges → lower cell owns (paints border-top). Vertical edges → right cell owns (paints border-left).
- Preset: Table-wide rule defining which edges exist by default (`none`, `full`, `outline-only`, `inner-only`).
- Style: Visual style token for non-none edges (`normal`, `double`); width/color may be configured via tokens.
- Override: A per-cell, per-side directive (`inherit | none | normal | double`) applied to the anchor cell; proposes the token for edges on that side of its merged rectangle.
- Effective edge/border: The resolved token and concrete CSS for a given edge after applying overrides, presets, and styles.
- Shared-edge rendering: Mode when gap = 0. Each internal edge is painted once by its owner for seamless table lines.
- Independent-box rendering: Mode when gap > 0. Each merged cell paints all four sides of its own rectangle; borders don’t touch due to the gap.
- Table outline: A border on the grid container used to render the perimeter (especially for `outline-only` with gap > 0).
- Edge map: The computed, in-memory representation of all edges and their effective styles.
- Topology: The merged-cell graph derived from spans that determines which edges exist and who owns them.

## Overview

This document defines the requirements and design for implementing hierarchical border control in the bloom-grid system. Users need both simple table-wide border operations and fine-grained cell-level control.

## User Requirements

### Primary Use Cases (80% of users)

- **Remove all borders**: "I want this to look like a clean layout, not a table"
- **Standard table borders**: "I want this to look like a proper data table"
- **Outline only**: "I want a border around the whole table but not between cells"
- **Inner grid lines**: "I want lines between cells but no outer border"

### Secondary Use Cases (20% of users)

- **Custom cell borders**: "I want to emphasize this header row with thick borders"
- **Form-like appearance**: "Some cells need borders, others don't"
- **Visual grouping**: "I want to use borders to show relationships between cells"

### User Experience Principles

- **Progressive disclosure**: Simple operations visible, advanced controls hidden
- **Non-destructive workflow**: Cell customizations persist through table-wide changes
- **Clear visual feedback**: Users can see what's customized vs. what's default
- **One-click common operations**: No multi-step processes for typical needs

## Design Model

### Hierarchical Border System (Edge-Based)

We adopt an edge-centered model to avoid conflicts and handle spans cleanly while keeping a simple UX.

- Level 1: Table Defaults

  - Each grid defines a border preset and style(s) that describe which edges exist and how they look by default.
  - Changing the table defaults transforms the whole table instantly.

- Level 2: Cell Overrides (as edge proposals)
  - Individual cells specify overrides on their sides. These are interpreted as proposals for the corresponding edges on the perimeter of the cell’s (possibly spanned) rectangle.
  - The runtime computes a single source of truth per edge by resolving multiple proposals, spans, and presets.
  - Cells without overrides inherit table defaults via edge resolution.

### Border Presets

**None**: No borders anywhere

- All cell borders disabled
- Clean, minimal appearance for layouts

**Full**: Traditional table with all borders

- Every cell has borders on all four sides
- Classic spreadsheet/data table appearance

**Outline Only**: Border around table perimeter

- Cells on edges get appropriate border sides
- No borders between interior cells
- Clean, contained appearance

**Inner Only**: Grid lines between cells

- Borders only where cells meet each other
- No border around table perimeter
- Spreadsheet-like interior structure

### Border Styles

**Normal**: Standard 1px solid border

- Default appearance for most tables
- Clean, professional look

**Double**: 3px double-line border

- Emphasis and visual hierarchy
- Headers, important sections

### Data Model

The model is edge-centric in resolution but remains simple in HTML authoring.

#### Table-Level Attributes (on the `.grid` element)

- `data-border-preset`: `none | full | outline-only | inner-only`
- `data-border-style`: `normal | double` (applies to all non-none edges by default)
- Optional styling tokens (recommended for flexibility, can be deferred):
  - `data-border-color`: CSS color token or value (default currentColor)
  - `data-border-width`: CSS length for “normal” edges (default 1px)
  - `data-border-double-width`: CSS length for “double” edges (default 3px)
  - Optional split of outline vs inner styles (future-proofing):
    - `data-outline-style`, `data-inner-style` (each `normal | double`)
    - `data-outline-width`, `data-inner-width`, `data-outline-color`, `data-inner-color`

#### Cell-Level Attributes (on `.cell` elements)

Cells express overrides per side; at render time these are interpreted as proposals for the corresponding edges touching that side of the cell’s spanned rectangle.

- `data-border-top-override`: `inherit | none | normal | double`
- `data-border-right-override`: `inherit | none | normal | double`
- `data-border-bottom-override`: `inherit | none | normal | double`
- `data-border-left-override`: `inherit | none | normal | double`

Rules:

- Overrides belong on the span-anchor/real cell of a span; “skip” cells inside a span should not carry overrides (ignored if present).
- `inherit` removes any override and delegates to table defaults (via edge resolution).

#### Conceptual Edge Store (computed, not in HTML)

- The runtime computes an edge map with one record per edge (internal edges between two cells/spans, and perimeter edges at the table boundary).
- Each edge holds the effective style token: `none | normal | double` plus resolved width/color.
- This map is not serialized to HTML; it is derived at render time from table attributes, cell overrides, and span topology.

## Border Resolution Algorithm (Edge-Based)

### Inputs

- Grid size: rowCount, columnCount
- Span rectangles: for each span-anchor cell, a rectangle (row, col, spanX, spanY)
- Table attributes: preset, style(s), color, width(s)
- Cell overrides on span-anchor cells: per-side tokens (`inherit | none | normal | double`)

### Edge Topology

1. Treat each spanned rectangle as a single merged cell for topology.
2. Internal edges inside a span rectangle do not exist.
3. Consider all edges:
   - Horizontal edges: lines between row k and k+1 for k in [0..rowCount-1], plus top (k=0) and bottom (k=rowCount) perimeters.
   - Vertical edges: lines between col k and k+1 for k in [0..columnCount-1], plus left (k=0) and right (k=columnCount) perimeters.

### Preset Rules (edge perspective)

- None: all edges = none.
- Full: all edges = table style.
- Outline-only: only perimeter edges = table style; internal edges = none.
- Inner-only: only internal edges = table style; perimeter edges = none.

### Edge Ownership and Conflict Resolution

- For internal edges shared by two merged cells (A and B):

  - Owner is the cell with the greater index in the direction of the edge:
    - Horizontal internal edge: owner = lower cell; it applies to its border-top.
    - Vertical internal edge: owner = right cell; it applies to its border-left.
  - Collect proposals: A’s side override on the edge and B’s opposite side override.
  - Resolution order:
    1. If either proposal is non-inherit, use the owner’s proposal if non-inherit; otherwise use the neighbor’s.
    2. If both are inherit, use the preset rule (none or table style).

- Perimeter edges (only one adjacent cell):
  - Top perimeter: applied to top-row cells’ border-top.
  - Bottom perimeter: applied to bottom-row cells’ border-bottom.
  - Left perimeter: applied to left-column cells’ border-left.
  - Right perimeter: applied to right-column cells’ border-right.
  - The single adjacent cell’s override (if non-inherit) wins; otherwise preset applies.

Notes:

- Owner priority provides deterministic conflict resolution. If you prefer “none beats any style,” adopt that only if both sides are non-inherit and conflict; otherwise keep owner-first to avoid surprises.
- Overrides on skip cells are ignored.

### Style Application

- Map tokens to concrete CSS:
  - normal → `var(--grid-border-width, 1px) solid var(--grid-border-color, currentColor)`
  - double → `var(--grid-border-double-width, 3px) double var(--grid-border-color, currentColor)`
- Table attributes configure CSS variables or are read at render-time to produce values.

### Rendering Algorithm (mapping edges → CSS borders)

High-level steps:

1. Build merged cell topology from spans (span-anchor cells only).
2. Enumerate all edges (internal + perimeter) considering spans.
3. For each edge, compute effective token via overrides → preset → table style.
4. For each edge with token ≠ none, apply it to exactly one border side according to ownership/perimeter rules; clear the opposite side on the neighbor if needed to prevent double lines.
   - Internal horizontal edge → owner lower cell: `border-top`.
   - Internal vertical edge → owner right cell: `border-left`.
   - Top perimeter → top-row cells: `border-top`.
   - Bottom perimeter → bottom-row cells: `border-bottom`.
   - Left perimeter → left-column cells: `border-left`.
   - Right perimeter → right-column cells: `border-right`.
5. Ensure edges inside span rectangles are not rendered.

Performance guidance:

- Prefer batching DOM writes and using CSS variables on the grid for color/width/style toggles.
- Recompute only affected edges on localized edits (cell override change, row/column add/remove, span change, preset/style change).

## Grid gaps and “independent rectangles”

Rendering behavior is derived from the computed CSS grid gap (row and/or column):

- If computed gap is 0 (both row and column): shared-edge rendering

  - Use the edge-based algorithm above with ownership to paint each internal edge exactly once.
  - Produces seamless table lines.

- If computed gap is > 0 (either axis): independent-box rendering
  - Each merged cell paints its own 4 sides (subject to overrides), independent of neighbors. Edges don’t touch due to the gap.
  - Recommended for “cards” or “independent rectangles” layouts.

Preset behavior with gap > 0:

- `full`: each cell gets a box border using the table style (overrides can change per side).
- `outline-only`: use a container outline on the grid itself (grid element’s border) to draw the table perimeter; suppress cell edges by default unless overridden.
- `inner-only`: no lines by default (inner lines across gaps would be visually detached); treat as none unless overrides explicitly add per-cell sides.
- `none`: no borders.

Independent-box rendering rules:

- For each merged (possibly spanned) cell, compute its perimeter sides.
- For each side, resolve token: cell override (if non-inherit) else preset mapping above.
- Paint the four borders on the cell; do not clear neighbor sides.
- Internal lines within a spanned area remain none; only the span’s outer rectangle is bordered.

## User Interface Design

### Primary Controls (Always Visible)

**Table Border Presets**

- Four buttons: "No Borders", "Full Grid", "Outline Only", "Inner Lines"
- One-click operations that transform entire table
- Clear visual indication of current preset

**Table Border Style**

- Two buttons: "Normal", "Double"
- Affects the style of all non-none borders in the table
- Only visible when current preset isn't "none"

### Secondary Controls (Progressive Disclosure)

**Cell Border Overrides**

- Collapsible section: "Cell Border Overrides"
- Only shows when a cell is selected
- Visual indicator when selected cell has customizations
- "Reset to Table Default" button when overrides exist

**Individual Side Controls**

- Four rows: Top, Right, Bottom, Left
- Five buttons per row: Inherit, None, Normal, Double
- Visual icons for each option
- Current state clearly indicated

### Visual Feedback

**Table-Level Status**

- Current preset always visible
- Style setting shows when applicable

**Cell-Level Status**

- "(customized)" indicator when cell has overrides
- Clear distinction between inherited and overridden borders
- Easy path back to table defaults

## Interaction Model

### Typical User Workflows

**Scenario 1: Simple Table Creation**

1. User creates grid → defaults to "Full Grid" + "Normal"
2. User clicks "No Borders" → entire table becomes borderless
3. Done in 1 click

**Scenario 2: Outlined Table**

1. User has table with borders
2. User clicks "Outline Only" → only perimeter borders remain
3. Done in 1 click

**Scenario 3: Custom Header Emphasis**

1. User creates standard "Full Grid" table
2. User selects header cell
3. User opens "Cell Border Overrides"
4. User sets bottom border to "Double"
5. Header now has emphasized bottom border while rest of table unchanged

**Scenario 4: Form-Like Layout**

1. User starts with "Full Grid"
2. User selects multiple cells that should look like form fields
3. User overrides specific borders to "None" to create form field appearance
4. Table maintains structure while having form-like areas

### State Management

**Default State**

- New grids: `preset="full"`, `style="normal"`
- All edges derive from table settings (no overrides)
- No cell overrides exist

**Table Changes**

- Changing preset recalculates all effective borders
- Cell overrides are preserved and continue to work
- Users can see immediate results across entire table

**Cell Changes**

- Overrides are explicit and persistent
- Do not affect other cells
- Can be easily removed to revert to table default

This design provides a clear mental model where table settings define the overall appearance and cell overrides handle exceptions, making both simple and complex border scenarios achievable with appropriate effort levels.
