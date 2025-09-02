# Bloom Grid DOM Model

This document defines the current DOM data-\* model used by Bloom Grid, the goals it satisfies, and how it renders at runtime.

## 1) Requirements (goals and constraints)

- Single source of truth for borders: edges belong to the parent grid, not cells.
- No visual conflicts: with zero gap between cells, at most one visible stroke is painted per shared edge (deterministic tie-breaks favor left/top).
- Support gaps/indents: when a positive gap exists between tracks, each side can draw independently.
- Perimeter borders: outer edges (top/right/bottom/left) set directly on the grid perimeter.
- Defaults: optional grid-level default edge used when an interior edge is unspecified.
- Spans: cell spans suppress internal edges and apply border segments at the span’s outer perimeter.
- Be concise. For example, don't require us list out specs for each edge when the are all the same. Another example: don't list color:"black" if you know that black is the default. This makes the html much easier to read an reason about.

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

Interior edges (optional, only as needed to override defaults):

- Vertical interior edges between column c and c+1 in row r:
  - `data-edges-v`: JSON 2D array with shape R × (C-1)
  - Each entry supports two forms:
    1. Shorthand single edge: `BorderSpec | null` (applies to both sides)
    2. Sided object for gaps/asymmetry: `{ west?: BorderSpec|null, east?: BorderSpec|null }`
- Horizontal interior edges between row r and r+1 in column c:
  - `data-edges-h`: JSON 2D array with shape (R-1) × C
  - Each entry supports two forms:
    1. Shorthand single edge: `BorderSpec | null` (applies to both sides)
    2. Sided object for gaps/asymmetry: `{ north?: BorderSpec|null, south?: BorderSpec|null }`

Perimeter edges (optional, only as needed to override defaults):

- `data-edges-outer`: JSON object with arrays sized to the grid perimeter
  - `{ top: Edge[] /* length C */, right: Edge[] /* length R */, bottom: Edge[] /* length C */, left: Edge[] /* length R */ }`

Defaults:

- `data-border-default`: `BorderSpec | null`
  - Used only when an interior edge entry is entirely unspecified (both sides absent) and there is zero gap.

Examples:

- 1×2 with a red divider, no perimeter:
  - `data-edges-outer='{"top":[null,null],"right":[null],"bottom":[null,null],"left":[null]}'`
  - `data-edges-v='[[{"weight":1,"style":"solid","color":"red"}]]'`
- 2×2 with only an outer 1px solid black border
  - (Defaults draw borders everywhere, so we need to suppress inner edges explicitly):
  - `data-edges-h='[[{"style":"none"},{"style":"none"}]]'` <!-- (R-1)×C = 1×2 -->
  - `data-edges-v='[[{"style":"none"}],[{"style":"none"}]]'` <!-- R×(C-1) = 2×1 -->
- 2×2 with no inner borders:
  - `data-edges-h='[[{"style":"none"},{"style":"none"}]]'`
  - `data-edges-v='[[{"style":"none"}],[{"style":"none"}]]'`
- 2×2 with inner red lines (shorthand):
  - `data-edges-v='[[{"color":"red"}],[{"color":"red"}]]'` <!-- R×(C-1) = 2×1; defaults: 1 solid -->
  - `data-edges-h='[[{"color":"red"},{"color":"red"}]]'` <!-- (R-1)×C = 1×2; defaults: 1 solid -->

Behavior notes:

- Zero gap: each shared edge yields a single visible stroke by conflict resolution (none > weight > style precedence; ties favor left/top). Sided entries are reconciled; shorthand applies identically to both sides.
- Positive gap: both sides may render independently; sided entries allow asymmetric styling.
- Spans: internal edges under a spanning cell are suppressed; only the span’s perimeter edges render.

## 3) Rendering at runtime

At runtime, the renderer reads the above data-\* attributes, builds a per-cell border model, and sets standard CSS properties (e.g., `borderTopWidth/Style/Color`) on each cell. No structural mutations occur, and the grid template (columns/rows) is applied via CSS grid.
