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
export type GridBorderSide = BorderSide | "innerH" | "innerV";

function sideToAttr(side: GridBorderSide): string {
  switch (side) {
    case "top":
    case "right":
    case "bottom":
    case "left":
      return `data-border-${side}`;
    case "innerH":
      return "data-border-inner-h";
    case "innerV":
      return "data-border-inner-v";
  }
}

export function getGridBorder(
  grid: HTMLElement,
  side: GridBorderSide
): BorderSpec | null {
  assert(grid.classList.contains("grid"), "getGridBorder: not a grid");
  return parseJSONAttr<BorderSpec>(grid, sideToAttr(side));
}

export function setGridBorder(
  grid: HTMLElement,
  side: GridBorderSide,
  border: BorderSpec | null
): void {
  assert(grid.classList.contains("grid"), "setGridBorder: not a grid");
  setJSONAttr(grid, sideToAttr(side), border);
}

export function getCellBorder(
  cell: HTMLElement,
  side: BorderSide
): BorderSpec | null {
  assert(cell.classList.contains("cell"), "getCellBorder: not a cell");
  return parseJSONAttr<BorderSpec>(cell, `data-border-${side}`);
}

export function setCellBorder(
  cell: HTMLElement,
  side: BorderSide,
  border: BorderSpec | null
): void {
  assert(cell.classList.contains("cell"), "setCellBorder: not a cell");
  setJSONAttr(cell, `data-border-${side}`, border);
}

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
