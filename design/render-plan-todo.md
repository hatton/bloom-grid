# Render & Model Plan — TODO Checklist

This checklist tracks implementation of the revised plan. We’ll proceed incrementally and keep tests green at each stage.

- [x] Stage 1 — Model layer (grid-model.ts)

  - [x] Define types (Border, Corners, Span)
  - [x] Get/set: column widths and row heights
  - [x] Get/set: cell and grid borders (JSON data-\*)
  - [x] Get/set: corners (grid, cell)
  - [x] Get/set: spans via data-span-x/y
  - [x] Validation and error messages
  - [x] Unit tests for all accessors and validation

[x] Stage 2 — Renderer core (grid-renderer.ts)

- [x] Compute grid-template-columns/rows from model
- [x] Emit CSS vars/placement for spans (no structure mutations)
- [x] buildRenderModel(grid) pure function skeleton
- [x] Unit tests for layout + spans (no conflicts yet)

- [x] Stage 3 — Conflict resolution

  - [x] Implement edge conflict rules (heaviest wins, precedence, tie-break)
  - [x] Corners: outer corners forced; inner corners left 0
  - [x] Nested grids: parent perimeter wins where coincident
  - [x] Unit tests covering adjacency, spans, corners, nested

- [x] Stage 4 — Render scheduler (render-scheduler.ts)

  - [x] Debounced request(grid, reason) API; RAF default
  - [x] Coalesce multiple requests per grid
  - [x] Optional immediate mode for tests
  - [x] Unit tests for coalescing and immediate mode

- [x] Stage 5 — BloomGrid controller

  - [x] Public operations (add/remove row/column/(At), set sizes, spans, borders)
  - [x] Integrate history manager around ops
  - [x] Ensure synchronous structural mutations + single scheduled render
  - [x] Unit tests for call sequencing and outcomes

- [x] Stage 6 — structure.ts migration (spans only)

  - [x] Change span writes from CSS vars to data-span-x/y
  - [x] Preserve skip semantics and covered cells behavior
  - [x] Unit tests for setCellSpan and covered/skip

- [ ] Stage 7 — Adapter + cleanup

  - [x] Migrate attach.ts off cssGrid-style-updater.ts
  - [x] Remove old observer and tests (deleted cssGrid-style-updater.\*)
  - [x] Ensure demos still run (manual smoke + demo-smoke.test)
  - [x] Update demos to data-\* (spans, inner borders, corners)
  - [ ] Update docs to reflect explicit renderer (README touch-up pending)

- [ ] Stage 8 — UI refactor (follow-up)

  - [x] Switch UI to use BloomGrid for row/column sizing and span edits (RowSection, ColumnSection, GridMenu)
  - [ ] Verify behavior in demo pages

- [ ] Stage 9 - Playwright tests
  - [ ] Test new grid, adding and removing columns and rows, take a screenshot, us AI to validate that the grid looks like whatever rows x column grid we expect to see.
