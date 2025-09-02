import { describe, it, expect } from "vitest";
import {
  getColumnWidths,
  setColumnWidths,
  getRowHeights,
  setRowHeights,
  getSpan,
  setSpan,
  getGridBorder,
  setGridBorder,
  getCellBorder,
  setCellBorder,
  getGridCorners,
  setGridCorners,
  getCellCorners,
  setCellCorners,
  type BorderSpec,
} from "./grid-model";

function makeGrid(): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "grid";
  return grid as HTMLElement;
}

function makeCell(): HTMLElement {
  const cell = document.createElement("div");
  cell.className = "cell";
  return cell as HTMLElement;
}

describe("grid-model", () => {
  it("reads/writes column widths and row heights", () => {
    const g = makeGrid();
    setColumnWidths(g, ["hug", "100px", "fill"]);
    expect(getColumnWidths(g)).toEqual(["hug", "100px", "fill"]);

    setRowHeights(g, ["20px", "hug"]);
    expect(getRowHeights(g)).toEqual(["20px", "hug"]);
  });

  it("reads/writes span via data-span-x/y", () => {
    const c = makeCell();
    expect(getSpan(c)).toEqual({ x: 1, y: 1 });
    setSpan(c, { x: 2, y: 3 });
    expect(getSpan(c)).toEqual({ x: 2, y: 3 });
  });

  it("reads/writes grid borders and cell borders", () => {
    const g = makeGrid();
    const b: BorderSpec = { weight: 2, style: "solid", color: "#000" };
    setGridBorder(g, "top", b);
    expect(getGridBorder(g, "top")).toEqual(b);
    setGridBorder(g, "innerH", { weight: 1, style: "dashed", color: "red" });
    expect(getGridBorder(g, "innerH")).toEqual({
      weight: 1,
      style: "dashed",
      color: "red",
    });

    const c = makeCell();
    setCellBorder(c, "left", b);
    expect(getCellBorder(c, "left")).toEqual(b);
  });

  it("reads/writes corners JSON", () => {
    const g = makeGrid();
    setGridCorners(g, { radius: 8 });
    expect(getGridCorners(g)).toEqual({ radius: 8 });

    const c = makeCell();
    setCellCorners(c, { radius: 0 });
    expect(getCellCorners(c)).toEqual({ radius: 0 });
  });

  it("removes attributes when setting null", () => {
    const g = makeGrid();
    setGridCorners(g, { radius: 4 });
    setGridCorners(g, null);
    expect(getGridCorners(g)).toBeNull();

    const c = makeCell();
    setCellBorder(c, "top", { weight: 1, style: "solid", color: "blue" });
    setCellBorder(c, "top", null);
    expect(getCellBorder(c, "top")).toBeNull();
  });
});
