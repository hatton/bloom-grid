export interface GridState {
  innerHTML: string;
  columnWidths: string;
}

export interface HistoryEntry {
  state: GridState;
  timestamp: number;
  operation: string;
}

class GridHistoryManager {
  private history: HistoryEntry[] = [];
  private maxHistorySize: number = 50;

  /**
   * Captures the current state of the grid
   */
  private captureGridState(grid: HTMLElement): GridState {
    return {
      innerHTML: grid.innerHTML,
      columnWidths: grid.getAttribute("data-column-widths") || "",
    };
  }

  /**
   * Saves the current grid state to history before an operation
   */
  saveState(grid: HTMLElement, operation: string): void {
    if (!grid) return;

    const state = this.captureGridState(grid);
    const entry: HistoryEntry = {
      state,
      timestamp: Date.now(),
      operation,
    };

    this.history.push(entry);

    // Limit history size to prevent memory issues
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Restores the grid to the previous state
   */
  undo(grid: HTMLElement): boolean {
    if (!grid || this.history.length === 0) {
      return false;
    }

    const lastEntry = this.history.pop();
    if (!lastEntry) {
      return false;
    }

    // Restore the grid state
    grid.innerHTML = lastEntry.state.innerHTML;

    if (lastEntry.state.columnWidths) {
      grid.setAttribute("data-column-widths", lastEntry.state.columnWidths);
    } else {
      grid.removeAttribute("data-column-widths");
    }

    return true;
  }

  /**
   * Checks if there are any operations that can be undone
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * Gets the number of operations in history
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Gets the last operation name for display purposes
   */
  getLastOperation(): string | null {
    if (this.history.length === 0) {
      return null;
    }
    return this.history[this.history.length - 1].operation;
  }

  /**
   * Clears all history
   */
  clearHistory(): void {
    this.history = [];
  }
}

// Create a singleton instance for the grid history
export const gridHistoryManager = new GridHistoryManager();
