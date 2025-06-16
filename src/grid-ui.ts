import { gridHistoryManager } from "./grid-history";

interface DragState {
  isDragging: boolean;
  dragType: "row" | "column" | null;
  targetElement: HTMLElement | null;
  targetIndex: number;
  startX: number;
  startY: number;
  originalValue: string;
  hasStartedOperation: boolean;
}

export class GridUI {
  private attachedGrids = new Set<HTMLElement>();
  private dragState: DragState = {
    isDragging: false,
    dragType: null,
    targetElement: null,
    targetIndex: -1,
    startX: 0,
    startY: 0,
    originalValue: "",
    hasStartedOperation: false,
  };

  /**
   * Attach interactive UI handlers to a grid element and register with grid-history
   */
  attach(div: HTMLElement): void {
    if (this.attachedGrids.has(div)) {
      return; // Already attached
    }

    this.attachedGrids.add(div);
    gridHistoryManager.attachGrid(div);

    // Add event listeners
    div.addEventListener("mousemove", this.handleMouseMove);
    div.addEventListener("mousedown", this.handleMouseDown);
    div.addEventListener("mouseleave", this.handleMouseLeave);

    // Add global mouse move and up listeners for dragging
    document.addEventListener("mousemove", this.handleGlobalMouseMove);
    document.addEventListener("mouseup", this.handleGlobalMouseUp);
  }

  /**
   * Detach interactive UI handlers from a grid element and unregister from grid-history
   */
  detach(div: HTMLElement): void {
    if (!this.attachedGrids.has(div)) {
      return; // Not attached
    }

    this.attachedGrids.delete(div);
    gridHistoryManager.detachGrid(div);

    // Remove event listeners
    div.removeEventListener("mousemove", this.handleMouseMove);
    div.removeEventListener("mousedown", this.handleMouseDown);
    div.removeEventListener("mouseleave", this.handleMouseLeave);

    // If no grids are attached, remove global listeners
    if (this.attachedGrids.size === 0) {
      document.removeEventListener("mousemove", this.handleGlobalMouseMove);
      document.removeEventListener("mouseup", this.handleGlobalMouseUp);
    }
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (this.dragState.isDragging) {
      return; // Don't change cursor while dragging
    }

    const target = event.target as HTMLElement;
    const resizeInfo = this.getResizeInfo(target, event);

    if (resizeInfo) {
      target.style.cursor =
        resizeInfo.type === "row" ? "ns-resize" : "ew-resize";
    } else {
      target.style.cursor = "default";
    }
  };

  private handleMouseDown = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const resizeInfo = this.getResizeInfo(target, event);

    if (resizeInfo) {
      event.preventDefault();

      this.dragState = {
        isDragging: true,
        dragType: resizeInfo.type,
        targetElement: resizeInfo.element,
        targetIndex: resizeInfo.index,
        startX: event.clientX,
        startY: event.clientY,
        originalValue: resizeInfo.currentValue,
        hasStartedOperation: false,
      };
    }
  };

  private handleMouseLeave = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    target.style.cursor = "default";
  };

  private handleGlobalMouseMove = (event: MouseEvent): void => {
    if (!this.dragState.isDragging || !this.dragState.targetElement) {
      return;
    }

    event.preventDefault();

    // Start operation on first significant movement
    if (!this.dragState.hasStartedOperation) {
      const deltaX = Math.abs(event.clientX - this.dragState.startX);
      const deltaY = Math.abs(event.clientY - this.dragState.startY);

      if (deltaX > 3 || deltaY > 3) {
        // 3px threshold to avoid accidental operations
        this.dragState.hasStartedOperation = true;
      }
    }

    const deltaX = event.clientX - this.dragState.startX;
    const deltaY = event.clientY - this.dragState.startY;

    if (this.dragState.dragType === "column") {
      this.updateColumnWidthPreview(this.dragState.targetElement, deltaX);
    } else if (this.dragState.dragType === "row") {
      console.info(
        `handleGlobalMouseMove: Resizing row at index ${this.dragState.targetIndex}`
      );
      this.updateRowHeightPreview(this.dragState.targetElement, deltaY);
    }
  };

  private handleGlobalMouseUp = (): void => {
    if (this.dragState.isDragging && this.dragState.hasStartedOperation) {
      // Commit the operation through grid-history
      this.commitResizeOperation();
    }
    this.resetDragState();
  };
  private commitResizeOperation(): void {
    console.info("commitResizeOperation: Invoked.");
    if (!this.dragState.targetElement || !this.dragState.dragType) {
      console.info("commitResizeOperation: Missing targetElement or dragType.");
      return;
    }

    const grid =
      this.dragState.dragType === "column"
        ? this.dragState.targetElement
        : this.findParentGrid(this.dragState.targetElement);
    if (!grid) {
      console.warn("CommitResizeOperation: Could not find parent grid.");
      return;
    }

    const operationType = this.dragState.dragType;
    const targetElement = this.dragState.targetElement; // This is the grid for column, row for row resize

    // Capture these values from the current drag state for the undo closure
    const capturedOriginalValue = this.dragState.originalValue;
    const capturedTargetIndex = this.dragState.targetIndex;

    let description: string;
    let performOperation: () => void;
    let undoOperation: (
      gridElement: HTMLElement,
      prevState: import("./grid-history").GridState
    ) => void;

    if (operationType === "column") {
      const newWidth = this.calculateFinalColumnWidth(targetElement); // targetElement is grid here
      description = `Resize Column ${capturedTargetIndex + 1} to ${newWidth}`;

      performOperation = () => {
        const currentWidths =
          targetElement.getAttribute("data-column-widths") || "";
        const widthArray = currentWidths.split(",");
        if (
          capturedTargetIndex >= 0 &&
          capturedTargetIndex < widthArray.length
        ) {
          widthArray[capturedTargetIndex] = newWidth;
          targetElement.setAttribute(
            "data-column-widths",
            widthArray.join(",")
          );
        }
      };

      undoOperation = (gridElement, prevState) => {
        // prevState.columnWidths reflects the state *after* the preview.
        // We need to revert the specific column to its capturedOriginalValue.
        const columnWidthsArray = prevState.columnWidths.split(",");
        if (
          capturedTargetIndex >= 0 &&
          capturedTargetIndex < columnWidthsArray.length
        ) {
          columnWidthsArray[capturedTargetIndex] = capturedOriginalValue; // Use the value from before drag
        }
        gridElement.setAttribute(
          "data-column-widths",
          columnWidthsArray.join(",")
        );
      };
    } else if (operationType === "row") {
      const rowElement = targetElement; // targetElement is the row here
      const newHeight = this.calculateFinalRowHeight(rowElement);
      description = `Resize Row ${capturedTargetIndex + 1} to ${newHeight}`;

      performOperation = () => {
        rowElement.setAttribute("data-row-height", newHeight);
      };

      undoOperation = (gridElement, prevState) => {
        // gridElement is the parent grid.
        // We need to find the specific row and restore its height using capturedOriginalValue.
        const rows = gridElement.querySelectorAll(".row"); // Query rows from the gridElement passed to undo
        if (capturedTargetIndex >= 0 && capturedTargetIndex < rows.length) {
          const rowToRestore = rows[capturedTargetIndex] as HTMLElement;
          if (capturedOriginalValue && capturedOriginalValue !== "fit") {
            rowToRestore.setAttribute("data-row-height", capturedOriginalValue);
          } else {
            // If original was "fit" or empty (which getAttribute || 'fit' makes 'fit')
            rowToRestore.removeAttribute("data-row-height");
          }
        }
        // The grid-observer will pick up the change to data-row-height and update grid-template-rows.
      };
    } else {
      throw new Error(
        `Unsupported drag type: ${this.dragState.dragType}. Expected 'row' or 'column'.`
      );
    }

    gridHistoryManager.addHistoryEntry(
      grid,
      description,
      performOperation,
      undoOperation
    );
  }

  private calculateFinalColumnWidth(grid: HTMLElement): string {
    const currentWidths = grid.getAttribute("data-column-widths") || "";
    const widthArray = currentWidths.split(",");

    // Get the current temporary width that was set during preview
    if (this.dragState.targetIndex < widthArray.length) {
      return widthArray[this.dragState.targetIndex];
    }
    return "fit";
  }

  private calculateFinalRowHeight(row: HTMLElement): string {
    return row.getAttribute("data-row-height") || "fit";
  }

  private updateColumnWidthPreview(grid: HTMLElement, deltaX: number): void {
    const currentWidths = grid.getAttribute("data-column-widths") || "";
    const widthArray = currentWidths.split(",");

    const deltaPercent = Math.round(deltaX / 10);
    const newWidth = Math.max(50, 200 + deltaPercent);

    if (this.dragState.targetIndex < widthArray.length) {
      widthArray[this.dragState.targetIndex] = `${newWidth}px`;
      grid.setAttribute("data-column-widths", widthArray.join(","));
    }
  }

  private updateRowHeightPreview(row: HTMLElement, deltaY: number): void {
    const deltaRem = deltaY / 16;
    const currentHeight = this.dragState.originalValue;

    let newHeight: string;

    if (currentHeight === "fit" || currentHeight === "fill") {
      newHeight = `${Math.max(2, 4 + deltaRem)}rem`;
    } else {
      const match = currentHeight.match(/^(\d+(?:\.\d+)?)(rem|px|%)$/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];

        if (unit === "rem") {
          newHeight = `${Math.max(1, value + deltaRem)}rem`;
        } else if (unit === "px") {
          newHeight = `${Math.max(16, value + deltaY)}px`;
        } else {
          const deltaPercent = deltaY / 10;
          newHeight = `${Math.max(5, value + deltaPercent)}%`;
        }
      } else {
        newHeight = `${Math.max(2, 4 + deltaRem)}rem`;
      }
    }

    row.setAttribute("data-row-height", newHeight);
  }

  private resetDragState(): void {
    this.dragState = {
      isDragging: false,
      dragType: null,
      targetElement: null,
      targetIndex: -1,
      startX: 0,
      startY: 0,
      originalValue: "",
      hasStartedOperation: false,
    };
  }

  private getResizeInfo(
    target: HTMLElement,
    event: MouseEvent
  ): {
    type: "row" | "column";
    element: HTMLElement;
    currentValue: string;
    index: number;
  } | null {
    console.info("getResizeInfo: Invoked.");
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const edgeThreshold = 5; // pixels from edge to trigger resize

    // Check if we're near the right edge (column resize)
    if (x >= rect.width - edgeThreshold && x <= rect.width) {
      const grid = this.findParentGrid(target);
      if (grid) {
        const columnIndex = this.getColumnIndex(target);
        const columnWidths = grid.getAttribute("data-column-widths") || "";
        const widthArray = columnWidths.split(",");

        if (columnIndex < widthArray.length) {
          return {
            type: "column",
            element: grid,
            currentValue: widthArray[columnIndex] || "fit",
            index: columnIndex,
          };
        }
      }
    }

    // Check if we're near the bottom edge (row resize)
    if (y >= rect.height - edgeThreshold && y <= rect.height) {
      const row = this.findParentRow(target);
      if (row) {
        const currentHeight = row.getAttribute("data-row-height") || "fit";
        const rowIndex = this.getRowIndex(row);
        return {
          type: "row",
          element: row,
          currentValue: currentHeight,
          index: rowIndex,
        };
      }
    }

    return null;
  }

  private findParentGrid(element: HTMLElement): HTMLElement | null {
    let current = element;
    while (current && current !== document.body) {
      console.info(
        `findParentGrid: Checking element ${current.tagName} with classes: ${current.className}`
      );
      if (current.classList.contains("grid")) {
        // Ensure the grid is not nested within another cell
        const parentCell = current.closest(".cell");
        if (!parentCell || !parentCell.closest(".grid")) {
          console.info("findParentGrid: Found main grid.");
          return current;
        } else {
          console.info("findParentGrid: Skipping nested grid.");
        }
      }
      current = current.parentElement as HTMLElement;
    }
    console.info("findParentGrid: Could not find main grid.");
    return null;
  }

  private findParentRow(element: HTMLElement): HTMLElement | null {
    let current = element;
    while (current && current !== document.body) {
      if (current.classList.contains("row")) {
        console.info(`findParentRow: Found parent row with class 'row'.`);
        return current;
      }
      current = current.parentElement as HTMLElement;
    }
    console.info("findParentRow: Could not find parent row.");
    return null;
  }

  private getColumnIndex(element: HTMLElement): number {
    // Find which column this cell is in by counting siblings
    let index = 0;
    let sibling = element.previousElementSibling;

    while (sibling) {
      if (sibling.classList.contains("cell")) {
        const spanX = this.getSpanValue(sibling as HTMLElement, "--span-x");
        index += spanX;
      }
      sibling = sibling.previousElementSibling;
    }

    return index;
  }

  private getRowIndex(row: HTMLElement): number {
    console.info("getRowIndex: Invoked.");
    const grid = this.findParentGrid(row);
    if (!grid) {
      console.info("getRowIndex: Could not find parent grid for row.");
      return -1;
    }

    // Filter rows that are direct children of the main grid and not nested
    const rows = Array.from(grid.children).filter((child) => {
      const isRow = child.classList.contains("row");
      const isDirectChild = child.parentElement === grid;
      const isNotNested = !child.closest(".cell .grid");
      return isRow && isDirectChild && isNotNested;
    });

    console.info(
      `getRowIndex: Direct rows in grid: ${rows
        .map((r) => r.outerHTML)
        .join("\n")}`
    );

    const index = rows.indexOf(row);
    if (index === -1) {
      console.warn("getRowIndex: Row not found in filtered rows.");
    }

    console.info(`getRowIndex: Calculated row index as ${index}`);
    return index;
  }

  private getSpanValue(element: HTMLElement, cssVar: string): number {
    const style = getComputedStyle(element);
    const value = style.getPropertyValue(cssVar).trim();
    return value ? parseInt(value, 10) : 1;
  }
}

// Export a singleton instance
export const gridUI = new GridUI();
