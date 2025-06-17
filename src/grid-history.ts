export interface GridState {
  innerHTML: string;
  columnWidths: string;
  rowHeights: { [key: string]: string };
  gridStyles: { [key: string]: string };
}

export interface HistoryEntry {
  state: GridState; // The state *before* the operation was performed
  timestamp: number;
  description: string;
  undoOperation: (grid: HTMLElement, prevState: GridState) => void;
}

class GridHistoryManager {
  private history: HistoryEntry[] = [];
  private maxHistorySize: number = 50;
  private attachedGrids = new Set<HTMLElement>();
  private operationInProgress = false; // Prevents nested or concurrent operations

  private captureGridState(grid: HTMLElement): GridState {
    // Capture row heights from all rows
    const rowHeights: { [key: string]: string } = {};
    const rows = grid.querySelectorAll(".row");
    rows.forEach((row, index) => {
      const height = row.getAttribute("data-row-height");
      if (height) {
        rowHeights[index.toString()] = height;
      }
    });

    // Capture relevant grid styles
    const gridStyles: { [key: string]: string } = {};
    const computedStyle = getComputedStyle(grid);
    gridStyles["display"] = computedStyle.display;
    gridStyles["grid-template-columns"] = computedStyle.gridTemplateColumns;
    gridStyles["grid-template-rows"] = computedStyle.gridTemplateRows;

    return {
      innerHTML: grid.innerHTML,
      columnWidths: grid.getAttribute("data-column-widths") || "",
      rowHeights: rowHeights,
      gridStyles: gridStyles,
    };
  }

  addHistoryEntry(
    grid: HTMLElement,
    description: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    performOperation: () => void, // The function that actually performs the DOM change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    undoOperation: (grid: HTMLElement, prevState: GridState) => void
  ): void {
    if (!grid || !this.isAttached(grid)) {
      console.warn(
        "GridHistoryManager: Attempted to add history entry for a detached or null grid."
      );
      return;
    }
    if (this.operationInProgress) {
      console.warn(
        "GridHistoryManager: Operation already in progress. Skipping new history entry."
      );
      return;
    }

    //console.info(`GridHistoryManager: Adding history entry - ${description}`);
    // Capture the state of the grid

    const stateBeforeOperation = this.captureGridState(grid);

    this.operationInProgress = true;
    let operationSuccess = false;
    try {
      performOperation(); // Execute the actual operation
      operationSuccess = true;

      // If the operation was successful, add it to history
      const entry: HistoryEntry = {
        state: stateBeforeOperation,
        timestamp: Date.now(),
        description,
        undoOperation,
      };
      this.history.push(entry);
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
      //console.info(`GridHistoryManager: Added entry - ${description}`);
    } catch (error) {
      console.error(
        "GridHistoryManager: Error during operation execution:",
        error
      );
      // Optionally, try to restore the previous state if performOperation fails mid-way
      // This would require performOperation to be transactional or the restoration logic to be robust.
    } finally {
      this.operationInProgress = false;
      //console.log(
      //`GridHistoryManager: Add entry finished. operationInProgress: ${this.operationInProgress}. Dispatching event.`
      //);
      // Dispatch a custom event to notify that an operation has completed and history has been updated
      // Only dispatch if the operation was meant to add a history entry (even if it failed, to update UI)
      // However, we only pushed to history on success.
      if (operationSuccess) {
        // Only dispatch if entry was actually added
        const event = new CustomEvent("gridHistoryUpdated", {
          detail: { operation: description, canUndo: this.canUndo() },
        });
        document.dispatchEvent(event);
      }
    }
  }

  undo(grid: HTMLElement): boolean {
    if (!this.canUndo()) {
      // This console.warn is already inside canUndo if it's due to operationInProgress
      // but good to have a specific one for the undo action itself.
      console.warn(
        "GridHistoryManager: Cannot undo. Either history is empty or an operation is in progress."
      );
      return false;
    }

    const entry = this.history.pop();
    if (!entry) {
      // This case should ideally be caught by this.history.length > 0 in canUndo,
      // but as a safeguard:
      console.warn("GridHistoryManager: History is empty, cannot undo.");
      return false;
    }

    //console.info(`GridHistoryManager: Undoing - ${entry.description}`);
    this.operationInProgress = true;
    let undoSuccess = false;
    try {
      entry.undoOperation(grid, entry.state);
      undoSuccess = true;
      //console.info(
      //  `GridHistoryManager: Successfully undid - ${entry.description}`
      //);
    } catch (error) {
      console.error("GridHistoryManager: Error during undo operation:", error);
      // If undo fails, the entry is already popped.
      // Depending on desired behavior, could re-add it or log for manual recovery.
      // For now, it remains popped.
    } finally {
      this.operationInProgress = false;
      //console.log(
      //        `GridHistoryManager: Undo operation finished. operationInProgress: ${this.operationInProgress}. Dispatching event.`
      //    );
      // Dispatch event AFTER operationInProgress is false, regardless of undo success, to update UI
      const event = new CustomEvent("gridHistoryUpdated", {
        detail: {
          operation: `Undo ${entry.description}`,
          undoSuccess: undoSuccess,
          canUndo: this.canUndo(),
        },
      });
      document.dispatchEvent(event);
    }
    return undoSuccess;
  }

  attachGrid(grid: HTMLElement): void {
    this.attachedGrids.add(grid);
    //console.info("GridHistoryManager: Grid attached.");
  }

  detachGrid(grid: HTMLElement): void {
    this.attachedGrids.delete(grid);
    //console.info("GridHistoryManager: Grid detached.");
  }

  isAttached(grid: HTMLElement): boolean {
    return this.attachedGrids.has(grid);
  }

  canUndo(): boolean {
    return this.history.length > 0 && !this.operationInProgress;
  }

  getLastOperation(): string | null {
    if (this.history.length === 0) {
      return null;
    }
    return this.history[this.history.length - 1].description;
  }

  clearHistory(): void {
    this.history = [];
    //    console.info("GridHistoryManager: History cleared.");
    // Dispatch a custom event to notify that history has been cleared
    const event = new CustomEvent("gridHistoryUpdated", {
      detail: { operation: "Clear History" },
    });
    document.dispatchEvent(event);
  }
}

export const gridHistoryManager = new GridHistoryManager();
