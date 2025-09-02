export type BorderStyle = "none" | "solid" | "dashed" | "dotted" | "double";

export interface BorderSpec {
  weight: number; // pixels
  style: BorderStyle;
  color: string; // CSS color
}

export interface CornersSpec {
  radius: number; // pixels
}

export interface SpanSpec {
  x: number; // columns >=1
  y: number; // rows >=1
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseJSONAttr<T>(el: HTMLElement, name: string): T | null {
  const s = el.getAttribute(name);
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new Error(`Invalid JSON in ${name}`);
  }
}

function setJSONAttr(el: HTMLElement, name: string, value: unknown | null) {
  if (value == null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, JSON.stringify(value));
  }
}

// Widths / Heights (lists)
export function getColumnWidths(grid: HTMLElement): string[] {
  assert(grid.classList.contains("grid"), "getColumnWidths: not a grid");
  const v = grid.getAttribute("data-column-widths") || "";
  return v === "" ? [] : v.split(",");
}

export function setColumnWidths(grid: HTMLElement, widths: string[]): void {
  assert(grid.classList.contains("grid"), "setColumnWidths: not a grid");
  grid.setAttribute("data-column-widths", widths.join(","));
}

export function getRowHeights(grid: HTMLElement): string[] {
  assert(grid.classList.contains("grid"), "getRowHeights: not a grid");
  const v = grid.getAttribute("data-row-heights") || "";
  return v === "" ? [] : v.split(",");
}

export function setRowHeights(grid: HTMLElement, heights: string[]): void {
  assert(grid.classList.contains("grid"), "setRowHeights: not a grid");
  grid.setAttribute("data-row-heights", heights.join(","));
}

// Spans
export function getSpan(cell: HTMLElement): SpanSpec {
  assert(cell.classList.contains("cell"), "getSpan: not a cell");
  const x = parseInt(cell.getAttribute("data-span-x") || "1", 10) || 1;
  const y = parseInt(cell.getAttribute("data-span-y") || "1", 10) || 1;
  return { x: Math.max(1, x), y: Math.max(1, y) };
}

export function setSpan(cell: HTMLElement, span: SpanSpec): void {
  assert(cell.classList.contains("cell"), "setSpan: not a cell");
  assert(span.x >= 1 && span.y >= 1, "setSpan: span must be >=1");
  cell.setAttribute("data-span-x", String(span.x));
  cell.setAttribute("data-span-y", String(span.y));
}

// Borders
export type BorderSide = "top" | "right" | "bottom" | "left";

// Edge-based model
export interface HVHorizontalEdgeCellSides {
  north?: BorderSpec | null;
  south?: BorderSpec | null;
}
export interface HVVerticalEdgeCellSides {
  west?: BorderSpec | null;
  east?: BorderSpec | null;
}
// A single interior edge can be represented either as sided entries (west/east or north/south)
// or as a single BorderSpec applied to the edge. This enables simpler authoring when there is no gap.
export type VEdgeEntry = HVVerticalEdgeCellSides | BorderSpec | null;
export type HEdgeEntry = HVHorizontalEdgeCellSides | BorderSpec | null;
export interface EdgesOuterSpec {
  top: Array<BorderSpec | null>; // length C
  right: Array<BorderSpec | null>; // length R
  bottom: Array<BorderSpec | null>; // length C
  left: Array<BorderSpec | null>; // length R
}

// Defaults and gaps
export type EdgeDefaultSpec = BorderSpec | null; // data-border-default

export function getGapX(grid: HTMLElement): string[] {
  assert(grid.classList.contains("grid"), "getGapX: not a grid");
  const v = (grid.getAttribute("data-gap-x") || "").trim();
  if (!v) return [];
  return v.split(",").map((s) => s.trim());
}
export function setGapX(grid: HTMLElement, gaps: string[] | string): void {
  assert(grid.classList.contains("grid"), "setGapX: not a grid");
  const v = Array.isArray(gaps) ? gaps.join(",") : gaps;
  grid.setAttribute("data-gap-x", v);
}
export function getGapY(grid: HTMLElement): string[] {
  assert(grid.classList.contains("grid"), "getGapY: not a grid");
  const v = (grid.getAttribute("data-gap-y") || "").trim();
  if (!v) return [];
  return v.split(",").map((s) => s.trim());
}
export function setGapY(grid: HTMLElement, gaps: string[] | string): void {
  assert(grid.classList.contains("grid"), "setGapY: not a grid");
  const v = Array.isArray(gaps) ? gaps.join(",") : gaps;
  grid.setAttribute("data-gap-y", v);
}

export function getEdgesH(grid: HTMLElement): HEdgeEntry[][] | null {
  assert(grid.classList.contains("grid"), "getEdgesH: not a grid");
  return parseJSONAttr<HEdgeEntry[][]>(grid, "data-edges-h");
}
export function setEdgesH(
  grid: HTMLElement,
  edges: HEdgeEntry[][] | null
): void {
  assert(grid.classList.contains("grid"), "setEdgesH: not a grid");
  setJSONAttr(grid, "data-edges-h", edges);
}

export function getEdgesV(grid: HTMLElement): VEdgeEntry[][] | null {
  assert(grid.classList.contains("grid"), "getEdgesV: not a grid");
  return parseJSONAttr<VEdgeEntry[][]>(grid, "data-edges-v");
}
export function setEdgesV(
  grid: HTMLElement,
  edges: VEdgeEntry[][] | null
): void {
  assert(grid.classList.contains("grid"), "setEdgesV: not a grid");
  setJSONAttr(grid, "data-edges-v", edges);
}

export function getEdgesOuter(grid: HTMLElement): EdgesOuterSpec | null {
  assert(grid.classList.contains("grid"), "getEdgesOuter: not a grid");
  return parseJSONAttr<EdgesOuterSpec>(grid, "data-edges-outer");
}
export function setEdgesOuter(
  grid: HTMLElement,
  outer: EdgesOuterSpec | null
): void {
  assert(grid.classList.contains("grid"), "setEdgesOuter: not a grid");
  setJSONAttr(grid, "data-edges-outer", outer);
}

export function getEdgeDefault(grid: HTMLElement): EdgeDefaultSpec {
  assert(grid.classList.contains("grid"), "getEdgeDefault: not a grid");
  return parseJSONAttr<BorderSpec>(grid, "data-border-default");
}
export function setEdgeDefault(
  grid: HTMLElement,
  border: EdgeDefaultSpec
): void {
  assert(grid.classList.contains("grid"), "setEdgeDefault: not a grid");
  setJSONAttr(grid, "data-border-default", border);
}

// Grid-level shorthand perimeter default
// Deprecated APIs retained temporarily for migration (no-op or passthrough where possible)
export function getGridBorderDefault(_grid: HTMLElement): BorderSpec | null {
  return null;
}
export function setGridBorderDefault(
  _grid: HTMLElement,
  _border: BorderSpec | null
): void {}
export type GridBorderSide = never;
export function getGridBorder(
  _grid: HTMLElement,
  _side: GridBorderSide
): BorderSpec | null {
  return null;
}
export function setGridBorder(
  _grid: HTMLElement,
  _side: GridBorderSide,
  _border: BorderSpec | null
): void {}
export function getGridInnerDefault(_grid: HTMLElement): BorderSpec | null {
  return null;
}
export function setGridInnerDefault(
  _grid: HTMLElement,
  _border: BorderSpec | null
): void {}
export function getCellBorder(
  _cell: HTMLElement,
  _side: BorderSide
): BorderSpec | null {
  return null;
}
export function setCellBorder(
  _cell: HTMLElement,
  _side: BorderSide,
  _border: BorderSpec | null
): void {}
export function getCellBorderDefault(_cell: HTMLElement): BorderSpec | null {
  return null;
}
export function setCellBorderDefault(
  _cell: HTMLElement,
  _border: BorderSpec | null
): void {}

// Corners
export function getGridCorners(grid: HTMLElement): CornersSpec | null {
  assert(grid.classList.contains("grid"), "getGridCorners: not a grid");
  return parseJSONAttr<CornersSpec>(grid, "data-corners");
}

export function setGridCorners(
  grid: HTMLElement,
  corners: CornersSpec | null
): void {
  assert(grid.classList.contains("grid"), "setGridCorners: not a grid");
  setJSONAttr(grid, "data-corners", corners);
}

export function getCellCorners(cell: HTMLElement): CornersSpec | null {
  assert(cell.classList.contains("cell"), "getCellCorners: not a cell");
  return parseJSONAttr<CornersSpec>(cell, "data-corners");
}

export function setCellCorners(
  cell: HTMLElement,
  corners: CornersSpec | null
): void {
  assert(cell.classList.contains("cell"), "setCellCorners: not a cell");
  setJSONAttr(cell, "data-corners", corners);
}
