import { it, expect, beforeEach, afterEach } from "vitest";
import {
  addColumn,
  addRow,
  defaultColumnWidth,
  defaultRowHeight,
  getCell,
  getGridInfo,
  removeLastColumn,
  removeLastRow,
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
