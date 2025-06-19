import { dragToResize } from "./drag-to-resize";
import { gridHistoryManager } from "./grid-history";
import { addColumn, addRow } from "./grid-operations";
import * as gridObserver from "./grid-observer";

export function attachGrid(gridDiv: HTMLElement): void {
  if (!gridDiv) throw new Error("Grid element is required");

  // Ensure the grid has the correct class and attributes
  gridDiv.classList.add("grid");
  if (!gridDiv.hasAttribute("data-column-widths")) {
    gridDiv.setAttribute("data-column-widths", "");
    // add two columns by default
    addColumn(gridDiv, true);
    addColumn(gridDiv, true);
  }
  if (!gridDiv.hasAttribute("data-row-heights")) {
    gridDiv.setAttribute("data-row-heights", "");
    // add two rows by default
    addRow(gridDiv, true);
    addRow(gridDiv, true);
  }
  // todo do a sanity check on the gridDiv to ensure it has the right structure

  // Attach the grid to the history manager
  gridHistoryManager.attachGrid(gridDiv);
  // Attach resize handlers
  dragToResize.attach(gridDiv);
  // Attach grid observer
  gridObserver.attach(gridDiv);
}

export function detachGrid(gridDiv: HTMLElement): void {
  if (!gridDiv) throw new Error("Grid element is required");

  // Detach from history manager
  gridHistoryManager.detachGrid(gridDiv);
  // Detach resize handlers
  dragToResize.detach(gridDiv);
  // Detach grid observer
  gridObserver.detach(gridDiv);
}
