import { describe, it, expect } from "vitest";
import {
  getColumnWidths,
  setColumnWidths,
  getRowHeights,
  setRowHeights,
  getSpan,
  setSpan,
  getGridCorners,
  setGridCorners,
  getCellCorners,
  setCellCorners,
  getEdgesV,
  setEdgesV,
  getEdgesH,
  setEdgesH,
  getEdgesOuter,
  setEdgesOuter,
  getEdgeDefault,
  setEdgeDefault,
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

  it("reads/writes edgesH, edgesV, edgesOuter, and edge default", () => {
    const g = makeGrid();
    // Vertical edges: 1 row x 1 vertical boundary
    setEdgesV(g, [
      [{ west: { weight: 2, style: "solid", color: "#000" }, east: null }],
    ]);
    expect(getEdgesV(g)).toEqual([
      [{ west: { weight: 2, style: "solid", color: "#000" }, east: null }],
    ]);

    // Horizontal edges: 1 boundary x 2 columns
    setEdgesH(g, [
      [
        { north: null, south: { weight: 1, style: "dashed", color: "red" } },
        { north: null, south: null },
      ],
    ]);
    expect(getEdgesH(g)).toEqual([
      [
        { north: null, south: { weight: 1, style: "dashed", color: "red" } },
        { north: null, south: null },
      ],
    ]);

    // Outer edges
    setEdgesOuter(g, {
      top: [{ weight: 3, style: "double", color: "green" }],
      right: [null],
      bottom: [null],
      left: [null],
    });
    expect(getEdgesOuter(g)).toEqual({
      top: [{ weight: 3, style: "double", color: "green" }],
      right: [null],
      bottom: [null],
      left: [null],
    });

    // Edge default
    const def: BorderSpec = { weight: 1, style: "solid", color: "#888" };
    setEdgeDefault(g, def);
    expect(getEdgeDefault(g)).toEqual(def);
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

    setEdgesOuter(g, {
      top: [{ weight: 1, style: "solid", color: "blue" }],
      right: [null],
      bottom: [null],
      left: [null],
    });
    setEdgesOuter(g, null);
    expect(getEdgesOuter(g)).toBeNull();

    setEdgeDefault(g, { weight: 1, style: "solid", color: "blue" });
    setEdgeDefault(g, null);
    expect(getEdgeDefault(g)).toBeNull();
  });
});
