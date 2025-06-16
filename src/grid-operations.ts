import { gridHistoryManager } from "./grid-history";

export const getTargetGrid = (): HTMLElement | null => {
  return document.getElementById("main-grid");
};

export const addRow = (grid: HTMLElement): void => {
  if (!grid) return;

  // Save current state before making changes
  gridHistoryManager.saveState(grid, "Add Row");

  const columnWidthsAttr = grid.getAttribute("data-column-widths");
  const numColumns = columnWidthsAttr ? columnWidthsAttr.split(",").length : 1;

  const newRow = document.createElement("div");
  newRow.className = "row";
  // Default data-row-height is 'fit' which is handled by existing script in index.html

  for (let i = 0; i < numColumns; i++) {
    const newCell = document.createElement("div");
    newCell.className = "cell";
    newCell.textContent = `New Row Cell ${i + 1}`;
    // Cells will inherit styling and won't span by default
    newRow.appendChild(newCell);
  }

  grid.appendChild(newRow);
  // The existing MutationObserver in index.html should automatically update grid-template-rows
};

export const removeLastRow = (grid: HTMLElement): void => {
  if (!grid) return;

  const rows = grid.querySelectorAll("#main-grid > .row"); // Ensure we only get direct children rows of main-grid
  if (rows.length > 0) {
    // Save current state before making changes
    gridHistoryManager.saveState(grid, "Remove Row");

    grid.removeChild(rows[rows.length - 1]);
    // The existing MutationObserver in index.html should automatically update grid-template-rows
  } else {
    console.info("No rows to remove from the target grid.");
  }
};

export const addColumn = (grid: HTMLElement): void => {
  if (!grid) return;

  // Save current state before making changes
  gridHistoryManager.saveState(grid, "Add Column");

  const currentColumnWidths = grid.getAttribute("data-column-widths") || "";
  // Add a new column with 'fit' width. Other options: 'fill', '1fr', '100px', etc.
  const newColumnWidths = currentColumnWidths
    ? `${currentColumnWidths},fit`
    : "fit";
  grid.setAttribute("data-column-widths", newColumnWidths);

  // Add a new cell to each existing row
  const rows = grid.querySelectorAll("#main-grid > .row"); // Ensure we only get direct children rows
  rows.forEach((row) => {
    const newCell = document.createElement("div");
    newCell.className = "cell";
    newCell.textContent = "New Col Cell";
    // Cell will inherit styling and won't span by default
    row.appendChild(newCell);
  });
  // The MutationObserver will call applyColumns due to 'data-column-widths' change.
  // DOM changes for cells within rows are handled by standard browser rendering.
};

export const undoLastOperation = (grid: HTMLElement): boolean => {
  if (!grid) return false;

  return gridHistoryManager.undo(grid);
};

export const canUndo = (): boolean => {
  return gridHistoryManager.canUndo();
};

export const getLastOperation = (): string | null => {
  return gridHistoryManager.getLastOperation();
};
