# Render & Model Architecture — Revised Plan

This is a forward-looking plan to reshape the grid system around a declarative model and a deterministic renderer. It intentionally proposes changes to file responsibilities, APIs, and render timing.

## Goals

- Single source of truth in `data-*` attributes (grid + cells).
- Deterministic, testable renderer that derives inline styles from the model.
- Clear, minimal public API for manipulating structure and styling.
- Thoughtful strategy for when rendering is reactive vs. explicit.

## Layers and Responsibilities

1. Semantic Model (DOM data)

- Grid and cell state lives in `data-*` attributes only. No UI writes to `style` or CSS vars directly.
- Inline styles are render outputs, never inputs.

2. Model Accessors — `grid-model.ts` (new)

- Tiny helpers to read/write model attributes with validation and JSON (de)serialization.
- Examples:
  - get/set grid borders: `getGridBorder(grid, 'top'|'right'|'bottom'|'left'|'innerH'|'innerV')`.
  - get/set cell borders: `getCellBorder(cell, 'top'|'right'|'bottom'|'left')`.
  - get/set corners: `getGridCorners(grid)`, `getCellCorners(cell)`.
  - get/set spans: `getSpan(cell)`, `setSpan(cell, {x, y})` reading/writing `data-span-x/y`.
  - get/set sizing lists: `getColumnWidths(grid)`, `setColumnWidths(grid, widths)`, etc.

3. Grid Controller — `BloomGrid` class (new)

- Encapsulates a single grid element and provides safe, high-level operations.
- Uses `grid-model.ts` and existing structural helpers (subset of `structure.ts`, then fully migrated).
- Batches edits and schedules render exactly once per user operation.
- Public surface (illustrative):
  - read: `getInfo()`, `getCell(r,c)`, `getRowAndColumn(cell)`.
  - structure: `addRow/Column/(At)`, `removeRow/Column/(At)`, `setRowHeight/ColumnWidth`.
  - styling: `setGridBorder(...)`, `setCellBorder(...)`, `setCorners(...)`, `setSpan(...)`.
  - render: `render(options?)` and `destroy()`.
- Internals: calls `RenderScheduler.request(grid)` at the end of an operation.

4. Renderer — `grid-renderer.ts` (new; supersedes `cssGrid-style-updater.ts`)

- Converts model to presentation. No business logic beyond conflict rules.
- Responsibilities:
  - Layout: compute `grid-template-columns/rows` from `data-column-widths` and `data-row-heights`.
  - Spans: read `data-span-x/y`, set CSS variables or inline grid placement as needed.
  - Borders: compute per-edge winning border (cell vs neighbor vs grid inner vs grid outer).
  - Corners: enforce grid outer corner radii on the 4 perimeter corners; inner corners handled per rules.
  - Nested grids: parent cell perimeter wins over nested grid perimeter where they coincide.
- API:
  - `render(grid: HTMLElement, reason?: string)`
  - `buildRenderModel(grid)` returns a pure JS structure for unit tests (no DOM writes).

5. Render Scheduling — `render-scheduler.ts` (new)

- Centralized place to coalesce render requests. No observers.
- API:
  - `request(grid, reason)` — enqueue a render for the grid (microtask/RAF debounced per grid).
- No MutationObserver is used; renders are explicit and scheduled by operations.

## Source of Truth — Attribute Catalog

Grid (`div.grid`)

- `data-column-widths`: `hug,fill,100px,...` (list)
- `data-row-heights`: `hug,fill,50px,...` (list)
- `data-edges-h`: JSON 2D array (R-1) x C of `{ north?: Edge|null, south?: Edge|null }`
  - Horizontal boundaries between row r and r+1 at column c
- `data-edges-v`: JSON 2D array R x (C-1) of `{ west?: Edge|null, east?: Edge|null }`
  - Vertical boundaries between column c and c+1 at row r
    Unified edges (no `data-edges-outer`):
- `data-edges-h`: (R+1)×C; top at index 0, bottom at index R
- `data-edges-v`: R×(C+1); left at index 0, right at index C
  - top/bottom arrays length C; left/right arrays length R
- `data-border-default`: JSON `Edge` used when a specific edge entry is null/omitted
- `data-gap-x`: CSS length or comma list for per-column gaps (C-1 entries) — optional
- `data-gap-y`: CSS length or comma list for per-row gaps (R-1 entries) — optional
- `data-corners`: JSON `{ radius: number }`

Cell (`div.cell`)

- `data-span-x`, `data-span-y`: integers ≥ 1
- `data-content-type`: `text|image|grid` (existing)
- `data-inset` (optional): JSON `{ top?: string, right?: string, bottom?: string, left?: string }`
- `data-corners`: JSON `{ radius?: number }` (optional; outer corners may be overridden by grid corners)

Notes on borders/edges

- Borders are modeled as grid-owned edges; cells no longer own `data-border-*`.
- Sided edges allow neighbors to differ when there’s a gap/indent: e.g., west vs east can each render.
- When the gap at a boundary is 0, the renderer resolves two sided entries to one visible stroke (heaviest wins; left/top tiebreak).

Notes

- Keep existing DOM order and the “skip” class convention for covered cells. The renderer only reads it to avoid drawing borders for skipped cells.
- Structure functions stop writing `--span-x/y` directly; they write `data-span-x/y`. The renderer sets CSS variables or placement for layout and maintains compatibility with existing CSS.

## Conflict Resolution Rules (deterministic)

Edge ownership (between A|B, or cell|outer)

- Priority: specific cell edge > grid inner edge > none.
- When two specific edges meet (A.right vs B.left): pick the winner by:
  1. Higher weight (px) wins.
  2. If equal, style precedence: double > solid > dashed > dotted > none.
  3. If equal, choose the left/top side as the tie-breaker to stabilize rendering.
- Only one side draws the shared border to avoid double-paint (winner draws, loser suppresses that edge).

Perimeter vs nested

- Grid perimeter wins over nested grid perimeter where they coincide (parent cell’s perimeter is the visual outer boundary).

Corners

- Grid `data-corners.radius` applies to the four outermost corners. Corner cells’ outer radii are forced to match.
- Inner cell corner radii do not round shared grid corners by default (kept 0 unless future rules require otherwise).

Spans

- A cell spanning N×M covers a rectangle; all covered cells retain DOM presence but stay with class `skip`.
- Renderer suppresses borders for skipped cells and routes shared edges to the spanning owner.

## Render Timing: Reactive vs Explicit

Principles

- All public API operations (via `BloomGrid`) are explicit: they end by calling `RenderScheduler.request(grid, reason)` once. This is the sole render trigger.

Why not observer-based?

- Many operations touch multiple attributes (e.g., insert row, set sizes, set spans). An observer strategy thrashes and risks inconsistent intermediate frames. Batched explicit renders are cleaner and faster. There is no external mutation source to support.

Observer usefulness

- Out of scope: we do not support external direct mutations in this phase.

Implementation detail

- Scheduler coalesces requests per grid on microtask or requestAnimationFrame. Use RAF for visible UI actions; allow a “now” option for tests.
- Rendering writes only styles and CSS vars; it must not mutate `data-*`.

## Structural mutations are synchronous (not rendered)

- Operations that change structure (adding/removing rows/columns/cells, inserting at specific indices) execute immediately and synchronously within `BloomGrid`/`structure.ts`.
- The operation computes the exact reference nodes and performs DOM insertions/removals at that moment.
- The renderer never adds or removes elements and never reorders nodes; it only computes styles.
- After structure is updated, the operation schedules a single render to refresh visual styles.

## File Map and Transitions

- grid-model.ts (new): model accessors and validation.
- grid-renderer.ts (new): rendering and conflict logic. Migrates and expands `cssGrid-style-updater.ts` responsibilities; column/row template updates move here.
- render-scheduler.ts (new): debounced explicit render requests only (no observers).
- BloomGrid.ts (new): controller API; calls into `structure` where it remains sensible, then migrates structure functions to use `grid-model` and schedule renders.
- structure.ts (existing):
  - Short term: continue to provide DOM structure ops, but switch from `style`/vars to `data-*` writes for spans and any styling-related state.
  - Long term: thin wrappers that delegate to `BloomGrid`.
- history.ts (existing): unchanged API; `BloomGrid` uses it to wrap operations and then schedules one render.

## Minimal Contracts (for tests and callers)

Inputs

- A grid element with `class="grid"` and `data-column-widths`/`data-row-heights` of equal lengths to logical structure.

Outputs

- Inline `style` reflects the resolved visual result (templates, borders, corners, spans). No `data-*` writes from renderer.

Error modes

- Accessors validate indexes and JSON; throw with clear messages.
- Renderer asserts consistent model (e.g., there are exactly R×C `.cell` elements counting skipped ones). If not, it no-ops with a console warning or throws in test mode.

## Incremental Rollout Plan

1. Model accessors

- Add `grid-model.ts` and start using it inside UI and structure code when touching model attributes.

2. New renderer + scheduler

- Add `grid-renderer.ts` and `render-scheduler.ts`. Wire operations to call `request()` explicitly after completing model/structure updates. No observers.
- Move column/row template updates from `cssGrid-style-updater.ts` into `grid-renderer.ts`. Keep a temporary adapter that forwards calls.

3. Spans migration

- Change `setCellSpan` and related to write `data-span-x/y`. Renderer emits CSS vars or placement for layout. Preserve `skip` semantics.

4. Borders and corners

- Introduce `data-border-*` and `data-corners`. Update UI components to read/write via `grid-model`. Implement conflict rules in renderer.

5. UI refactor

- `TableSection.tsx`, `CellSection.tsx`, and `BorderControl` stop touching computed styles or CSS vars; they call `BloomGrid`/`grid-model`.

6. Testing

- Unit-test `buildRenderModel()` against edge cases: adjacent border conflicts, spans, perimeter vs nested, corner radii, no-op ties.
- Keep fast snapshot tests for template strings and style outputs for a few canonical layouts.

## Open Questions (tracked, with suggested defaults)

- Debounce cadence: microtask vs RAF — default to RAF for user actions; allow microtask for tests.
- Style precedence table — proposed: double > solid > dashed > dotted > none.
- Tie-break color — pick left/top color for determinism; document it.
- Inner corner rounding — out of scope for v1; keep 0 to avoid artifacts.

## Why this balances reactive vs explicit

- Most operations are user-initiated and batched — explicit scheduling eliminates flicker and redundant work.
- A safety-net observer covers direct `data-*` writes from outside without coupling business logic to DOM mutation order.
- Tests get a pure function (`buildRenderModel`) that avoids DOM entirely for core correctness, while integration tests still validate DOM styles.
