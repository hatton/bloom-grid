/**
 * Grid Operations Module
 *
 * This module provides functions for manipulating table-like grids represented as HTML elements.
 *
 * ## Grid Representation
 *
 * Grids are represented using a simple but flexible HTML structure:
 *
 * ### HTML Structure:
 * ```html
 * <div class="grid" data-column-widths="100px,fit" data-row-heights="50px,60px">
 *   <div class="cell">Cell 0,0</div>
 *   <div class="cell">Cell 0,1</div>
 *   <div class="cell">Cell 1,0</div>
 *   <div class="cell">Cell 1,1</div>
 * </div>
 * ```
 *
 * ### Key Components:
 *
 * 1. **Grid Container**: A div with class "grid"
 *    - `data-column-widths`: Comma-separated list of column widths (e.g., "100px,200px,fit")
 *    - `data-row-heights`: Comma-separated list of row heights (e.g., "50px,60px,fit")
 *
 * 2. **Cell Elements**: Direct children divs with class "cell"
 *    - Ordered left-to-right, top-to-bottom in the DOM
 *    - Can have CSS custom properties for spanning:
 *      - `--span-x`: Number of columns to span (default: 1)
 *      - `--span-y`: Number of rows to span (default: 1)
 *
 * ### Cell Positioning:
 * - Cells are positioned in DOM order: [0,0], [0,1], [1,0], [1,1], etc.
 * - Cell spans affect logical positioning but not DOM order
 * - A cell spanning 2 columns will "cover" the cell to its right
 * - A cell spanning 2 rows will "cover" the cell below it
 *
 * ### Spanning Behavior:
 * - When a cell spans multiple columns/rows, the covered cells are REMOVED from the DOM
 * - Only cells in the direct span path are removed (not diagonal cells)
 * - Example: cell[0,0] spanning 2x2 removes cell[0,1] and cell[1,0] but NOT cell[1,1]
 *
 * ### Size Values:
 * - "fit": CSS Grid minmax(max-content,max-content) - size to content
 * - "fill": CSS Grid minmax(0,1fr) - expand to fill available space
 * - Standard CSS units: "100px", "2rem", "50%", etc.
 */

import { gridHistoryManager } from "./grid-history";

/**
 * Runtime assertion function that throws an error if the condition is false.
 * Used throughout grid operations to validate parameters and state.
 * This helps catch programming errors early with clear error messages.
 *
 * @param condition The condition to check
 * @param message The error message to throw if the condition is false
 * @throws {Error} If the condition is false
 */
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

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
  //assert(grid instanceof HTMLElement, "grid parameter must be an HTMLElement");
  assert(
    grid.classList.contains("grid"),
    "grid parameter must have 'grid' class"
  );

  const description = "Add Row";
  const performOperation = () => {
    const columnWidthsAttr = grid.getAttribute("data-column-widths");
    const numColumns = columnWidthsAttr
      ? columnWidthsAttr.split(",").length
      : 1;

    assert(numColumns > 0, "Grid must have at least one column");

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

/**
 * Extracts grid information from a grid element's data attributes and current state.
 * This is a key utility function used throughout the codebase for grid operations.
 *
 * The grid stores its structure in data attributes:
 * - data-column-widths: comma-separated list of column widths
 * - data-row-heights: comma-separated list of row heights
 *
 * The actual cell count is determined by counting DOM elements with class "cell".
 *
 * @param grid The grid container element
 * @returns Object containing grid dimensions and cell information
 */
export function getGridInfo(grid: HTMLElement): {
  columnCount: number;
  rowCount: number;
  columnWidths: string[];
  rowHeights: string[];
  cellCount: number;
} {
  // Parse column widths from data attribute, filtering out empty values
  const columnWidths = (grid.getAttribute("data-column-widths") || "")
    .split(",")
    .filter((width) => width.trim() !== "");
  // Parse row heights from data attribute, filtering out empty values
  const rowHeights = (grid.getAttribute("data-row-heights") || "")
    .split(",")
    .filter((height) => height.trim() !== "");
  // Count actual cell elements in the DOM (may differ from expected due to spans)
  const cellCount = grid.querySelectorAll(":scope > .cell").length;

  return {
    columnWidths,
    rowHeights,
    cellCount,
    columnCount: columnWidths.length,
    rowCount: rowHeights.length,
  };
}

/**
 * Sets the horizontal and vertical span of a cell, which determines how many columns and rows it covers.
 * This function modifies the cell's CSS custom properties (--span-x, --span-y) and removes or adds
 * DOM elements as needed to maintain grid structure.
 *
 * Important: Only cells directly in the span path are removed:
 * - For horizontal spans: removes cells to the right in the same row
 * - For vertical spans: removes cells below in the same column
 * - For combined spans: removes both horizontal and vertical cells (but NOT diagonal cells)
 *
 * Example: In a 2x2 grid, setCellSpan(cell(0,0), 2, 2) will remove cell(0,1) and cell(1,0)
 * but will NOT remove cell(1,1) since it's diagonal to the spanning cell.
 *
 * @param cell The cell element to apply the span to
 * @param newHorizontalSpan Number of columns the cell should span (1 = no span)
 * @param newVerticalSpan Number of rows the cell should span (1 = no span)
 * @throws {Error} If the span would exceed grid boundaries
 */
export function setCellSpan(
  cell: HTMLElement,
  newHorizontalSpan: number,
  newVerticalSpan: number
) {
  // cells have a css properties in their style attribute that defines their span
  // the properties are "--span-x" and "--span-y", e.g.  <div class="cell" style="--span-x: 2">
  // We need to first see what the current values are,
  // then add or remove cells to the right or below as needed,
  // then set the new values.
  // We should throw if the span would exceed the grid bounds.
  const grid = cell.closest<HTMLElement>(".grid");
  assert(!!grid, "Cell must be inside a grid element"); // Get current span values from CSS custom properties, defaulting to 1 if not set
  const currentSpanX = parseInt(cell.style.getPropertyValue("--span-x")) || 1;
  const currentSpanY = parseInt(cell.style.getPropertyValue("--span-y")) || 1;

  // Calculate the new span values (for clarity - could be simplified)
  const newSpanX = newHorizontalSpan;
  const newSpanY = newVerticalSpan;

  // Validate that the new span won't exceed grid boundaries
  const location = getRowAndColumn(grid, cell);
  const gridInfo = getGridInfo(grid);
  const maxColumn = gridInfo.columnCount - location.column;
  const maxRow = gridInfo.rowCount - location.row;
  assert(
    newSpanX <= maxColumn,
    `New horizontal span (${newSpanX}) exceeds grid bounds (${maxColumn})`
  );
  assert(
    newSpanY <= maxRow,
    `New vertical span (${newSpanY}) exceeds grid bounds (${maxRow})`
  );
  // Update CSS custom properties for the new span values
  // Remove the property if span is 1 (default), otherwise set the value
  if (newSpanX == 1) cell.style.removeProperty("--span-x");
  else cell.style.setProperty("--span-x", newSpanX.toString());

  if (newSpanY == 1) cell.style.removeProperty("--span-y");
  else cell.style.setProperty("--span-y", newSpanY.toString()); // If the span increases, we need to remove cells that are now covered by the expanded span.
  // If the span decreases, we need to add cells that are no longer covered by the reduced span.  // If the span increases, we need to remove cells that are now covered by the expanded span.
  // If the span decreases, we need to add cells that are no longer covered by the reduced span.
  // CRITICAL: Collect all cells to remove BEFORE removing any of them!
  // This prevents DOM traversal issues when removing multiple cells
  // (removing one cell changes the DOM structure for subsequent removals)
  const cellsToRemove: HTMLElement[] = [];

  // Handle horizontal span changes (left-to-right spanning)
  if (newSpanX > currentSpanX) {
    // Span increased horizontally - collect cells to the right using DOM traversal
    // We use nextElementSibling because cells are arranged left-to-right in DOM order
    let currentCell = cell;
    for (let i = currentSpanX; i < newSpanX; i++) {
      const cellToRemove = currentCell.nextElementSibling as HTMLElement;
      if (cellToRemove && cellToRemove.classList.contains("cell")) {
        cellsToRemove.push(cellToRemove);
        currentCell = cellToRemove; // Move to next for next iteration
      }
    }
  }

  // Handle vertical span changes (top-to-bottom spanning)
  if (newSpanY > currentSpanY) {
    // Span increased vertically - collect cells below using calculated indices
    // For vertical spans, we can't use nextElementSibling because cells below
    // are separated by other cells in the same row
    const gridInfo = getGridInfo(grid);
    const columnsPerRow = gridInfo.columnCount;

    for (let i = currentSpanY; i < newSpanY; i++) {
      // Calculate the linear index of the cell to remove
      // Formula: (targetRow * columnsPerRow) + targetColumn
      const targetRow = location.row + i;
      const cellIndex = targetRow * columnsPerRow + location.column;

      const allCells = Array.from(
        grid.querySelectorAll(":scope > .cell")
      ) as HTMLElement[];
      if (cellIndex < allCells.length) {
        const cellToRemove = allCells[cellIndex];
        // Avoid duplicates (important for combined horizontal+vertical spans)
        if (!cellsToRemove.includes(cellToRemove)) {
          cellsToRemove.push(cellToRemove);
        }
      }
    }
  }

  // Remove all collected cells at once (safe because we collected them first)
  cellsToRemove.forEach((cellToRemove) => {
    grid.removeChild(cellToRemove);
  });
  // Handle adding cells back when span decreases (opposite operations)
  if (newSpanX < currentSpanX) {
    // Span decreased horizontally - add new cells to the right
    for (let i = newSpanX; i < currentSpanX; i++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      // Insert immediately after the spanning cell
      cell.insertAdjacentElement("afterend", newCell);
    }
  }

  if (newSpanY < currentSpanY) {
    // Span decreased vertically - add new cells below
    // TODO: This currently just appends cells, which may not preserve correct grid order
    // For proper implementation, we'd need to calculate correct insertion positions
    for (let i = newSpanY; i < currentSpanY; i++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      grid.appendChild(newCell);
    }
  }
}

/**
 * Calculates the logical row and column position of a cell within the grid.
 * This is complex because cells can have spans, so we need to traverse all cells
 * and account for their spans to determine actual positions.
 *
 * The algorithm:
 * 1. Walk through all cells in DOM order (left-to-right, top-to-bottom)
 * 2. For each cell, check its span values (--span-x, --span-y)
 * 3. Advance the current position by the span amount
 * 4. When we exceed column count, wrap to next row
 *
 * @param grid The grid container element
 * @param cell The cell whose position we want to find
 * @returns Object with row and column (0-based indices)
 * @throws {Error} If the cell is not found in the grid
 */
function getRowAndColumn(
  grid: HTMLElement,
  cell: HTMLElement
): { row: number; column: number } {
  assert(
    grid.classList.contains("grid"),
    "grid parameter must have 'grid' class"
  );
  assert(
    cell.classList.contains("cell"),
    "cell parameter must have 'cell' class"
  );
  const gridInfo = getGridInfo(grid);
  const columnCount = gridInfo.columnCount;

  if (columnCount === 0) {
    throw new Error("Grid has no columns defined");
  }

  // Get all cells in DOM order (this is the order they appear in the HTML)
  const cells = Array.from(
    grid.querySelectorAll(":scope > .cell")
  ) as HTMLElement[];

  // Track our current logical position as we traverse cells
  let currentColumn = 0;
  let currentRow = 0;

  for (const currentCell of cells) {
    // Check if this is the target cell we're looking for
    if (currentCell === cell) {
      return { row: currentRow, column: currentColumn };
    }

    // Get the span of the current cell (defaults to 1 if not set)
    const spanX = parseInt(currentCell.style.getPropertyValue("--span-x")) || 1;
    const spanY = parseInt(currentCell.style.getPropertyValue("--span-y")) || 1;

    // Advance our position by the cell's horizontal span
    currentColumn += spanX;

    // If we've exceeded the column count, wrap to the next row
    // and advance by the cell's vertical span
    if (currentColumn >= columnCount) {
      currentColumn = 0;
      currentRow += spanY;
    }
  }

  // If we reach here, the cell was not found in the grid
  throw new Error("Cell not found in the specified grid");
}

/**
 * Retrieves the cell element at the specified logical row and column position.
 * This is the inverse of getRowAndColumn - given a position, find the cell.
 *
 * Like getRowAndColumn, this must account for cell spans when traversing the grid.
 * It uses the same algorithm but stops when it reaches the target position.
 *
 * @param grid The grid container element
 * @param row The target row (0-based)
 * @param column The target column (0-based)
 * @returns The HTMLElement at the specified position
 * @throws {Error} If the position is out of bounds or no cell is found
 */
export function getCell(
  grid: HTMLElement,
  row: number,
  column: number
): HTMLElement {
  // Check that grid is an HTMLElement (or derivative)
  // No need to check instanceof HTMLElement since HTMLDivElement and other specific elements will pass this check
  // The presence of the 'grid' class is sufficient for our validation
  assert(
    grid.classList.contains("grid"),
    "grid parameter must have 'grid' class"
  );

  const gridInfo = getGridInfo(grid);
  assert(
    row >= 0 && row < gridInfo.rowCount,
    `Row index ${row} would be out of bounds`
  );
  assert(
    column >= 0 && column < gridInfo.columnCount,
    `Column index ${column} would be out of bounds`
  );

  const cells = Array.from(
    grid.querySelectorAll(":scope > .cell")
  ) as HTMLElement[];

  let currentRow = 0;
  let currentColumn = 0;

  for (const cell of cells) {
    const spanX = parseInt(cell.style.getPropertyValue("--span-x")) || 1;
    const spanY = parseInt(cell.style.getPropertyValue("--span-y")) || 1;

    if (currentRow === row && currentColumn === column) {
      return cell;
    }

    currentColumn += spanX;

    if (currentColumn >= gridInfo.columnCount) {
      currentColumn = 0;
      currentRow += spanY;
    }
  }

  throw new Error(`Cell at row ${row}, column ${column} not found`);
}

/**
 * Adds a column at the specified index position.
 * @param grid The grid container element
 * @param index The position to insert the column (0-based). If not provided, adds at the end.
 * @param skipHistory Whether to skip adding this operation to history
 */
export const addColumnAt = (
  grid: HTMLElement,
  index?: number,
  skipHistory = false
): void => {
  if (!grid) return;

  const gridInfo = getGridInfo(grid);
  const actualIndex = index ?? gridInfo.columnCount;

  assert(
    actualIndex >= 0 && actualIndex <= gridInfo.columnCount,
    `Column index ${actualIndex} is out of bounds`
  );

  const description = `Add Column at ${actualIndex}`;
  const performOperation = () => {
    const currentColumnWidths = grid.getAttribute("data-column-widths") || "";
    const columnWidths = currentColumnWidths
      ? currentColumnWidths.split(",")
      : [];

    // Insert new column width at the specified index
    columnWidths.splice(actualIndex, 0, defaultColumnWidth);
    grid.setAttribute("data-column-widths", columnWidths.join(","));

    const rowHeightsAttr = grid.getAttribute("data-row-heights") || "";
    const numRows = rowHeightsAttr ? rowHeightsAttr.split(",").length : 0;
    if (numRows === 0) return;

    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));
    const originalColumnCount = gridInfo.columnCount; // Use the original count for positioning

    // Insert new cells at the appropriate positions
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      const contentEditableDiv = document.createElement("div");
      contentEditableDiv.contentEditable = "true";
      newCell.appendChild(contentEditableDiv); // Calculate where to insert the new cell based on original grid structure
      const insertPosition = rowIndex * originalColumnCount + actualIndex;
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

/**
 * Adds a row at the specified index position.
 * @param grid The grid container element
 * @param index The position to insert the row (0-based). If not provided, adds at the end.
 * @param skipHistory Whether to skip adding this operation to history
 */
export const addRowAt = (
  grid: HTMLElement,
  index?: number,
  skipHistory = false
): void => {
  if (!grid) return;

  const gridInfo = getGridInfo(grid);
  const actualIndex = index ?? gridInfo.rowCount;

  assert(
    actualIndex >= 0 && actualIndex <= gridInfo.rowCount,
    `Row index ${actualIndex} is out of bounds`
  );

  const description = `Add Row at ${actualIndex}`;
  const performOperation = () => {
    const currentRowHeights = grid.getAttribute("data-row-heights") || "";
    const rowHeights = currentRowHeights ? currentRowHeights.split(",") : [];

    // Insert new row height at the specified index
    rowHeights.splice(actualIndex, 0, defaultRowHeight);
    grid.setAttribute("data-row-heights", rowHeights.join(","));

    const numColumns = gridInfo.columnCount;
    if (numColumns === 0) return;

    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));

    // Insert new cells for the entire row
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      const newCell = document.createElement("div");
      newCell.className = "cell";
      newCell.innerHTML = `<div contenteditable="true"></div>`;

      // Calculate where to insert the new cell
      const insertPosition = actualIndex * numColumns + colIndex;
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

/**
 * Removes a column at the specified index position, adjusting spans as needed.
 * @param grid The grid container element
 * @param index The column index to remove (0-based)
 */
export const removeColumnAt = (grid: HTMLElement, index: number): void => {
  if (!grid) return;

  const gridInfo = getGridInfo(grid);

  assert(gridInfo.columnCount > 1, "Cannot remove the only column");
  assert(
    index >= 0 && index < gridInfo.columnCount,
    `Column index ${index} is out of bounds`
  );
  const description = `Remove Column at ${index}`;
  const performOperation = () => {
    // Collect all cell information BEFORE making any changes
    const cells = Array.from(
      grid.querySelectorAll(":scope > .cell")
    ) as HTMLElement[];
    const cellsToRemove: HTMLElement[] = [];
    const spansToAdjust: { cell: HTMLElement; newSpanX: number }[] = [];

    // Analyze each cell before making changes
    for (const cell of cells) {
      const position = getRowAndColumn(grid, cell);
      const spanX = parseInt(cell.style.getPropertyValue("--span-x")) || 1;

      const cellStartCol = position.column;
      const cellEndCol = cellStartCol + spanX - 1;

      if (cellStartCol === index) {
        // Cell starts at the column being removed
        if (spanX > 1) {
          // Reduce span and keep the cell
          spansToAdjust.push({ cell, newSpanX: spanX - 1 });
        } else {
          // Single-column cell at the removed column - remove it
          cellsToRemove.push(cell);
        }
      } else if (cellStartCol < index && cellEndCol >= index) {
        // Cell spans across the column being removed - reduce span
        spansToAdjust.push({ cell, newSpanX: spanX - 1 });
      }
    }

    // Update column widths
    const columnWidths = gridInfo.columnWidths;
    columnWidths.splice(index, 1);
    grid.setAttribute("data-column-widths", columnWidths.join(","));

    // Apply span adjustments using direct style manipulation to avoid setCellSpan's DOM traversal
    for (const { cell, newSpanX } of spansToAdjust) {
      if (newSpanX === 1) {
        cell.style.removeProperty("--span-x");
      } else {
        cell.style.setProperty("--span-x", newSpanX.toString());
      }
    }

    // Remove cells that need to be removed
    for (const cell of cellsToRemove) {
      grid.removeChild(cell);
    }
  };

  gridHistoryManager.addHistoryEntry(grid, description, performOperation);
};

/**
 * Removes a row at the specified index position, adjusting spans as needed.
 * @param grid The grid container element
 * @param index The row index to remove (0-based)
 */
export const removeRowAt = (grid: HTMLElement, index: number): void => {
  if (!grid) return;

  const gridInfo = getGridInfo(grid);

  assert(gridInfo.rowCount > 1, "Cannot remove the only row");
  assert(
    index >= 0 && index < gridInfo.rowCount,
    `Row index ${index} is out of bounds`
  );
  const description = `Remove Row at ${index}`;
  const performOperation = () => {
    // Collect all cell information BEFORE making any changes
    const cells = Array.from(
      grid.querySelectorAll(":scope > .cell")
    ) as HTMLElement[];
    const cellsToRemove: HTMLElement[] = [];
    const spansToAdjust: { cell: HTMLElement; newSpanY: number }[] = [];

    // Analyze each cell before making changes
    for (const cell of cells) {
      const position = getRowAndColumn(grid, cell);
      const spanY = parseInt(cell.style.getPropertyValue("--span-y")) || 1;

      const cellStartRow = position.row;
      const cellEndRow = cellStartRow + spanY - 1;

      if (cellStartRow === index) {
        // Cell starts at the row being removed
        if (spanY > 1) {
          // Reduce span and keep the cell
          spansToAdjust.push({ cell, newSpanY: spanY - 1 });
        } else {
          // Single-row cell at the removed row - remove it
          cellsToRemove.push(cell);
        }
      } else if (cellStartRow < index && cellEndRow >= index) {
        // Cell spans across the row being removed - reduce span
        spansToAdjust.push({ cell, newSpanY: spanY - 1 });
      }
    }

    // Update row heights
    const rowHeights = gridInfo.rowHeights;
    rowHeights.splice(index, 1);
    grid.setAttribute("data-row-heights", rowHeights.join(","));

    // Apply span adjustments using direct style manipulation
    for (const { cell, newSpanY } of spansToAdjust) {
      if (newSpanY === 1) {
        cell.style.removeProperty("--span-y");
      } else {
        cell.style.setProperty("--span-y", newSpanY.toString());
      }
    }

    // Remove cells that need to be removed
    for (const cell of cellsToRemove) {
      grid.removeChild(cell);
    }
  };

  gridHistoryManager.addHistoryEntry(grid, description, performOperation);
};
