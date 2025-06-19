import { it, expect, beforeEach, afterEach } from "vitest";
import {
  addColumn,
  addColumnAt,
  addRow,
  addRowAt,
  defaultColumnWidth,
  defaultRowHeight,
  getCell,
  getGridInfo,
  removeColumnAt,
  removeLastColumn,
  removeLastRow,
  removeRowAt,
  setCellSpan,
} from "./grid-operations";
import { JSDOM } from "jsdom";
import { gridHistoryManager } from "./grid-history";
import { attachGrid } from "./grid-attach";
import { describe } from "node:test";

let dom: JSDOM;

beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost",
    pretendToBeVisual: true,
    resources: "usable",
  });
  global.document = dom.window.document;
  global.window = dom.window as any;
});

afterEach(() => {
  // Clean up any DOM elements and reset history
  document.body.innerHTML = "";
  gridHistoryManager.reset();
});

it("addColumn adds widths", () => {
  const grid = document.createElement("div");
  grid.className = "grid";
  grid.setAttribute("data-column-widths", "100px,200px");
  grid.setAttribute("data-row-heights", "50px,100px");
  document.body.appendChild(grid);
  attachGrid(grid); // Attach grid to history manager

  addColumn(grid);

  expect(grid.getAttribute("data-column-widths")).toBe(
    `100px,200px,${defaultColumnWidth}`
  );
});

function newGrid(): HTMLDivElement {
  const grid = document.createElement("div");
  document.body.appendChild(grid);
  attachGrid(grid);
  return grid;
}
it("attach(empty div) gets 2x2 grid", () => {
  const grid = newGrid();
  const info = getGridInfo(grid);
  expect(info.columnWidths).lengthOf(2);
  expect(info.rowHeights).lengthOf(2);
  expect(info.cellCount).toBe(4);
});

it("addColumn adds a new cell to all rows", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addColumn(grid);
  const info = getGridInfo(grid);
  expect(info.columnCount).toBe(original.columnCount + 1);
  expect(info.cellCount).toBe(original.cellCount + original.rowCount);
});
it("addRow adds a new cell to all columns", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addRow(grid);
  const info = getGridInfo(grid);
  expect(info.rowCount).toBe(original.rowCount + 1);
  expect(info.cellCount).toBe(original.cellCount + original.columnCount);
});
it("addRow adds heights", () => {
  const grid = newGrid();
  grid.setAttribute("data-column-widths", "100px,200px");
  grid.setAttribute("data-row-heights", "50px,100px");

  addRow(grid);

  expect(grid.getAttribute("data-row-heights")).toBe(
    `50px,100px,${defaultRowHeight}`
  );
});
it("removeLastRow removes the last row of cells", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  removeLastRow(grid);
  const info = getGridInfo(grid);
  expect(info.rowCount).toBe(original.rowCount - 1);
  expect(info.cellCount).toBe(original.cellCount - original.columnCount);
});

it("removeLastRow updates row heights", () => {
  const grid = newGrid();
  grid.setAttribute("data-column-widths", "100px,200px");
  grid.setAttribute("data-row-heights", "50px,100px");

  removeLastRow(grid);

  expect(grid.getAttribute("data-row-heights")).toBe("50px");
});

it("removeLastRow does nothing if no rows exist", () => {
  const grid = newGrid();
  grid.setAttribute("data-row-heights", "");
  const original = getGridInfo(grid);
  removeLastRow(grid);
  const info = getGridInfo(grid);
  expect(info.rowCount).toBe(original.rowCount);
  expect(info.cellCount).toBe(original.cellCount);
});

it("removeLastColumn removes the last column of cells", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  removeLastColumn(grid);
  const info = getGridInfo(grid);
  expect(info.columnCount).toBe(original.columnCount - 1);
  expect(info.cellCount).toBe(original.cellCount - original.rowCount);
});

it("removeLastColumn updates column widths", () => {
  const grid = newGrid();
  grid.setAttribute("data-column-widths", "100px,200px");
  grid.setAttribute("data-row-heights", "50px,100px");

  removeLastColumn(grid);

  expect(grid.getAttribute("data-column-widths")).toBe("100px");
});

it("removeLastColumn does nothing if no columns exist", () => {
  const grid = newGrid();
  grid.setAttribute("data-column-widths", "");
  const original = getGridInfo(grid);
  removeLastColumn(grid);
  const info = getGridInfo(grid);
  expect(info.columnCount).toBe(original.columnCount);
  expect(info.cellCount).toBe(original.cellCount);
});

describe("span-related tests", () => {
  it("setCellSpan(2,1) removes cell to the right", () => {
    const grid = newGrid();
    const original = getGridInfo(grid);
    // mark the one we expect to be removed
    const cellR0C1 = getCell(grid, 0, 1);
    cellR0C1.id = "cell-R0C1";
    expect(document.getElementById("cell-R0C1")).toBeTruthy();

    // Set span for the first cell to be two columns wide
    const cellR0C0 = getCell(grid, 0, 0);
    setCellSpan(cellR0C0, 2, 1);
    const info = getGridInfo(grid);
    expect(info.columnCount).toBe(original.columnCount);
    expect(info.rowCount).toBe(original.rowCount);
    // expect the style to have been set
    const styleString = cellR0C0.getAttribute("style");
    expect(styleString).toContain("--span-x: 2");

    // now we expect to have one less cell
    expect(info.cellCount).toBe(original.cellCount - 1);
    // there should be no cell with id 'cell-R0C1'
    expect(document.getElementById("cell-R0C1")).toBeNull();
  });

  it("setCellSpan(1,2) removes cell below", () => {
    const grid = newGrid();
    const original = getGridInfo(grid);
    // mark the one we expect to be removed
    const cellR1C0 = getCell(grid, 1, 0);
    cellR1C0.id = "cell-R1C0";
    expect(document.getElementById("cell-R1C0")).toBeTruthy();

    // Set span for the first cell to be two rows tall
    const cellR0C0 = getCell(grid, 0, 0);
    setCellSpan(cellR0C0, 1, 2);
    const info = getGridInfo(grid);
    expect(info.columnCount).toBe(original.columnCount);
    expect(info.rowCount).toBe(original.rowCount);
    // expect the style to have been set
    const styleString = cellR0C0.getAttribute("style");
    expect(styleString).toContain("--span-y: 2");

    // now we expect to have one less cell
    expect(info.cellCount).toBe(original.cellCount - 1);
    // there should be no cell with id 'cell-R1C0'
    expect(document.getElementById("cell-R1C0")).toBeNull();
  });

  it("setCellSpan(2,2) removes cells to the right and below", () => {
    const grid = newGrid();
    const original = getGridInfo(grid);
    // mark the ones we expect to be removed
    const cellR0C1 = getCell(grid, 0, 1);
    cellR0C1.id = "cell-R0C1";
    const cellR1C0 = getCell(grid, 1, 0);
    cellR1C0.id = "cell-R1C0";
    const cellR1C1 = getCell(grid, 1, 1);
    cellR1C1.id = "cell-R1C1";
    expect(document.getElementById("cell-R0C1")).toBeTruthy();
    expect(document.getElementById("cell-R1C0")).toBeTruthy();
    expect(document.getElementById("cell-R1C1")).toBeTruthy();

    // Set span for the first cell to be two columns wide and two rows tall
    const cellR0C0 = getCell(grid, 0, 0);
    setCellSpan(cellR0C0, 2, 2);
    const info = getGridInfo(grid);
    expect(info.columnCount).toBe(original.columnCount);
    expect(info.rowCount).toBe(original.rowCount);
    // expect the style to have been set
    const styleString = cellR0C0.getAttribute("style");
    expect(styleString).toContain("--span-x: 2");
    expect(styleString).toContain("--span-y: 2");

    // now we expect to have three less cells
    expect(info.cellCount).toBe(original.cellCount - 3);
    // there should be no cells with those ids
    expect(document.getElementById("cell-R0C1")).toBeNull();
    expect(document.getElementById("cell-R1C0")).toBeNull();
    expect(document.getElementById("cell-R1C1")).toBeNull();
  });

  it("reducing span from (2,1) to (1,1) adds cell back", () => {
    const grid = newGrid();
    const original = getGridInfo(grid);

    // First expand the span to remove a cell
    const cellR0C0 = getCell(grid, 0, 0);
    setCellSpan(cellR0C0, 2, 1);
    let info = getGridInfo(grid);
    expect(info.cellCount).toBe(original.cellCount - 1);

    // Now reduce the span back to 1x1 - should add a cell back
    setCellSpan(cellR0C0, 1, 1);
    info = getGridInfo(grid);
    expect(info.columnCount).toBe(original.columnCount);
    expect(info.rowCount).toBe(original.rowCount);
    expect(info.cellCount).toBe(original.cellCount);

    // expect the style to have been removed
    const styleString = cellR0C0.getAttribute("style");
    expect(styleString).not.toContain("--span-x");
  });

  it("reducing span from (1,2) to (1,1) adds cell back", () => {
    const grid = newGrid();
    const original = getGridInfo(grid);

    // First expand the vertical span to remove a cell
    const cellR0C0 = getCell(grid, 0, 0);
    setCellSpan(cellR0C0, 1, 2);
    let info = getGridInfo(grid);
    expect(info.cellCount).toBe(original.cellCount - 1);

    // Now reduce the span back to 1x1 - should add a cell back
    setCellSpan(cellR0C0, 1, 1);
    info = getGridInfo(grid);
    expect(info.columnCount).toBe(original.columnCount);
    expect(info.rowCount).toBe(original.rowCount);
    expect(info.cellCount).toBe(original.cellCount);

    // expect the style to have been removed
    const styleString = cellR0C0.getAttribute("style");
    expect(styleString).not.toContain("--span-y");
  });

  it("reducing span from (2,2) to (1,1) adds cells back", () => {
    const grid = newGrid();
    const original = getGridInfo(grid);

    // First expand the span to remove cells
    const cellR0C0 = getCell(grid, 0, 0);
    setCellSpan(cellR0C0, 2, 2);
    let info = getGridInfo(grid);
    expect(info.cellCount).toBe(original.cellCount - 3);

    // Now reduce the span back to 1x1 - should add cells back
    setCellSpan(cellR0C0, 1, 1);
    info = getGridInfo(grid);
    expect(info.columnCount).toBe(original.columnCount);
    expect(info.rowCount).toBe(original.rowCount);
    expect(info.cellCount).toBe(original.cellCount);

    // expect the styles to have been removed
    const styleString = cellR0C0.getAttribute("style");
    expect(styleString).not.toContain("--span-x");
    expect(styleString).not.toContain("--span-y");
  });

  it("changing from (2,1) to (1,2) maintains same cell count", () => {
    const grid = newGrid();
    const original = getGridInfo(grid);

    // First expand horizontally
    const cellR0C0 = getCell(grid, 0, 0);
    setCellSpan(cellR0C0, 2, 1);
    let info = getGridInfo(grid);
    expect(info.cellCount).toBe(original.cellCount - 1);

    // Now change to vertical span - should maintain same cell count
    setCellSpan(cellR0C0, 1, 2);
    info = getGridInfo(grid);
    expect(info.columnCount).toBe(original.columnCount);
    expect(info.rowCount).toBe(original.rowCount);
    expect(info.cellCount).toBe(original.cellCount - 1);

    // expect the styles to reflect the change
    const styleString = cellR0C0.getAttribute("style");
    expect(styleString).not.toContain("--span-x");
    expect(styleString).toContain("--span-y: 2");
  });

  it("expanding from (1,1) to (3,1) should fail if exceeds grid bounds", () => {
    const grid = newGrid(); // 2x2 grid
    const cellR0C0 = getCell(grid, 0, 0);

    // Should throw error when trying to span 3 columns in a 2-column grid
    expect(() => setCellSpan(cellR0C0, 3, 1)).toThrow();
  });

  it("expanding from (1,1) to (1,3) should fail if exceeds grid bounds", () => {
    const grid = newGrid(); // 2x2 grid
    const cellR0C0 = getCell(grid, 0, 0);

    // Should throw error when trying to span 3 rows in a 2-row grid
    expect(() => setCellSpan(cellR0C0, 1, 3)).toThrow();
  });
});

// Basic positional add/remove tests
it("addColumnAt(0) adds column at start", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addColumnAt(grid, 0);
  const info = getGridInfo(grid);
  expect(info.columnCount).toBe(original.columnCount + 1);
  expect(info.cellCount).toBe(original.cellCount + original.rowCount);
});

it("addColumnAt(1) adds column in middle", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addColumnAt(grid, 1);
  const info = getGridInfo(grid);
  expect(info.columnCount).toBe(original.columnCount + 1);
  expect(info.cellCount).toBe(original.cellCount + original.rowCount);
});

it("addRowAt(0) adds row at start", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addRowAt(grid, 0);
  const info = getGridInfo(grid);
  expect(info.rowCount).toBe(original.rowCount + 1);
  expect(info.cellCount).toBe(original.cellCount + original.columnCount);
});

it("addRowAt(1) adds row in middle", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addRowAt(grid, 1);
  const info = getGridInfo(grid);
  expect(info.rowCount).toBe(original.rowCount + 1);
  expect(info.cellCount).toBe(original.cellCount + original.columnCount);
});

it("removeColumnAt(0) removes first column", () => {
  const grid = newGrid();
  addColumn(grid); // Make sure we have enough columns
  const original = getGridInfo(grid);
  removeColumnAt(grid, 0);
  const info = getGridInfo(grid);
  expect(info.columnCount).toBe(original.columnCount - 1);
  expect(info.cellCount).toBe(original.cellCount - original.rowCount);
});

it("removeRowAt(0) removes first row", () => {
  const grid = newGrid();
  addRow(grid); // Make sure we have enough rows
  const original = getGridInfo(grid);
  removeRowAt(grid, 0);
  const info = getGridInfo(grid);
  expect(info.rowCount).toBe(original.rowCount - 1);
  expect(info.cellCount).toBe(original.cellCount - original.columnCount);
});

it("removeColumnAt throws error when removing only column", () => {
  const grid = newGrid();
  // Remove all but one column
  while (getGridInfo(grid).columnCount > 1) {
    removeLastColumn(grid);
  }
  expect(() => removeColumnAt(grid, 0)).toThrow();
});

it("removeRowAt throws error when removing only row", () => {
  const grid = newGrid();
  // Remove all but one row
  while (getGridInfo(grid).rowCount > 1) {
    removeLastRow(grid);
  }
  expect(() => removeRowAt(grid, 0)).toThrow();
});

// Test cell positioning after operations
it("addColumnAt(0) inserts cells at correct positions", () => {
  const grid = newGrid();

  // Label cells before operation
  const cells = Array.from(grid.querySelectorAll(":scope > .cell"));
  cells.forEach((cell, index) => {
    cell.id = `original-${index}`;
  });

  const originalInfo = getGridInfo(grid);
  addColumnAt(grid, 0);
  const newInfo = getGridInfo(grid);

  expect(newInfo.columnCount).toBe(originalInfo.columnCount + 1);
  expect(newInfo.cellCount).toBe(
    originalInfo.cellCount + originalInfo.rowCount
  );

  // Check that original cells can still be found (they moved positions)
  const originalCells = Array.from(
    grid.querySelectorAll(":scope > .cell")
  ).filter((cell) => cell.id.startsWith("original-"));
  expect(originalCells.length).toBe(originalInfo.cellCount);
});

it("removeColumnAt(1) removes correct cells", () => {
  const grid = newGrid();
  addColumn(grid); // Start with 3 columns

  const originalInfo = getGridInfo(grid);
  removeColumnAt(grid, 1); // Remove middle column
  const newInfo = getGridInfo(grid);

  expect(newInfo.columnCount).toBe(originalInfo.columnCount - 1);
  expect(newInfo.cellCount).toBe(
    originalInfo.cellCount - originalInfo.rowCount
  );
});

// Test span handling during removal
it("removeColumnAt reduces span when removing column", () => {
  const grid = newGrid();
  addColumn(grid); // 3x2 grid

  const cell = getCell(grid, 0, 0);
  setCellSpan(cell, 3, 1); // Span across all 3 columns

  removeColumnAt(grid, 1); // Remove middle column

  const spanX = parseInt(cell.style.getPropertyValue("--span-x")) || 1;
  expect(spanX).toBe(2); // Should be reduced from 3 to 2
});

it("removeRowAt reduces span when removing row", () => {
  const grid = newGrid();
  addRow(grid); // 2x3 grid

  const cell = getCell(grid, 0, 0);
  setCellSpan(cell, 1, 3); // Span across all 3 rows

  removeRowAt(grid, 1); // Remove middle row

  const spanY = parseInt(cell.style.getPropertyValue("--span-y")) || 1;
  expect(spanY).toBe(2); // Should be reduced from 3 to 2
});

// Error handling tests
it("addColumnAt throws error for invalid index", () => {
  const grid = newGrid();
  const info = getGridInfo(grid);
  expect(() => addColumnAt(grid, -1)).toThrow();
  expect(() => addColumnAt(grid, info.columnCount + 1)).toThrow();
});

it("addRowAt throws error for invalid index", () => {
  const grid = newGrid();
  const info = getGridInfo(grid);
  expect(() => addRowAt(grid, -1)).toThrow();
  expect(() => addRowAt(grid, info.rowCount + 1)).toThrow();
});

it("removeColumnAt throws error for invalid index", () => {
  const grid = newGrid();
  const info = getGridInfo(grid);
  expect(() => removeColumnAt(grid, -1)).toThrow();
  expect(() => removeColumnAt(grid, info.columnCount)).toThrow();
});

it("removeRowAt throws error for invalid index", () => {
  const grid = newGrid();
  const info = getGridInfo(grid);
  expect(() => removeRowAt(grid, -1)).toThrow();
  expect(() => removeRowAt(grid, info.rowCount)).toThrow();
});

// Test that operations work correctly at end positions
it("addColumnAt works when adding at end", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addColumnAt(grid, original.columnCount); // Add at end
  const info = getGridInfo(grid);
  expect(info.columnCount).toBe(original.columnCount + 1);
});

it("addRowAt works when adding at end", () => {
  const grid = newGrid();
  const original = getGridInfo(grid);
  addRowAt(grid, original.rowCount); // Add at end
  const info = getGridInfo(grid);
  expect(info.rowCount).toBe(original.rowCount + 1);
});

// Complex span scenario
it("complex span handling: multiple cells affected", () => {
  const grid = newGrid();
  addColumn(grid);
  addColumn(grid); // 4x2 grid

  // Set up multiple spans
  const cell00 = getCell(grid, 0, 0);
  const cell01 = getCell(grid, 0, 2);
  setCellSpan(cell00, 2, 1); // Spans columns 0-1
  setCellSpan(cell01, 2, 1); // Spans columns 2-3

  removeColumnAt(grid, 1); // Remove column 1

  // Check that spans were adjusted correctly
  const span00 = parseInt(cell00.style.getPropertyValue("--span-x")) || 1;
  const span01 = parseInt(cell01.style.getPropertyValue("--span-x")) || 1;

  expect(span00).toBe(1); // Reduced from 2 to 1
  expect(span01).toBe(2); // Should remain 2 (now spans columns 1-2)
});

// Comprehensive span handling tests
describe("Span handling during column/row removal", () => {
  it("removeColumnAt: cell starting at removed column with span>1 reduces span", () => {
    const grid = newGrid();
    addColumn(grid); // 3x2 grid

    // Cell at (0,1) spans 2 columns (covers columns 1-2)
    const cell = getCell(grid, 0, 1);
    cell.id = "spanning-cell";
    setCellSpan(cell, 2, 1);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-x")) || 1;
    expect(originalSpan).toBe(2);

    // Remove column 1 (the starting column of the span)
    removeColumnAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-x")) || 1;
    expect(newSpan).toBe(1);
  });

  it("removeColumnAt: cell starting at removed column with span=1 is removed", () => {
    const grid = newGrid();
    addColumn(grid); // 3x2 grid

    // Cell at (0,1) with no span (span=1)
    const cell = getCell(grid, 0, 1);
    cell.id = "single-cell";

    const originalCellCount = getGridInfo(grid).cellCount;
    expect(document.getElementById("single-cell")).toBeTruthy();

    // Remove column 1
    removeColumnAt(grid, 1);

    // Cell should be removed
    expect(document.getElementById("single-cell")).toBeNull();
    const newCellCount = getGridInfo(grid).cellCount;
    expect(newCellCount).toBe(originalCellCount - 2); // 2 cells removed (one from each row)
  });

  it("removeColumnAt: cell spanning across removed column reduces span", () => {
    const grid = newGrid();
    addColumn(grid);
    addColumn(grid); // 4x2 grid

    // Cell at (0,0) spans 3 columns (covers columns 0-2)
    const cell = getCell(grid, 0, 0);
    cell.id = "wide-spanning-cell";
    setCellSpan(cell, 3, 1);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-x")) || 1;
    expect(originalSpan).toBe(3);

    // Remove column 1 (middle of the span)
    removeColumnAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("wide-spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-x")) || 1;
    expect(newSpan).toBe(2); // Reduced from 3 to 2
  });

  it("removeRowAt: cell starting at removed row with span>1 reduces span", () => {
    const grid = newGrid();
    addRow(grid); // 2x3 grid

    // Cell at (1,0) spans 2 rows (covers rows 1-2)
    const cell = getCell(grid, 1, 0);
    cell.id = "tall-spanning-cell";
    setCellSpan(cell, 1, 2);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-y")) || 1;
    expect(originalSpan).toBe(2);

    // Remove row 1 (the starting row of the span)
    removeRowAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("tall-spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-y")) || 1;
    expect(newSpan).toBe(1);
  });

  it("removeRowAt: cell starting at removed row with span=1 is removed", () => {
    const grid = newGrid();
    addRow(grid); // 2x3 grid

    // Cell at (1,0) with no span (span=1)
    const cell = getCell(grid, 1, 0);
    cell.id = "single-row-cell";

    const originalCellCount = getGridInfo(grid).cellCount;
    expect(document.getElementById("single-row-cell")).toBeTruthy();

    // Remove row 1
    removeRowAt(grid, 1);

    // Cell should be removed
    expect(document.getElementById("single-row-cell")).toBeNull();
    const newCellCount = getGridInfo(grid).cellCount;
    expect(newCellCount).toBe(originalCellCount - 2); // 2 cells removed (one from each column)
  });

  it("removeRowAt: cell spanning across removed row reduces span", () => {
    const grid = newGrid();
    addRow(grid);
    addRow(grid); // 2x4 grid

    // Cell at (0,0) spans 3 rows (covers rows 0-2)
    const cell = getCell(grid, 0, 0);
    cell.id = "tall-wide-spanning-cell";
    setCellSpan(cell, 1, 3);

    const originalSpan = parseInt(cell.style.getPropertyValue("--span-y")) || 1;
    expect(originalSpan).toBe(3);

    // Remove row 1 (middle of the span)
    removeRowAt(grid, 1);

    // Cell should still exist but with reduced span
    const existingCell = document.getElementById("tall-wide-spanning-cell");
    expect(existingCell).toBeTruthy();
    const newSpan =
      parseInt(existingCell!.style.getPropertyValue("--span-y")) || 1;
    expect(newSpan).toBe(2); // Reduced from 3 to 2
  });

  it("removeColumnAt: multiple cells with different span behaviors", () => {
    const grid = newGrid();
    addColumn(grid);
    addColumn(grid);
    addColumn(grid); // 5x2 grid

    // Set up various cells with different spans
    const cell00 = getCell(grid, 0, 0);
    cell00.id = "cell-00";
    setCellSpan(cell00, 2, 1); // Spans columns 0-1

    const cell02 = getCell(grid, 0, 2);
    cell02.id = "cell-02";
    // This cell has span=1, starts at column 2

    const cell03 = getCell(grid, 0, 3);
    cell03.id = "cell-03";
    setCellSpan(cell03, 2, 1); // Spans columns 3-4

    const cell10 = getCell(grid, 1, 0);
    cell10.id = "cell-10";
    setCellSpan(cell10, 3, 1); // Spans columns 0-2

    // Remove column 2
    removeColumnAt(grid, 2);

    // Check results:
    // cell00 (spans 0-1): should be unaffected
    expect(document.getElementById("cell-00")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-00")!.style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(2);

    // cell02 (single cell at column 2): should be removed
    expect(document.getElementById("cell-02")).toBeNull();

    // cell03 (spans 3-4, now 2-3): should be unaffected
    expect(document.getElementById("cell-03")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-03")!.style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(2);

    // cell10 (spans 0-2): should have span reduced from 3 to 2
    expect(document.getElementById("cell-10")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-10")!.style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(2);
  });

  it("removeRowAt: multiple cells with different span behaviors", () => {
    const grid = newGrid();
    addRow(grid);
    addRow(grid);
    addRow(grid); // 2x5 grid

    // Set up various cells with different spans
    const cell00 = getCell(grid, 0, 0);
    cell00.id = "cell-00";
    setCellSpan(cell00, 1, 2); // Spans rows 0-1

    const cell20 = getCell(grid, 2, 0);
    cell20.id = "cell-20";
    // This cell has span=1, starts at row 2

    const cell30 = getCell(grid, 3, 0);
    cell30.id = "cell-30";
    setCellSpan(cell30, 1, 2); // Spans rows 3-4

    const cell01 = getCell(grid, 0, 1);
    cell01.id = "cell-01";
    setCellSpan(cell01, 1, 3); // Spans rows 0-2

    // Remove row 2
    removeRowAt(grid, 2);

    // Check results:
    // cell00 (spans 0-1): should be unaffected
    expect(document.getElementById("cell-00")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-00")!.style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);

    // cell20 (single cell at row 2): should be removed
    expect(document.getElementById("cell-20")).toBeNull();

    // cell30 (spans 3-4, now 2-3): should be unaffected
    expect(document.getElementById("cell-30")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-30")!.style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);

    // cell01 (spans 0-2): should have span reduced from 3 to 2
    expect(document.getElementById("cell-01")).toBeTruthy();
    expect(
      parseInt(
        document.getElementById("cell-01")!.style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);
  });
});

// Tests for proper cell positioning and content preservation
describe("Cell positioning and content preservation", () => {
  it("addColumnAt(0) preserves cell content and positions correctly", () => {
    const grid = newGrid();

    // Add content to cells to verify they're preserved
    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));
    cells.forEach((cell, index) => {
      const div = cell.querySelector("div");
      if (div) div.textContent = `Original-${index}`;
      cell.id = `orig-${index}`;
    });

    const originalInfo = getGridInfo(grid);
    addColumnAt(grid, 0);
    const newInfo = getGridInfo(grid);

    // Check structure
    expect(newInfo.columnCount).toBe(originalInfo.columnCount + 1);
    expect(newInfo.cellCount).toBe(
      originalInfo.cellCount + originalInfo.rowCount
    );

    // Check that original cells still exist with their content
    const originalCells = Array.from(
      grid.querySelectorAll(":scope > .cell")
    ).filter((cell) => cell.id.startsWith("orig-"));
    expect(originalCells.length).toBe(originalInfo.cellCount);

    // Verify content is preserved
    originalCells.forEach((cell) => {
      const div = cell.querySelector("div");
      expect(div?.textContent).toMatch(/^Original-\d+$/);
    });
  });

  it("addRowAt(0) preserves cell content and positions correctly", () => {
    const grid = newGrid();

    // Add content to cells to verify they're preserved
    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));
    cells.forEach((cell, index) => {
      const div = cell.querySelector("div");
      if (div) div.textContent = `Original-${index}`;
      cell.id = `orig-${index}`;
    });

    const originalInfo = getGridInfo(grid);
    addRowAt(grid, 0);
    const newInfo = getGridInfo(grid);

    // Check structure
    expect(newInfo.rowCount).toBe(originalInfo.rowCount + 1);
    expect(newInfo.cellCount).toBe(
      originalInfo.cellCount + originalInfo.columnCount
    );

    // Check that original cells still exist with their content
    const originalCells = Array.from(
      grid.querySelectorAll(":scope > .cell")
    ).filter((cell) => cell.id.startsWith("orig-"));
    expect(originalCells.length).toBe(originalInfo.cellCount);

    // Verify content is preserved
    originalCells.forEach((cell) => {
      const div = cell.querySelector("div");
      expect(div?.textContent).toMatch(/^Original-\d+$/);
    });
  });

  it("removeColumnAt preserves unaffected cell content", () => {
    const grid = newGrid();
    addColumn(grid); // 3x2 grid

    // Add content to cells
    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));
    cells.forEach((cell, index) => {
      const div = cell.querySelector("div");
      if (div) div.textContent = `Cell-${index}`;
      cell.id = `cell-${index}`;
    });

    // Remove middle column
    removeColumnAt(grid, 1);

    // Cells at positions that weren't removed should still exist
    // In a 3x2 grid, removing column 1 should remove cells at (0,1) and (1,1)
    // Original cells: (0,0)=0, (0,1)=1, (0,2)=2, (1,0)=3, (1,1)=4, (1,2)=5
    // After removing column 1: cells 1 and 4 should be gone
    expect(document.getElementById("cell-0")).toBeTruthy(); // (0,0)
    expect(document.getElementById("cell-1")).toBeNull(); // (0,1) - removed
    expect(document.getElementById("cell-2")).toBeTruthy(); // (0,2)
    expect(document.getElementById("cell-3")).toBeTruthy(); // (1,0)
    expect(document.getElementById("cell-4")).toBeNull(); // (1,1) - removed
    expect(document.getElementById("cell-5")).toBeTruthy(); // (1,2)

    // Verify remaining cells have their content
    expect(
      document.getElementById("cell-0")?.querySelector("div")?.textContent
    ).toBe("Cell-0");
    expect(
      document.getElementById("cell-2")?.querySelector("div")?.textContent
    ).toBe("Cell-2");
    expect(
      document.getElementById("cell-3")?.querySelector("div")?.textContent
    ).toBe("Cell-3");
    expect(
      document.getElementById("cell-5")?.querySelector("div")?.textContent
    ).toBe("Cell-5");
  });

  it("removeRowAt preserves unaffected cell content", () => {
    const grid = newGrid();
    addRow(grid); // 2x3 grid

    // Add content to cells
    const cells = Array.from(grid.querySelectorAll(":scope > .cell"));
    cells.forEach((cell, index) => {
      const div = cell.querySelector("div");
      if (div) div.textContent = `Cell-${index}`;
      cell.id = `cell-${index}`;
    });

    // Remove middle row
    removeRowAt(grid, 1);

    // Cells at positions that weren't removed should still exist
    // In a 2x3 grid, removing row 1 should remove cells at (1,0) and (1,1)
    // Original cells: (0,0)=0, (0,1)=1, (1,0)=2, (1,1)=3, (2,0)=4, (2,1)=5
    // After removing row 1: cells 2 and 3 should be gone
    expect(document.getElementById("cell-0")).toBeTruthy(); // (0,0)
    expect(document.getElementById("cell-1")).toBeTruthy(); // (0,1)
    expect(document.getElementById("cell-2")).toBeNull(); // (1,0) - removed
    expect(document.getElementById("cell-3")).toBeNull(); // (1,1) - removed
    expect(document.getElementById("cell-4")).toBeTruthy(); // (2,0)
    expect(document.getElementById("cell-5")).toBeTruthy(); // (2,1)

    // Verify remaining cells have their content
    expect(
      document.getElementById("cell-0")?.querySelector("div")?.textContent
    ).toBe("Cell-0");
    expect(
      document.getElementById("cell-1")?.querySelector("div")?.textContent
    ).toBe("Cell-1");
    expect(
      document.getElementById("cell-4")?.querySelector("div")?.textContent
    ).toBe("Cell-4");
    expect(
      document.getElementById("cell-5")?.querySelector("div")?.textContent
    ).toBe("Cell-5");
  });
});

// Edge case tests
describe("Edge cases for add/remove operations", () => {
  it("addColumnAt and removeColumnAt work correctly at start, middle, and end", () => {
    const grid = newGrid();
    addColumn(grid);
    addColumn(grid); // 4x2 grid

    // Test adding at start
    const startInfo = getGridInfo(grid);
    addColumnAt(grid, 0);
    expect(getGridInfo(grid).columnCount).toBe(startInfo.columnCount + 1);

    // Test adding in middle
    const midInfo = getGridInfo(grid);
    addColumnAt(grid, 2);
    expect(getGridInfo(grid).columnCount).toBe(midInfo.columnCount + 1);

    // Test adding at end
    const endInfo = getGridInfo(grid);
    addColumnAt(grid, endInfo.columnCount);
    expect(getGridInfo(grid).columnCount).toBe(endInfo.columnCount + 1);

    // Now test removing from different positions
    const beforeRemove = getGridInfo(grid);

    // Remove from end
    removeColumnAt(grid, beforeRemove.columnCount - 1);
    expect(getGridInfo(grid).columnCount).toBe(beforeRemove.columnCount - 1);

    // Remove from middle
    const midRemove = getGridInfo(grid);
    removeColumnAt(grid, Math.floor(midRemove.columnCount / 2));
    expect(getGridInfo(grid).columnCount).toBe(midRemove.columnCount - 1);

    // Remove from start
    const startRemove = getGridInfo(grid);
    removeColumnAt(grid, 0);
    expect(getGridInfo(grid).columnCount).toBe(startRemove.columnCount - 1);
  });

  it("addRowAt and removeRowAt work correctly at start, middle, and end", () => {
    const grid = newGrid();
    addRow(grid);
    addRow(grid); // 2x4 grid

    // Test adding at start
    const startInfo = getGridInfo(grid);
    addRowAt(grid, 0);
    expect(getGridInfo(grid).rowCount).toBe(startInfo.rowCount + 1);

    // Test adding in middle
    const midInfo = getGridInfo(grid);
    addRowAt(grid, 2);
    expect(getGridInfo(grid).rowCount).toBe(midInfo.rowCount + 1);

    // Test adding at end
    const endInfo = getGridInfo(grid);
    addRowAt(grid, endInfo.rowCount);
    expect(getGridInfo(grid).rowCount).toBe(endInfo.rowCount + 1);

    // Now test removing from different positions
    const beforeRemove = getGridInfo(grid);

    // Remove from end
    removeRowAt(grid, beforeRemove.rowCount - 1);
    expect(getGridInfo(grid).rowCount).toBe(beforeRemove.rowCount - 1);

    // Remove from middle
    const midRemove = getGridInfo(grid);
    removeRowAt(grid, Math.floor(midRemove.rowCount / 2));
    expect(getGridInfo(grid).rowCount).toBe(midRemove.rowCount - 1);

    // Remove from start
    const startRemove = getGridInfo(grid);
    removeRowAt(grid, 0);
    expect(getGridInfo(grid).rowCount).toBe(startRemove.rowCount - 1);
  });

  it("complex scenario: spans with add/remove operations", () => {
    const grid = newGrid();
    addColumn(grid);
    addColumn(grid);
    addRow(grid); // 4x3 grid

    // Create a complex span pattern
    const cell00 = getCell(grid, 0, 0);
    cell00.id = "spanning-cell";
    setCellSpan(cell00, 2, 2); // Spans 2x2

    const cell02 = getCell(grid, 0, 2);
    cell02.id = "single-cell";

    const cell13 = getCell(grid, 1, 3);
    cell13.id = "corner-cell";

    // Add a column in the middle
    addColumnAt(grid, 2);

    // The spanning cell should still work
    expect(document.getElementById("spanning-cell")).toBeTruthy();
    expect(
      parseInt(
        document
          .getElementById("spanning-cell")!
          .style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(2);
    expect(
      parseInt(
        document
          .getElementById("spanning-cell")!
          .style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);

    // Remove a column that affects the span
    removeColumnAt(grid, 1);

    // The spanning cell should have reduced horizontal span
    expect(document.getElementById("spanning-cell")).toBeTruthy();
    expect(
      parseInt(
        document
          .getElementById("spanning-cell")!
          .style.getPropertyValue("--span-x")
      ) || 1
    ).toBe(1);
    expect(
      parseInt(
        document
          .getElementById("spanning-cell")!
          .style.getPropertyValue("--span-y")
      ) || 1
    ).toBe(2);
  });
});
