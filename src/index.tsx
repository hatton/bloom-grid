// Library entry point: export only the public API for consumers.

// Grid operations
export {
  getGridCells,
  defaultColumnWidth,
  defaultRowHeight,
  getTargetGrid,
  addRow,
  removeLastRow,
  addColumn,
  undoLastOperation,
  canUndo,
  getLastOperation,
  removeLastColumn,
  getGridInfo,
  setCellSpan,
  getCell,
  getRowAndColumn,
  addColumnAt,
  addRowAt,
  removeColumnAt,
  removeRowAt,
} from "./structure";

export * from "./types";
// Drag-to-resize
export { dragToResize } from "./drag-to-resize";

// Grid attach/detach
export { attachGrid, detachGrid } from "./attach";

// Grid history manager (if needed for advanced use)
export { gridHistoryManager } from "./history";

// Grid observer (optional, if you want to expose it)
export {
  attach as attachGridObserver,
  detach as detachGridObserver,
} from "./cssGrid-style-updater";
