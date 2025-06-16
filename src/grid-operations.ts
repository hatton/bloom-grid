import { gridHistoryManager } from "./grid-history";

export const getTargetGrid = (): HTMLElement | null => {
  return document.getElementById("main-grid");
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
      newCell.textContent = `New Row Cell ${i + 1}`;
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

  const rows = grid.querySelectorAll("#main-grid > .row");
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

    const rows = grid.querySelectorAll(".row");
    rows.forEach((row) => {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      newCell.textContent = "New Col Cell";
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
