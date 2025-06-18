import { gridHistoryManager } from "./grid-history";

export const getTargetGrid = (): HTMLElement | null => {
  // Start from the currently focused element
  let currentElement = document.activeElement as HTMLElement | null;

  if (!currentElement) {
    console.warn("No active element found. Cannot determine target grid.");
    return null;
  }

  return currentElement.closest<HTMLElement>(".grid") || null;
};

export const addRow = (grid: HTMLElement): void => {
  if (!grid) return;

  const description = "Add Row";
  const performOperation = () => {
    const columnWidthsAttr = grid.getAttribute("data-column-widths");
    const numColumns = columnWidthsAttr
      ? columnWidthsAttr.split(",").length
      : 1;

    const currentRowHeights = grid.getAttribute("data-row-heights") || "";
    const newRowHeights = currentRowHeights
      ? `${currentRowHeights},fit`
      : "fit";
    grid.setAttribute("data-row-heights", newRowHeights);

    for (let i = 0; i < numColumns; i++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      newCell.innerHTML = `<div contenteditable="true"></div>`;
      grid.appendChild(newCell);
    }
  };

  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the row was added.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    gridElement.setAttribute("data-row-heights", prevState.rowHeights);
    Object.keys(prevState.gridStyles).forEach((key) => {
      (gridElement.style as any)[key] = prevState.gridStyles[key];
    });
  };

  gridHistoryManager.addHistoryEntry(
    grid,
    description,
    performOperation,
    undoOperation
  );
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

  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the row was removed.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    gridElement.setAttribute("data-row-heights", prevState.rowHeights);
    Object.keys(prevState.gridStyles).forEach((key) => {
      (gridElement.style as any)[key] = prevState.gridStyles[key];
    });
  };

  gridHistoryManager.addHistoryEntry(
    grid,
    description,
    performOperation,
    undoOperation
  );
};

export const addColumn = (grid: HTMLElement): void => {
  if (!grid) return;

  const description = "Add Column";
  const performOperation = () => {
    const currentColumnWidths = grid.getAttribute("data-column-widths") || "";
    const numColumns = currentColumnWidths
      ? currentColumnWidths.split(",").length
      : 0;
    const newColumnWidths = currentColumnWidths
      ? `${currentColumnWidths},fit`
      : "fit";
    grid.setAttribute("data-column-widths", newColumnWidths);

    const rowHeightsAttr = grid.getAttribute("data-row-heights") || "";
    const numRows = rowHeightsAttr ? rowHeightsAttr.split(",").length : 0;
    if (numRows === 0) return;

    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));

    for (let i = numRows - 1; i >= 0; i--) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      // add a contenteditable div to the new cell
      const contentEditableDiv = document.createElement("div");
      contentEditableDiv.contentEditable = "true";

      newCell.appendChild(contentEditableDiv);
      const referenceNode = cells[(i + 1) * numColumns];
      grid.insertBefore(newCell, referenceNode || null);
    }
  };

  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the column was added.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    gridElement.setAttribute("data-row-heights", prevState.rowHeights);
    Object.keys(prevState.gridStyles).forEach((key) => {
      (gridElement.style as any)[key] = prevState.gridStyles[key];
    });
  };

  gridHistoryManager.addHistoryEntry(
    grid,
    description,
    performOperation,
    undoOperation
  );
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
  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the column was removed.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    gridElement.setAttribute("data-row-heights", prevState.rowHeights);
    Object.keys(prevState.gridStyles).forEach((key) => {
      (gridElement.style as any)[key] = prevState.gridStyles[key];
    });
  };
  gridHistoryManager.addHistoryEntry(
    grid,
    description,
    performOperation,
    undoOperation
  );
}
