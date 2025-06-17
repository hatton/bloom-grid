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
  columnLeftEdge?: number;
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
    gridHistoryManager.attachGrid(div); // Add event listeners
    div.addEventListener("mousemove", this.updateCursorOnMouseMove);
    div.addEventListener("mousedown", this.handleMouseDown);
    div.addEventListener("dblclick", this.handleDoubleClick);
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
    gridHistoryManager.detachGrid(div); // Remove event listeners
    div.removeEventListener("mousemove", this.updateCursorOnMouseMove);
    div.removeEventListener("mousedown", this.handleMouseDown);
    div.removeEventListener("dblclick", this.handleDoubleClick);
    div.removeEventListener("mouseleave", this.handleMouseLeave);

    // If no grids are attached, remove global listeners
    if (this.attachedGrids.size === 0) {
      document.removeEventListener("mousemove", this.handleGlobalMouseMove);
      document.removeEventListener("mouseup", this.handleGlobalMouseUp);
    }
  }

  // This just handles the cursor. Unfortunately it gets called repeatedly even when we're not doing anything.
  private updateCursorOnMouseMove = (event: MouseEvent): void => {
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
    const resizeInfo = this.getResizeInfo(target, event, true);

    if (resizeInfo) {
      event.preventDefault();

      // Always capture the left edge position for column resizing
      let columnLeftEdge: number | undefined;
      if (resizeInfo.type === "column") {
        columnLeftEdge = this.getColumnLeftEdge(resizeInfo.element, resizeInfo.index);
      }

      this.dragState = {
        isDragging: true,
        dragType: resizeInfo.type,
        targetElement: resizeInfo.element,
        targetIndex: resizeInfo.index,
        startX: event.clientX,
        startY: event.clientY,
        originalValue: resizeInfo.currentValue,
        hasStartedOperation: false,
        columnLeftEdge: columnLeftEdge,
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
      // console.info(
      //   `handleGlobalMouseMove: Resizing row at index ${this.dragState.targetIndex}`
      // );
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
    //console.info("commitResizeOperation: Invoked.");
    if (!this.dragState.targetElement || !this.dragState.dragType) {
      //console.info("commitResizeOperation: Missing targetElement or dragType.");
      return;
    }

    const grid =
      this.dragState.dragType === "column"
        ? this.dragState.targetElement
        : this.findParentGrid(this.dragState.targetElement, false);
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
      undoOperation = (gridElement) => {
        // We need to revert the specific column to its capturedOriginalValue.
        const currentWidths =
          gridElement.getAttribute("data-column-widths") || "";
        const columnWidthsArray = currentWidths.split(",");
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
      undoOperation = (gridElement) => {
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
  }  private updateColumnWidthPreview(grid: HTMLElement, deltaX: number): void {
    const currentWidths = grid.getAttribute("data-column-widths") || "";
    const widthArray = currentWidths.split(",");

    // Simple approach: always use column left edge + current mouse position
    const currentMouseX = this.dragState.startX + deltaX;
    const newWidth = Math.max(50, currentMouseX - (this.dragState.columnLeftEdge || 0));

    if (this.dragState.targetIndex < widthArray.length) {
      widthArray[this.dragState.targetIndex] = `${newWidth}px`;
      grid.setAttribute("data-column-widths", widthArray.join(","));
    }
  }
  private updateRowHeightPreview(row: HTMLElement, deltaY: number): void {
    const currentHeight = this.dragState.originalValue;

    // Convert deltaY to a percentage change
    const deltaPercent = deltaY / 5; // Adjust sensitivity as needed
    let newHeight: string;

    if (
      currentHeight === "fit" ||
      currentHeight === "fill" ||
      currentHeight === "min-content"
    ) {
      // Start with a base percentage when converting from auto-sizing values
      newHeight = `${Math.max(5, 20 + deltaPercent)}%`;
    } else {
      const match = currentHeight.match(/^(\d+(?:\.\d+)?)(rem|px|%)$/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];

        if (unit === "%") {
          // Already percentage, just adjust
          newHeight = `${Math.max(5, value + deltaPercent)}%`;
        } else {
          // Convert from other units to percentage
          // For simplicity, we'll start with a base percentage and adjust
          newHeight = `${Math.max(5, 20 + deltaPercent)}%`;
        }
      } else {
        // Fallback to percentage
        newHeight = `${Math.max(5, 20 + deltaPercent)}%`;
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
      columnLeftEdge: undefined,
    };
  }

  private getResizeInfo(
    target: HTMLElement,
    event: MouseEvent,
    verbose: boolean = false
  ): {
    type: "row" | "column";
    element: HTMLElement;
    currentValue: string;
    index: number;
  } | null {
    //console.info("getResizeInfo: Invoked.");
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const edgeThreshold = 5; // pixels from edge to trigger resize

    // Check if we're near the bottom edge (row resize)
    if (y >= rect.height - edgeThreshold && y <= rect.height) {
      const row = this.findRowOfCell(target, verbose);
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

    // Check if we're near the right edge (column resize)
    if (x >= rect.width - edgeThreshold && x <= rect.width) {
      const grid = this.findParentGrid(target, verbose);
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

    return null;
  }

  private tagInfo(element: HTMLElement): string {
    const siblingElements = element.parentElement?.children || [];
    const elementIndex = Array.from(siblingElements).indexOf(element);

    const tagName = element.tagName;
    const id = element.id ? `#${element.id}` : "";
    const classes = element.classList.length
      ? "." + Array.from(element.classList).join(".")
      : "";

    return `${tagName}${id}${classes} child:${1 + elementIndex} ${Array.from(
      element.attributes
    )
      .filter(
        (attr) =>
          attr.name !== "class" && attr.name !== "id" && attr.name != "style"
      ) // Skip class and id attributes
      .map((attr) => `${attr.name}="${attr.value}"`)
      .join(", ")}  ${element.innerText.trim().substring(0, 20)}`;
  }

  private findParentGrid(
    element: HTMLElement,
    verbose: boolean
  ): HTMLElement | null {
    let current = element;
    while (current && current !== document.body) {
      // print out the contents of the element with all of its attributes but not the children
      if (verbose) {
        console.info(`findParentGrid(${this.tagInfo(element)})`);
      }
      if (current.classList.contains("grid")) {
        // Ensure the grid is not nested within another cell
        const parentCell = current.closest(".cell");
        if (!parentCell || !parentCell.closest(".grid")) {
          if (verbose) {
            console.info(`    --> ${this.tagInfo(current)}`);
          }
          return current;
        } else {
          if (verbose) console.info("findParentGrid: Skipping nested grid.");
        }
      }
      current = current.parentElement as HTMLElement;
    }
    if (verbose) {
      console.info("findParentGrid: Could not find main grid.");
    }
    return null;
  }

  private findRowOfCell(
    element: HTMLElement,
    verbose: boolean = false
  ): HTMLElement | null {
    if (verbose) {
      console.info(`findRowOfCell(${this.tagInfo(element)})`);
    }
    const parent = element.parentElement;
    // throw an error if the parent is not a row
    if (!parent || !parent.classList.contains("row")) {
      if (verbose) {
        console.warn(
          `findRowOfCell: Element ${this.tagInfo(element)} is not inside a row.`
        );
      }
      return null;
    }
    if (verbose) {
      console.info(`    --> ${this.tagInfo(parent)}`);
    }
    return parent;
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

  private getRowIndex(row: HTMLElement, verbose: boolean = false): number {
    if (verbose) {
      console.info(`getRowIndex(${this.tagInfo(row)})`);
    }
    // const grid = this.findParentGrid(row, verbose);
    // if (!grid) {
    //   if (verbose) {
    //     console.info("getRowIndex: Could not find parent grid for row.");
    //   }
    //   return -1;
    // }

    // // Filter rows that are direct children of the main grid and not nested
    // const rows = Array.from(grid.children).filter((child) => {
    //   const isRow = child.classList.contains("row");
    //   const isDirectChild = child.parentElement === grid;
    //   const isNotNested = !child.closest(".cell .grid");
    //   return isRow && isDirectChild && isNotNested;
    // });

    // // console.info(
    // //   `getRowIndex: Direct rows in grid: ${rows
    // //     .map((r) => r.outerHTML)
    // //     .join("\n")}`
    // // );

    // const index = rows.indexOf(row);
    // if (index === -1) {
    //   if (verbose) console.warn("getRowIndex: Row not found in filtered rows.");
    // }
    // if (verbose) {
    //   console.info(`    ----> ${index}`);
    // }
    // just return the index of this element from its parent

    return Array.from(row.parentElement!.children).indexOf(row);
  }

  private getSpanValue(element: HTMLElement, cssVar: string): number {
    const style = getComputedStyle(element);
    const value = style.getPropertyValue(cssVar).trim();
    return value ? parseInt(value, 10) : 1;
  }
  private handleDoubleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const resizeInfo = this.getResizeInfo(target, event);

    if (resizeInfo && resizeInfo.type === "row") {
      event.preventDefault();

      const rowElement = resizeInfo.element;
      const currentHeight = rowElement.getAttribute("data-row-height") || "fit";

      // Set up the auto-sizing operation
      const grid = this.findParentGrid(rowElement, false);
      if (!grid) {
        console.warn("HandleDoubleClick: Could not find parent grid.");
        return;
      }

      const rowIndex = resizeInfo.index;
      const description = `Auto-size Row ${rowIndex + 1}`;
      const performOperation = () => {
        rowElement.removeAttribute("data-row-height");
      };

      const undoOperation = (gridElement: HTMLElement) => {
        const rows = gridElement.querySelectorAll(".row");
        if (rowIndex >= 0 && rowIndex < rows.length) {
          const rowToRestore = rows[rowIndex] as HTMLElement;
          if (currentHeight && currentHeight !== "fit") {
            rowToRestore.setAttribute("data-row-height", currentHeight);
          } else {
            rowToRestore.removeAttribute("data-row-height");
          }
        }
      };
      gridHistoryManager.addHistoryEntry(
        grid,
        description,
        performOperation,
        undoOperation
      );
    } else if (resizeInfo && resizeInfo.type === "column") {
      event.preventDefault();

      const grid = this.findParentGrid(resizeInfo.element, false);
      if (!grid) {
        console.warn("HandleDoubleClick: Could not find parent grid.");
        return;
      }

      const columnIndex = resizeInfo.index;
      const currentWidths = grid.getAttribute("data-column-widths") || "";
      const widthArray = currentWidths.split(",");
      const currentWidth =
        columnIndex < widthArray.length ? widthArray[columnIndex] : "fit";

      const description = `Auto-size Column ${columnIndex + 1}`;

      const performOperation = () => {
        const currentWidths = grid.getAttribute("data-column-widths") || "";
        const widthArray = currentWidths.split(",");
        if (columnIndex >= 0 && columnIndex < widthArray.length) {
          widthArray[columnIndex] = "fit";
          grid.setAttribute("data-column-widths", widthArray.join(","));
        }
      };

      const undoOperation = (gridElement: HTMLElement) => {
        const currentWidths =
          gridElement.getAttribute("data-column-widths") || "";
        const widthArray = currentWidths.split(",");
        if (columnIndex >= 0 && columnIndex < widthArray.length) {
          widthArray[columnIndex] = currentWidth;
          gridElement.setAttribute("data-column-widths", widthArray.join(","));
        }
      };

      gridHistoryManager.addHistoryEntry(
        grid,
        description,
        performOperation,
        undoOperation
      );
    }
  };

  private calculateActualColumnWidth(
    grid: HTMLElement,
    columnIndex: number
  ): number {
    // Try to find a cell in the specified column to measure its width
    const rows = grid.querySelectorAll(".row");

    for (const row of rows) {
      const cells = row.querySelectorAll('.cell, [class*="cell"]');
      if (columnIndex < cells.length) {
        const cell = cells[columnIndex] as HTMLElement;
        const rect = cell.getBoundingClientRect();
        return Math.round(rect.width);
      }
    }

    // Fallback: try to calculate based on grid template columns if available
    const computedStyle = window.getComputedStyle(grid);
    const gridTemplateColumns = computedStyle.gridTemplateColumns;

    if (gridTemplateColumns && gridTemplateColumns !== "none") {
      const columns = gridTemplateColumns.split(" ");
      if (columnIndex < columns.length) {
        const columnValue = columns[columnIndex];
        // If it's a pixel value, extract it
        const match = columnValue.match(/(\d+(?:\.\d+)?)px/);
        if (match) {
          return parseFloat(match[1]);
        }
        // If it's a fractional unit or other value, estimate based on grid width
        const gridRect = grid.getBoundingClientRect();
        return Math.round(gridRect.width / columns.length);      }
    }

    // Ultimate fallback
    return 200;
  }

  private getColumnLeftEdge(grid: HTMLElement, columnIndex: number): number {
    // Force layout to ensure we get current measurements
    grid.offsetHeight;
    
    // Try to find a cell in the target column to get its position
    const rows = grid.querySelectorAll(".row");
    
    for (const row of rows) {
      const cells = row.querySelectorAll(".cell");
      let currentColumnIndex = 0;
      
      for (const cell of cells) {
        const cellElement = cell as HTMLElement;
        const colspan = this.getSpanValue(cellElement, "--span-x");
        
        if (currentColumnIndex === columnIndex) {
          const rect = cellElement.getBoundingClientRect();
          const gridRect = grid.getBoundingClientRect();
          return rect.left - gridRect.left;
        }
        
        currentColumnIndex += colspan;
        if (currentColumnIndex > columnIndex) break;
      }
    }
    
    // Fallback: calculate based on grid computed style
    const computedStyle = window.getComputedStyle(grid);
    const gridTemplateColumns = computedStyle.gridTemplateColumns;
    
    if (gridTemplateColumns && gridTemplateColumns !== "none") {
      const columnWidths = gridTemplateColumns.split(' ');
      let leftPosition = 0;
      
      for (let i = 0; i < columnIndex && i < columnWidths.length; i++) {
        const match = columnWidths[i].match(/([0-9.]+)px/);
        if (match) {
          leftPosition += parseFloat(match[1]);
        }
      }
      
      return leftPosition;
    }
    
    // Ultimate fallback
    return 0;
  }
}

// Export a singleton instance
export const gridUI = new GridUI();
