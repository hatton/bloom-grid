import type {
  BorderSpec,
  EdgesOuterSpec,
  HVHorizontalEdgeCellSides,
  HVVerticalEdgeCellSides,
  HEdgeEntry,
  VEdgeEntry,
} from "./grid-model";
import {
  getColumnWidths,
  getRowHeights,
  getEdgesOuter,
  setEdgesOuter,
  getEdgesV,
  setEdgesV,
  getEdgesH,
  setEdgesH,
  setEdgeDefault,
  getSpan,
} from "./grid-model";
import { getGridCells } from "./structure";

// Simple converters between UI-friendly types and model BorderSpec
export type UIStyle = "none" | "solid" | "dashed" | "dotted" | "double";
export interface UIBorder {
  weight: number;
  style: UIStyle;
  color?: string;
}

const toSpec = (
  u?: UIBorder | null,
  fallbackColor = "#444"
): BorderSpec | null => {
  if (!u) return null;
  const color = u.color ?? fallbackColor;
  if (u.weight <= 0 || u.style === "none")
    return { weight: 0, style: "none", color };
  return { weight: u.weight, style: u.style, color } as BorderSpec;
};

// Read current sizes
export function getGridSize(grid: HTMLElement): { rows: number; cols: number } {
  const rows = getRowHeights(grid).length;
  const cols = getColumnWidths(grid).length;
  return { rows, cols };
}

// Ensure edges arrays are sized to grid
export function ensureEdgesArrays(grid: HTMLElement) {
  const { rows, cols } = getGridSize(grid);
  // V edges: R x (C-1)
  let v = (getEdgesV(grid) ?? []) as VEdgeEntry[][];
  while (v.length < rows) v.push([]);
  for (let r = 0; r < rows; r++) {
    while ((v[r] ?? (v[r] = [])).length < Math.max(0, cols - 1)) v[r].push({});
    v[r] = v[r].slice(0, Math.max(0, cols - 1));
  }
  v = v.slice(0, rows);
  setEdgesV(grid, v as VEdgeEntry[][]);

  // H edges: (R-1) x C
  let h = (getEdgesH(grid) ?? []) as HEdgeEntry[][];
  while (h.length < Math.max(0, rows - 1)) h.push([]);
  for (let r = 0; r < Math.max(0, rows - 1); r++) {
    while ((h[r] ?? (h[r] = [])).length < cols) h[r].push({});
    h[r] = h[r].slice(0, cols);
  }
  h = h.slice(0, Math.max(0, rows - 1));
  setEdgesH(grid, h as HEdgeEntry[][]);

  // Outer arrays
  const outer =
    getEdgesOuter(grid) ??
    ({ top: [], right: [], bottom: [], left: [] } as EdgesOuterSpec);
  while (outer.top.length < cols) outer.top.push(null);
  while (outer.bottom.length < cols) outer.bottom.push(null);
  while (outer.left.length < rows) outer.left.push(null);
  while (outer.right.length < rows) outer.right.push(null);
  outer.top = outer.top.slice(0, cols);
  outer.bottom = outer.bottom.slice(0, cols);
  outer.left = outer.left.slice(0, rows);
  outer.right = outer.right.slice(0, rows);
  setEdgesOuter(grid, outer);
}

// Apply a uniform outer border to all four sides
export function applyUniformOuter(
  grid: HTMLElement,
  border: UIBorder | null,
  colorFallback = "#000"
) {
  ensureEdgesArrays(grid);
  const { rows, cols } = getGridSize(grid);
  const spec = toSpec(border, colorFallback);
  const outer = (getEdgesOuter(grid) ?? {
    top: [],
    right: [],
    bottom: [],
    left: [],
  }) as EdgesOuterSpec;
  outer.top = Array(cols).fill(spec);
  outer.bottom = Array(cols).fill(spec);
  outer.left = Array(rows).fill(spec);
  outer.right = Array(rows).fill(spec);
  setEdgesOuter(grid, outer);
}

// Apply uniform inner vertical/horizontal borders (between cells)
export function applyUniformInner(
  grid: HTMLElement,
  kind: "innerV" | "innerH",
  border: UIBorder | null,
  colorFallback = "#444"
) {
  ensureEdgesArrays(grid);
  const { rows, cols } = getGridSize(grid);
  const spec = toSpec(border, colorFallback);
  if (kind === "innerV") {
    const v = (getEdgesV(grid) ?? []) as HVVerticalEdgeCellSides[][];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < Math.max(0, cols - 1); c++) {
        v[r][c].west = spec;
        v[r][c].east = spec;
      }
    }
    setEdgesV(grid, v);
  } else {
    const h = (getEdgesH(grid) ?? []) as HVHorizontalEdgeCellSides[][];
    for (let r = 0; r < Math.max(0, rows - 1); r++) {
      for (let c = 0; c < cols; c++) {
        h[r][c].north = spec;
        h[r][c].south = spec;
      }
    }
    setEdgesH(grid, h);
  }
}

// Apply a default border spec for unspecified edges
export function setDefaultBorder(
  grid: HTMLElement,
  border: UIBorder | null,
  colorFallback = "#444"
) {
  setEdgeDefault(grid, toSpec(border, colorFallback));
}

// Apply borders around a single cell's perimeter.
// For interior sides, writes to inner edges (both sided); for outer edges, writes to edges-outer.
export function applyCellPerimeter(
  grid: HTMLElement,
  cell: HTMLElement,
  map: {
    top?: UIBorder | null;
    right?: UIBorder | null;
    bottom?: UIBorder | null;
    left?: UIBorder | null;
  },
  outerColorFallback = "#000",
  innerColorFallback = "#444"
) {
  ensureEdgesArrays(grid);
  const { rows, cols } = getGridSize(grid);
  const cells = getGridCells(grid);
  const idx = cells.indexOf(cell);
  if (idx < 0) return;
  const r = Math.floor(idx / Math.max(1, cols));
  const c = idx % Math.max(1, cols);
  const span = getSpan(cell);
  const sx = Math.max(1, span.x);
  const sy = Math.max(1, span.y);

  // Fetch arrays
  const v = (getEdgesV(grid) ?? []) as HVVerticalEdgeCellSides[][];
  const h = (getEdgesH(grid) ?? []) as HVHorizontalEdgeCellSides[][];
  const outer = (getEdgesOuter(grid) ?? {
    top: [],
    right: [],
    bottom: [],
    left: [],
  }) as EdgesOuterSpec;

  // Left
  if (map.left !== undefined) {
    const innerSpec = toSpec(map.left, innerColorFallback);
    const outerSpec = toSpec(map.left, outerColorFallback);
    if (c === 0) {
      for (let rr = r; rr < Math.min(r + sy, outer.left.length); rr++) {
        outer.left[rr] = outerSpec;
      }
    } else {
      for (let rr = r; rr < Math.min(r + sy, v.length); rr++) {
        if (c - 1 >= 0 && c - 1 < (v[rr]?.length ?? 0)) {
          v[rr][c - 1].west = innerSpec;
          v[rr][c - 1].east = innerSpec;
        }
      }
    }
  }

  // Right
  if (map.right !== undefined) {
    const innerSpec = toSpec(map.right, innerColorFallback);
    const outerSpec = toSpec(map.right, outerColorFallback);
    const rc = c + sx - 1;
    if (rc === cols - 1) {
      for (let rr = r; rr < Math.min(r + sy, outer.right.length); rr++) {
        outer.right[rr] = outerSpec;
      }
    } else {
      for (let rr = r; rr < Math.min(r + sy, v.length); rr++) {
        if (rc >= 0 && rc < (v[rr]?.length ?? 0)) {
          v[rr][rc].west = innerSpec;
          v[rr][rc].east = innerSpec;
        }
      }
    }
  }

  // Top
  if (map.top !== undefined) {
    const innerSpec = toSpec(map.top, innerColorFallback);
    const outerSpec = toSpec(map.top, outerColorFallback);
    if (r === 0) {
      for (let cc = c; cc < Math.min(c + sx, outer.top.length); cc++) {
        outer.top[cc] = outerSpec;
      }
    } else if (r - 1 >= 0 && r - 1 < h.length) {
      for (let cc = c; cc < Math.min(c + sx, h[r - 1]?.length ?? 0); cc++) {
        h[r - 1][cc].north = innerSpec;
        h[r - 1][cc].south = innerSpec;
      }
    }
  }

  // Bottom
  if (map.bottom !== undefined) {
    const innerSpec = toSpec(map.bottom, innerColorFallback);
    const outerSpec = toSpec(map.bottom, outerColorFallback);
    const rrBottom = r + sy - 1;
    if (rrBottom === rows - 1) {
      for (let cc = c; cc < Math.min(c + sx, outer.bottom.length); cc++) {
        outer.bottom[cc] = outerSpec;
      }
    } else if (rrBottom >= 0 && rrBottom < h.length) {
      for (let cc = c; cc < Math.min(c + sx, h[rrBottom]?.length ?? 0); cc++) {
        h[rrBottom][cc].north = innerSpec;
        h[rrBottom][cc].south = innerSpec;
      }
    }
  }

  setEdgesV(grid, v);
  setEdgesH(grid, h);
  setEdgesOuter(grid, outer);
}
