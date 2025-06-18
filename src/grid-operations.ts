import { gridHistoryManager } from "./grid-history";

export const defaultColumnWidth = "fit";
export const defaultRowHeight = "fit";

export const getTargetGrid = (): HTMLElement | null => {
  // Start from the currently focused element
  let currentElement = document.activeElement as HTMLElement | null;

  if (!currentElement) {
    console.warn("No active element found. Cannot determine target grid.");
    return null;
  }

  return currentElement.closest<HTMLElement>(".grid") || null;
};

export const addRow = (grid: HTMLElement, skipHistory = false): void => {
  if (!grid) return;

  const description = "Add Row";
  const performOperation = () => {
    const columnWidthsAttr = grid.getAttribute("data-column-widths");
    const numColumns = columnWidthsAttr
      ? columnWidthsAttr.split(",").length
      : 1;

    const currentRowHeights = grid.getAttribute("data-row-heights") || "";
    const newRowHeights = currentRowHeights
      ? `${currentRowHeights},${defaultRowHeight}`
      : defaultRowHeight;
    grid.setAttribute("data-row-heights", newRowHeights);

    for (let i = 0; i < numColumns; i++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      newCell.innerHTML = `<div contenteditable="true"></div>`;
      grid.appendChild(newCell);
    }
  };

  if (skipHistory) {
    performOperation();
  } else {
    gridHistoryManager.addHistoryEntry(grid, description, performOperation);
  }
};

export const removeLastRow = (grid: HTMLElement): void => {
  if (!grid) return;

  const rowHeightsAttr = grid.getAttribute("data-row-heights");
  if (!rowHeightsAttr || rowHeightsAttr.split(",").length === 0) {
    console.info("No rows to remove from the target grid.");
    return;
  }

  const description = "Remove Last Row";
  const performOperation = () => {
    const columnWidthsAttr = grid.getAttribute("data-column-widths") || "";
    const numColumns = columnWidthsAttr.split(",").length || 1;

    const rowHeights = (grid.getAttribute("data-row-heights") || "").split(",");
    if (rowHeights.length === 0) return;
    rowHeights.pop();
    grid.setAttribute("data-row-heights", rowHeights.join(","));

    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));
    const cellsToRemove = cells.slice(-numColumns);
    cellsToRemove.forEach((cell) => grid.removeChild(cell));
  };

  gridHistoryManager.addHistoryEntry(grid, description, performOperation);
};

export const addColumn = (grid: HTMLElement, skipHistory = false): void => {
  if (!grid) return;

  const description = "Add Column";
  const performOperation = () => {
    const currentColumnWidths = grid.getAttribute("data-column-widths") || "";
    const numColumns = currentColumnWidths
      ? currentColumnWidths.split(",").length
      : 0;
    const newColumnWidths = currentColumnWidths
      ? `${currentColumnWidths},${defaultColumnWidth}`
      : defaultColumnWidth;
    grid.setAttribute("data-column-widths", newColumnWidths);

    const rowHeightsAttr = grid.getAttribute("data-row-heights") || "";
    const numRows = rowHeightsAttr ? rowHeightsAttr.split(",").length : 0;
    if (numRows === 0) return;

    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));

    for (let i = 0; i < numRows; i++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      // add a contenteditable div to the new cell
      const contentEditableDiv = document.createElement("div");
      contentEditableDiv.contentEditable = "true";
      newCell.appendChild(contentEditableDiv);

      // Calculate the position where the new cell should be inserted
      // For each row, we want to insert after the last cell of that row
      const insertPosition = i * numColumns + numColumns;
      const referenceNode = cells[insertPosition] || null;
      grid.insertBefore(newCell, referenceNode);
    }
  };

  if (skipHistory) {
    performOperation();
  } else {
    gridHistoryManager.addHistoryEntry(grid, description, performOperation);
  }
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

export function removeLastColumn(grid: HTMLElement) {
  if (!grid) return;
  const columnWidthsAttr = grid.getAttribute("data-column-widths");
  if (!columnWidthsAttr) return;

  const columnWidths = columnWidthsAttr.split(",");
  if (columnWidths.length <= 1) {
    console.info("Cannot remove the last column.");
    return;
  }

  const description = "Remove Last Column";
  const performOperation = () => {
    const numColumns = columnWidths.length;
    columnWidths.pop();
    grid.setAttribute("data-column-widths", columnWidths.join(","));

    const rowHeightsAttr = grid.getAttribute("data-row-heights") || "";
    const numRows = rowHeightsAttr ? rowHeightsAttr.split(",").length : 0;
    if (numRows === 0) return;

    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));

    // Remove the last cell from each row
    for (let i = numRows - 1; i >= 0; i--) {
      const cellIndexToRemove = i * numColumns + numColumns - 1;
      if (cellIndexToRemove < cells.length) {
        grid.removeChild(cells[cellIndexToRemove]);
      }
    }
  };

  gridHistoryManager.addHistoryEntry(grid, description, performOperation);
}

export function getGridInfo(grid: HTMLElement): {
  columnCount: number;
  rowCount: number;
  columnWidths: string[];
  rowHeights: string[];
  cellCount: number;
} {
  const columnWidths = (grid.getAttribute("data-column-widths") || "")
    .split(",")
    .filter((width) => width.trim() !== "");
  const rowHeights = (grid.getAttribute("data-row-heights") || "")
    .split(",")
    .filter((height) => height.trim() !== "");
  const cellCount = grid.querySelectorAll(":scope > .cell").length;

  return {
    columnWidths,
    rowHeights,
    cellCount,
    columnCount: columnWidths.length,
    rowCount: rowHeights.length,
  };
}
