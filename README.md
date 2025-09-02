# bloom-grid

## Demo App

`yarn dev`

## Notes

- Rendering is explicit and deterministic. The renderer reads data-\* attributes (column widths, row heights, spans, borders, corners) and applies styles.
- Call `attachGrid(gridElement)` once after inserting demo HTML; it configures the renderer and triggers an initial render.
