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
    expect(document.getElementById("cell-R0C1")).toBeTruthy();
    expect(document.getElementById("cell-R1C0")).toBeTruthy();

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

    // now we expect to have two less cells
    expect(info.cellCount).toBe(original.cellCount - 2);
    // there should be no cells with those ids
    expect(document.getElementById("cell-R0C1")).toBeNull();
    expect(document.getElementById("cell-R1C0")).toBeNull();
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
    expect(info.cellCount).toBe(original.cellCount - 2);

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
