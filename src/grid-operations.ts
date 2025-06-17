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

    const newRow = document.createElement("div");
    newRow.className = "row";
    // It's good practice to assign a unique ID if rows can be reordered or specifically targeted for undo
    // newRow.id = `row-${Date.now()}`;

    for (let i = 0; i < numColumns; i++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      newCell.textContent = `cell`;
      newRow.appendChild(newCell);
    }
    grid.appendChild(newRow);
  };

  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the row was added.
    // This is simpler than trying to find and remove the specific row if IDs aren't stable.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    const rows = gridElement.querySelectorAll(".row");
    rows.forEach((row, index) => {
      const height = prevState.rowHeights[index.toString()];
      if (height) {
        row.setAttribute("data-row-height", height);
      } else {
        row.removeAttribute("data-row-height");
      }
    });
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

  // Only select direct child rows of this grid, not nested rows from embedded grids
  const rows = Array.from(grid.children).filter((child) =>
    child.classList.contains("row")
  );
  if (rows.length === 0) {
    console.info("No rows to remove from the target grid.");
    return;
  }

  const description = "Remove Last Row";
  const performOperation = () => {
    grid.removeChild(rows[rows.length - 1]);
  };

  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the row was removed.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    const newRows = gridElement.querySelectorAll(".row");
    newRows.forEach((row, index) => {
      const height = prevState.rowHeights[index.toString()];
      if (height) {
        row.setAttribute("data-row-height", height);
      } else {
        row.removeAttribute("data-row-height");
      }
    });
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
    const newColumnWidths = currentColumnWidths
      ? `${currentColumnWidths},fit`
      : "fit";
    grid.setAttribute("data-column-widths", newColumnWidths);

    // Only select direct child rows of this grid, not nested rows from embedded grids
    const rows = Array.from(grid.children).filter((child) =>
      child.classList.contains("row")
    );
    rows.forEach((row) => {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      // add a contenteditable div to the new cell
      const contentEditableDiv = document.createElement("div");
      contentEditableDiv.contentEditable = "true";

      newCell.appendChild(contentEditableDiv);
      row.appendChild(newCell);
    });
  };

  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the column was added.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    const newRows = gridElement.querySelectorAll(".row");
    newRows.forEach((row, index) => {
      const height = prevState.rowHeights[index.toString()];
      if (height) {
        row.setAttribute("data-row-height", height);
      } else {
        row.removeAttribute("data-row-height");
      }
    });
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
  // unlike rows, there are no div.column elements. Instead, columns are represented by the cells in each row. There is also an array of column widths stored in the grid's data attribute.
  // so we need to remove the last cell from each row and the entry in the data-column-widths attribute.
  // Only select direct child rows of this grid, not nested rows from embedded grids
  const rows = Array.from(grid.children).filter((child) =>
    child.classList.contains("row")
  );
  if (rows.length === 0) {
    console.info("No columns to remove from the target grid.");
    return;
  }
  const description = "Remove Last Column";
  const performOperation = () => {
    const columnWidthsAttr = grid.getAttribute("data-column-widths");
    if (!columnWidthsAttr) return;

    const columnWidths = columnWidthsAttr.split(",");
    if (columnWidths.length === 0) return;

    // Remove the last column width
    columnWidths.pop();
    grid.setAttribute("data-column-widths", columnWidths.join(","));

    // Remove the last cell from each row
    rows.forEach((row) => {
      const cells = row.querySelectorAll(".cell");
      if (cells.length > 0) {
        row.removeChild(cells[cells.length - 1]);
      }
    });
  };
  const undoOperation = (
    gridElement: HTMLElement,
    prevState: import("./grid-history").GridState
  ) => {
    // Restore the entire grid state from before the column was removed.
    gridElement.innerHTML = prevState.innerHTML;
    gridElement.setAttribute("data-column-widths", prevState.columnWidths);
    const newRows = gridElement.querySelectorAll(".row");
    newRows.forEach((row, index) => {
      const height = prevState.rowHeights[index.toString()];
      if (height) {
        row.setAttribute("data-row-height", height);
      } else {
        row.removeAttribute("data-row-height");
      }
    });
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
