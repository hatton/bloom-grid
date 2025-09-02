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

// (observer removed; explicit renderer is used)

// Controller
export { BloomGrid } from "./BloomGrid";
