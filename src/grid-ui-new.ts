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
    div.addEventListener("mouseup", this.handleMouseUp);
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
    div.removeEventListener("mouseup", this.handleMouseUp);
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

  private handleMouseUp = (): void => {
    this.resetDragState();
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
    if (!this.dragState.targetElement) return;

    if (this.dragState.dragType === "column") {
      const grid = this.dragState.targetElement;
      const newWidth = this.calculateFinalColumnWidth(grid);

      gridHistoryManager.executeOperation(grid, "resize-column", {
        columnIndex: this.dragState.targetIndex,
        newWidth: newWidth,
      });
    } else if (this.dragState.dragType === "row") {
      const row = this.dragState.targetElement;
      const grid = this.findParentGrid(row);
      const newHeight = this.calculateFinalRowHeight(row);

      if (grid) {
        gridHistoryManager.executeOperation(grid, "resize-row", {
          rowElement: row,
          newHeight: newHeight,
        });
      }
    }
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
      if (current.classList.contains("grid")) {
        return current;
      }
      current = current.parentElement as HTMLElement;
    }
    return null;
  }

  private findParentRow(element: HTMLElement): HTMLElement | null {
    let current = element;
    while (current && current !== document.body) {
      if (current.classList.contains("row")) {
        return current;
      }
      current = current.parentElement as HTMLElement;
    }
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
    const grid = this.findParentGrid(row);
    if (!grid) return -1;

    const rows = Array.from(grid.querySelectorAll(".row"));
    return rows.indexOf(row);
  }

  private getSpanValue(element: HTMLElement, cssVar: string): number {
    const style = getComputedStyle(element);
    const value = style.getPropertyValue(cssVar).trim();
    return value ? parseInt(value, 10) : 1;
  }
}

// Export a singleton instance
export const gridUI = new GridUI();
