import { it, expect, beforeEach, afterEach } from "vitest";
import {
  addColumn,
  addRow,
  defaultColumnWidth,
  defaultRowHeight,
  getGridInfo,
  removeLastColumn,
  removeLastRow,
} from "./grid-operations";
import { JSDOM } from "jsdom";
import { gridHistoryManager } from "./grid-history";
import { attachGrid } from "./grid-attach";

let dom: JSDOM;

beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  global.document = dom.window.document;
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
