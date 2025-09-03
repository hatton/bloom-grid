# Bloom Grid DOM Model

This document defines the current DOM data-\* model used by Bloom Grid, the goals it satisfies, and how it renders at runtime.

## 1) Requirements (goals and constraints)

- Single source of truth in `data-*` attributes (grid + cells).
- Deterministic, testable renderer that derives inline styles from the model.
- Clear, minimal public API for manipulating structure and styling.
- No visual conflicts: with zero gap between cells, at most one visible stroke is painted per shared edge (deterministic tie-breaks favor left/top).
- Support gaps/indents: when a positive gap exists between tracks, each side can draw independently.
- Perimeter borders: outer edges (top/right/bottom/left) set directly on the grid perimeter.
- Defaults: optional grid-level default edge used when an interior edge is unspecified.
- Spans: cell spans suppress internal edges and apply border segments at the span’s outer perimeter.
- Be concise. For example, don't require us list out specs for each edge when the are all the same. Another example: don't list color:"black" if you know that black is the default. This makes the html much easier to read an reason about.

## Approach

- Single source of truth for borders: edges belong to the parent grid, not cells.
- When gap between cells is 0, no conflict are possible because we specify every edge.
- When gap > 0, now we have multiple "borders" per "edge". At that point we have to specify east/west or north/south to define each border.
- Grid and cell state lives in `data-*` attributes only. No UI writes to `style` or CSS vars directly.
- Inline styles are render outputs, never inputs.

## 2) Data-\* schema

Terminology:

- R = number of rows, C = number of columns
- Edge = BorderSpec = `{ weight: number, style: 'none'|'solid'|'dashed'|'dotted'|'double', color: string }`

Grid sizing:

- `data-column-widths`: comma list of track tokens (e.g., `fill,fill`, `hug,120px,fill`)
- `data-row-heights`: comma list of track tokens

Gaps (optional):

- `data-gap-x`: comma list or single CSS length for column gaps (C-1 entries if list)
- `data-gap-y`: comma list or single CSS length for row gaps (R-1 entries if list)

Unified edges (no separate outer object):
- `data-edges-h`: JSON 2D array describing horizontal boundaries. Preferred full shape is (R+1)×C; row 0 is the top perimeter, row R is the bottom perimeter; interior rows are boundaries between r and r+1.
- `data-edges-v`: JSON 2D array describing vertical boundaries. Preferred full shape is R×(C+1); col 0 is the left perimeter, col C is the right perimeter; interior cols are boundaries between c and c+1.

Authoring forms per entry (applies to both H and V arrays):
1) Shorthand single edge: `BorderSpec | null` (applies to both sides when gap is zero)
2) Sided object for gaps/asymmetry:
   - Horizontal: `{ north?: BorderSpec|null, south?: BorderSpec|null }`
   - Vertical: `{ west?: BorderSpec|null, east?: BorderSpec|null }`

Concise interior-only form:
- For convenience, you may omit perimeters and provide only interior boundaries:
  - `data-edges-h`: shape (R-1)×C
  - `data-edges-v`: shape R×(C-1)
- You may also use a single interior row/col (length 1) in degenerate cases, e.g., a 1×2 grid.
- Perimeter edges are treated as absent unless explicitly provided (no implicit defaults beyond `data-border-default`).

Defaults:

- `data-border-default`: `BorderSpec | null`
  - Used only when an interior edge entry is entirely unspecified (both sides absent) and there is zero gap.

Examples:

- 1×2 with a red divider, no perimeter (concise interior-only V):
  - `data-edges-h='[[null,null]]'`  <!-- (R-1)×C = 0×2 effectively omitted -->
  - `data-edges-v='[[{"weight":1,"style":"solid","color":"red"}]]'` <!-- R×(C-1) = 1×1 -->
- 2×2 with only an outer 1px solid black border (full H/V with perimeters):
  - `data-edges-h='[[{"weight":1,"style":"solid","color":"#000"},{"weight":1,"style":"solid","color":"#000"}],[null,null],[{"weight":1,"style":"solid","color":"#000"},{"weight":1,"style":"solid","color":"#000"}]]'`
  - `data-edges-v='[[{"weight":1,"style":"solid","color":"#000"},null,{"weight":1,"style":"solid","color":"#000"}],[{"weight":1,"style":"solid","color":"#000"},null,{"weight":1,"style":"solid","color":"#000"}]]'`
- 2×2 with no inner borders (concise interior-only):
  - `data-edges-h='[[{"style":"none"},{"style":"none"}]]'` <!-- (R-1)×C = 1×2 -->
  - `data-edges-v='[[{"style":"none"}],[{"style":"none"}]]'` <!-- R×(C-1) = 2×1 -->
- 2×2 with inner red lines (shorthand):
  - `data-edges-v='[[{"color":"red"}],[{"color":"red"}]]'` <!-- R×(C-1) = 2×1; defaults: 1 solid -->
  - `data-edges-h='[[{"color":"red"},{"color":"red"}]]'` <!-- (R-1)×C = 1×2; defaults: 1 solid -->

Behavior notes:

- Zero gap: each shared edge yields a single visible stroke by conflict resolution (none > weight > style precedence; ties favor left/top). Sided entries are reconciled; shorthand applies identically to both sides.
- Positive gap: both sides may render independently; sided entries allow asymmetric styling.
- Spans: internal edges under a spanning cell are suppressed; only the span’s perimeter edges render.

## 3) Rendering at runtime

At runtime, the renderer reads the above data-\* attributes, builds a per-cell border model, and sets standard CSS properties (e.g., `borderTopWidth/Style/Color`) on each cell. No structural mutations occur, and the grid template (columns/rows) is applied via CSS grid.
