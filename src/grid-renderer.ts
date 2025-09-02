// Renderer core: converts data-* model to inline styles (no structure mutations)
import {
  getEdgesH,
  getEdgesV,
  getEdgesOuter,
  getEdgeDefault,
  getGridCorners,
  getGapX,
  getGapY,
  type BorderSpec,
} from "./grid-model";
import type {
  HEdgeEntry,
  VEdgeEntry,
  HVHorizontalEdgeCellSides,
  HVVerticalEdgeCellSides,
} from "./grid-model";

const MIN_COLUMN_WIDTH = "60px";
const MIN_ROW_HEIGHT = "20px";

// Note: We avoid hardcoding defaults in the renderer. Instead, we read
// computed CSS variables from the grid element so stylesheet defaults and
// table-level overrides participate via normal CSS precedence. Data-*
// attributes still represent explicit user intent and win over inherited
// styles.

function makeGridRule(size: string, minimum: string): string {
  const s = (size || "").trim();
  if (s === "hug") return `minmax(${minimum},max-content)`;
  if (s === "fill") return `minmax(${minimum},1fr)`;
  return s;
}

function getAttrList(el: HTMLElement, name: string): string[] {
  const raw = el.getAttribute(name) || "";
  if (raw === "") return [];
  return raw.split(",");
}

function getCells(grid: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  Array.from(grid.children).forEach((child) => {
    if (child instanceof HTMLElement && child.classList.contains("cell")) {
      result.push(child);
    }
  });
  return result;
}

// --- Helpers for reading CSS-derived defaults and normalizing specs ---
//

// No CSS-derived defaults; borders are explicit via edge model + optional data-border-default.

function normalize(
  spec:
    | BorderSpec
    | (Partial<BorderSpec> & Record<string, any>)
    | null
    | undefined
): BorderSpec | null {
  if (!spec) return null;
  // If explicitly 'none', return a normalized none edge
  if ((spec as any).style === "none") {
    return { weight: 0, style: "none", color: (spec as any).color || "#000" };
  }
  // Accept partials for conciseness: default to 1 solid black unless provided
  const hasAnyField =
    Object.prototype.hasOwnProperty.call(spec, "weight") ||
    Object.prototype.hasOwnProperty.call(spec, "style") ||
    Object.prototype.hasOwnProperty.call(spec, "color");
  if (!hasAnyField) return null;
  const weight = Number.isFinite((spec as any).weight)
    ? (spec as any).weight
    : 1;
  const style = (spec as any).style || "solid";
  const color = (spec as any).color || "#000";
  if (style === "none" || weight <= 0) {
    return { weight: 0, style: "none", color };
  }
  return { weight, style, color } as BorderSpec;
}

export interface RenderModel {
  columnWidths: string[]; // raw tokens from data-*
  rowHeights: string[]; // raw tokens from data-*
  templateColumns: string; // resolved grid-template-columns
  templateRows: string; // resolved grid-template-rows
  spans: Array<{ index: number; x: number; y: number }>; // DOM order
  // resolved per-cell per-side borders
  cellBorders: Array<{
    top?: BorderSpec | null;
    right?: BorderSpec | null;
    bottom?: BorderSpec | null;
    left?: BorderSpec | null;
  }>;
}

function stylePrecedence(style: string | undefined): number {
  switch (style) {
    case "double":
      return 4;
    case "solid":
      return 3;
    case "dashed":
      return 2;
    case "dotted":
      return 1;
    case "none":
    default:
      return 0;
  }
}

//

export function buildRenderModel(grid: HTMLElement): RenderModel {
  const columnWidths = getAttrList(grid, "data-column-widths");
  const rowHeights = getAttrList(grid, "data-row-heights");

  const templateColumns = columnWidths
    .map((x) => makeGridRule(x, MIN_COLUMN_WIDTH))
    .join(" ");
  const templateRows = rowHeights
    .map((x) => makeGridRule(x, MIN_ROW_HEIGHT))
    .join(" ");

  const cells = getCells(grid);
  const spans = cells.map((cell, index) => {
    const x = parseInt(cell.getAttribute("data-span-x") || "1", 10) || 1;
    const y = parseInt(cell.getAttribute("data-span-y") || "1", 10) || 1;
    return { index, x: Math.max(1, x), y: Math.max(1, y) };
  });

  // Initialize per-cell borders
  const cellBorders: RenderModel["cellBorders"] = cells.map(() => ({
    top: null,
    right: null,
    bottom: null,
    left: null,
  }));

  const rows = rowHeights.length;
  const cols = columnWidths.length;

  function idx(r: number, c: number): number {
    return r * cols + c;
  }

  // Edge inputs
  const edgesH = getEdgesH(grid) as HEdgeEntry[][] | null; // (R-1) x C of {north,south} or single BorderSpec
  const edgesV = getEdgesV(grid) as VEdgeEntry[][] | null; // R x (C-1) of {west,east} or single BorderSpec
  const edgesOuter = getEdgesOuter(grid);
  const edgeDefault = normalize(getEdgeDefault(grid));
  const gapX = getGapX(grid);
  const gapY = getGapY(grid);

  function hasPositiveGapX(c: number): boolean {
    const token = (gapX[c] || "").trim();
    if (!token) return false;
    const n = parseFloat(token);
    if (!isNaN(n)) return n > 0;
    return token !== "0" && token !== "0px"; // basic fallback
  }
  function hasPositiveGapY(r: number): boolean {
    const token = (gapY[r] || "").trim();
    if (!token) return false;
    const n = parseFloat(token);
    if (!isNaN(n)) return n > 0;
    return token !== "0" && token !== "0px";
  }

  function borderScore(spec: BorderSpec | null | undefined): number[] {
    // Higher tuple wins lexicographically: [noneWins, weight, stylePrec]
    // We treat 'none' as dominating any other style per rule
    const s = spec && spec.style ? spec.style : "none";
    const w = spec && Number.isFinite(spec.weight) ? spec.weight : 0;
    const noneWin = s === "none" ? 1 : 0;
    return [noneWin, w, stylePrecedence(s)];
  }
  function pickSide(
    a: BorderSpec | null | undefined,
    b: BorderSpec | null | undefined,
    tieFavor: "leftTop" | "rightBottom"
  ): "a" | "b" | null {
    const aPresent = !!a;
    const bPresent = !!b;
    if (aPresent && !bPresent) return "a";
    if (!aPresent && bPresent) return "b";
    if (!aPresent && !bPresent) return null;
    const sa = borderScore(a);
    const sb = borderScore(b);
    if (sa[0] !== sb[0]) return sa[0] > sb[0] ? "a" : "b"; // 'none' wins
    if (sa[1] !== sb[1]) return sa[1] > sb[1] ? "a" : "b"; // weight
    if (sa[2] !== sb[2]) return sa[2] > sb[2] ? "a" : "b"; // style prec
    return tieFavor === "leftTop" ? "a" : "b";
  }

  // Resolve vertical inner edges (between c and c+1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const iLeft = idx(r, c);
      const iRight = idx(r, c + 1);
      const leftCell = cells[iLeft];
      const rightCell = cells[iRight];
      if (!leftCell || !rightCell) {
        // No corresponding cells (e.g., empty grid shell): skip
        continue;
      }
      const leftIsSkip = leftCell.classList.contains("skip");
      const rightIsSkip = rightCell.classList.contains("skip");
      const e = edgesV && edgesV[r] ? (edgesV[r][c] as VEdgeEntry) : undefined;
      let west: BorderSpec | null = null;
      let east: BorderSpec | null = null;
      if (e && typeof (e as any).weight === "number") {
        // single BorderSpec means same spec on both sides
        const spec = normalize(e as BorderSpec);
        west = spec;
        east = spec;
      } else {
        const sv = (e as HVVerticalEdgeCellSides | undefined) ?? undefined;
        west = normalize(sv?.west ?? null);
        east = normalize(sv?.east ?? null);
      }
      const gap = hasPositiveGapX(c);
      if (gap) {
        // Sided painting: each side draws independently
        if (!leftIsSkip) cellBorders[iLeft].right = west || null;
        if (!rightIsSkip) cellBorders[iRight].left = east || null;
      } else {
        // Zero gap: resolve to a single stroke
        const a = west || null;
        const b = east || null;
        let side = pickSide(a, b, "leftTop");
        if (!side && edgeDefault) {
          // neither side provided; fall back to default on left
          side = "a";
        }
        if (!side) continue;
        const winner = side === "a" ? a || edgeDefault : b || edgeDefault;
        if (!winner) continue;
        if (side === "a") {
          if (!leftIsSkip) cellBorders[iLeft].right = winner;
          if (!rightIsSkip) cellBorders[iRight].left = null;
        } else {
          if (!rightIsSkip) cellBorders[iRight].left = winner;
          if (!leftIsSkip) cellBorders[iLeft].right = null;
        }
      }
    }
  }

  // Resolve horizontal inner edges (between r and r+1)
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const iTop = idx(r, c);
      const iBottom = idx(r + 1, c);
      const topCell = cells[iTop];
      const bottomCell = cells[iBottom];
      if (!topCell || !bottomCell) {
        continue;
      }
      const topIsSkip = topCell.classList.contains("skip");
      const bottomIsSkip = bottomCell.classList.contains("skip");
      const e = edgesH && edgesH[r] ? (edgesH[r][c] as HEdgeEntry) : undefined;
      let north: BorderSpec | null = null;
      let south: BorderSpec | null = null;
      if (e && typeof (e as any).weight === "number") {
        const spec = normalize(e as BorderSpec);
        north = spec;
        south = spec;
      } else {
        const sh = (e as HVHorizontalEdgeCellSides | undefined) ?? undefined;
        north = normalize(sh?.north ?? null);
        south = normalize(sh?.south ?? null);
      }
      const gap = hasPositiveGapY(r);
      if (gap) {
        if (!topIsSkip) cellBorders[iTop].bottom = north || null;
        if (!bottomIsSkip) cellBorders[iBottom].top = south || null;
      } else {
        const a = north || null;
        const b = south || null;
        let side = pickSide(a, b, "leftTop");
        if (!side && edgeDefault) side = "a";
        if (!side) continue;
        const winner = side === "a" ? a || edgeDefault : b || edgeDefault;
        if (!winner) continue;
        if (side === "a") {
          if (!topIsSkip) cellBorders[iTop].bottom = winner;
          if (!bottomIsSkip) cellBorders[iBottom].top = null;
        } else {
          if (!bottomIsSkip) cellBorders[iBottom].top = winner;
          if (!topIsSkip) cellBorders[iTop].bottom = null;
        }
      }
    }
  }
  // Perimeter from edges-outer: apply per-cell sides directly
  if (edgesOuter) {
    // top
    const topArr = edgesOuter.top || [];
    for (let c = 0; c < cols; c++) {
      const i = idx(0, c);
      cellBorders[i].top = normalize(topArr[c] || null);
    }
    // bottom
    const bottomArr = edgesOuter.bottom || [];
    for (let c = 0; c < cols; c++) {
      const i = idx(rows - 1, c);
      cellBorders[i].bottom = normalize(bottomArr[c] || null);
    }
    // left
    const leftArr = edgesOuter.left || [];
    for (let r = 0; r < rows; r++) {
      const i = idx(r, 0);
      cellBorders[i].left = normalize(leftArr[r] || null);
    }
    // right
    const rightArr = edgesOuter.right || [];
    for (let r = 0; r < rows; r++) {
      const i = idx(r, cols - 1);
      cellBorders[i].right = normalize(rightArr[r] || null);
    }
  }

  return {
    columnWidths,
    rowHeights,
    templateColumns,
    templateRows,
    spans,
    cellBorders,
  };
}

export function render(grid: HTMLElement, _reason?: string): void {
  // _reason is currently informational only
  const model = buildRenderModel(grid);

  // Apply grid templates
  if (model.templateColumns) {
    grid.style.gridTemplateColumns = model.templateColumns;
    grid.style.setProperty(
      "--grid-column-count",
      String(model.columnWidths.length)
    );
  }
  if (model.templateRows) {
    grid.style.gridTemplateRows = model.templateRows;
    grid.style.setProperty("--grid-row-count", String(model.rowHeights.length));
  }

  // Apply spans via CSS variables (maintains compatibility with existing CSS)
  const cells = getCells(grid);
  model.spans.forEach((s) => {
    const cell = cells[s.index];
    if (!cell) return;
    cell.style.setProperty("--span-x", String(s.x));
    cell.style.setProperty("--span-y", String(s.y));
  });

  // Apply borders: clear outlines to avoid double paint and set per-side borders
  cells.forEach((cell, i) => {
    // clear outline; we will use regular borders per side
    cell.style.outlineWidth = "0";
    const b = model.cellBorders[i] ?? {};
    function applySide(
      side: "Top" | "Right" | "Bottom" | "Left",
      spec: BorderSpec | null | undefined
    ) {
      (cell.style as any)[`border${side}Width`] = spec
        ? `${spec.weight}px`
        : "0";
      (cell.style as any)[`border${side}Style`] = spec ? spec.style : "none";
      (cell.style as any)[`border${side}Color`] = spec
        ? spec.color
        : "transparent";
    }
    applySide("Top", b.top);
    applySide("Right", b.right);
    applySide("Bottom", b.bottom);
    applySide("Left", b.left);
  });

  // Apply outer corner radii
  const corners = getGridCorners(grid) ?? { radius: 0 };
  if (Number.isFinite(corners.radius)) {
    const radiusPx = `${corners.radius}px`;
    // set on grid as well (background corner), noting outline may not round
    (grid.style as any).borderRadius = radiusPx;
    const rows = model.rowHeights.length;
    const cols = model.columnWidths.length;
    const cellsArr = getCells(grid);
    // reset all cell corner radii to default 0 first (ensures determinism across renders)
    cellsArr.forEach((cell) => {
      (cell.style as any).borderTopLeftRadius = "0px";
      (cell.style as any).borderTopRightRadius = "0px";
      (cell.style as any).borderBottomLeftRadius = "0px";
      (cell.style as any).borderBottomRightRadius = "0px";
    });
    const idx = (r: number, c: number) => r * cols + c;
    function setCorner(
      r: number,
      c: number,
      prop:
        | "borderTopLeftRadius"
        | "borderTopRightRadius"
        | "borderBottomLeftRadius"
        | "borderBottomRightRadius"
    ) {
      if (r < 0 || c < 0 || r >= rows || c >= cols) return;
      const i = idx(r, c);
      const cell = cellsArr[i];
      if (!cell) return;
      (cell.style as any)[prop] = radiusPx;
    }
    setCorner(0, 0, "borderTopLeftRadius");
    setCorner(0, Math.max(0, cols - 1), "borderTopRightRadius");
    setCorner(Math.max(0, rows - 1), 0, "borderBottomLeftRadius");
    setCorner(
      Math.max(0, rows - 1),
      Math.max(0, cols - 1),
      "borderBottomRightRadius"
    );
  }

  // Nested grid perimeter suppression when parent cell draws perimeter
  // If a cell contains a nested .grid and this cell has any perimeter border, suppress nested grid outline.
  cells.forEach((cell, i) => {
    const b = model.cellBorders[i] ?? {};
    const visible = (s: BorderSpec | null | undefined) =>
      !!(s && s.weight > 0 && s.style !== "none");
    const hasPerimeter =
      visible(b.top) ||
      visible(b.right) ||
      visible(b.bottom) ||
      visible(b.left);
    if (!hasPerimeter) return;
    const nested = cell.querySelector(".grid") as HTMLElement | null;
    if (nested) {
      // Clear nested outline variables best-effort
      nested.style.setProperty("--grid-border-width", "0");
      nested.style.removeProperty("--grid-border-style");
      nested.style.removeProperty("--grid-border-color");
    }
  });
}
