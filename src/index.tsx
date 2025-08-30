// Library entry point: export only the public API for consumers.

// Grid operations
export * from "./structure";

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

// Border Control UI (experimental)
export { default as BorderControl } from "./components/BorderControl/BorderControl";
