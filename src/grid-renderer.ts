// Renderer core: converts data-* model to inline styles (no structure mutations)
import {
  getCellBorder,
  getGridBorder,
  getGridCorners,
  type BorderSpec,
} from "./grid-model";

const MIN_COLUMN_WIDTH = "60px";
const MIN_ROW_HEIGHT = "20px";

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
  // resolved grid perimeter (outline variables)
  gridPerimeter: {
    top: BorderSpec | null;
    right: BorderSpec | null;
    bottom: BorderSpec | null;
    left: BorderSpec | null;
  };
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

function pickHeavier(
  a: BorderSpec | null | undefined,
  b: BorderSpec | null | undefined,
  tieFavor: "leftTop" | "rightBottom"
): BorderSpec | null {
  if (!a && !b) return null;
  if (a && !b) return a;
  if (!a && b) return b;
  // both present
  if (!a || !b) return null; // TS narrow
  if (a.weight !== b.weight) return a.weight > b.weight ? a : b;
  const pa = stylePrecedence(a.style);
  const pb = stylePrecedence(b.style);
  if (pa !== pb) return pa > pb ? a : b;
  // tie break
  return tieFavor === "leftTop" ? a : b;
}

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

  // Resolve vertical inner edges (between c and c+1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const iLeft = idx(r, c);
      const iRight = idx(r, c + 1);
      const leftCell = cells[iLeft];
      const rightCell = cells[iRight];
      const leftSpec =
        leftCell && !leftCell.classList.contains("skip")
          ? getCellBorder(leftCell, "right")
          : null;
      const rightSpec =
        rightCell && !rightCell.classList.contains("skip")
          ? getCellBorder(rightCell, "left")
          : null;
      const gridInner = getGridBorder(grid, "innerV");
      // First: specific vs specific
      let winner = pickHeavier(leftSpec, rightSpec, "leftTop");
      // If no specific winner, compare specific vs inner
      if (!winner) {
        // prefer any specific over inner
        winner = leftSpec || rightSpec || gridInner || null;
      }
      if (!winner) continue;
      // Assign to one side only
      if (winner === leftSpec || (!leftSpec && !rightSpec && gridInner)) {
        cellBorders[iLeft].right = winner;
        cellBorders[iRight].left = null;
      } else {
        cellBorders[iRight].left = winner;
        cellBorders[iLeft].right = null;
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
      const topSpec =
        topCell && !topCell.classList.contains("skip")
          ? getCellBorder(topCell, "bottom")
          : null;
      const bottomSpec =
        bottomCell && !bottomCell.classList.contains("skip")
          ? getCellBorder(bottomCell, "top")
          : null;
      const gridInner = getGridBorder(grid, "innerH");
      let winner = pickHeavier(topSpec, bottomSpec, "leftTop");
      if (!winner) {
        winner = topSpec || bottomSpec || gridInner || null;
      }
      if (!winner) continue;
      if (winner === topSpec || (!topSpec && !bottomSpec && gridInner)) {
        cellBorders[iTop].bottom = winner;
        cellBorders[iBottom].top = null;
      } else {
        cellBorders[iBottom].top = winner;
        cellBorders[iTop].bottom = null;
      }
    }
  }

  // Perimeter: outer wins over cells when present
  const perTop = getGridBorder(grid, "top");
  const perRight = getGridBorder(grid, "right");
  const perBottom = getGridBorder(grid, "bottom");
  const perLeft = getGridBorder(grid, "left");

  // If a perimeter exists for a side, suppress corresponding cell side borders and let grid draw via outline vars
  if (perTop) {
    for (let c = 0; c < cols; c++) {
      const i = idx(0, c);
      cellBorders[i].top = null;
    }
  } else {
    // no perimeter: use cell-specific tops as-is (already included only in inner edges; add perimeter edges now)
    for (let c = 0; c < cols; c++) {
      const i = idx(0, c);
      const spec =
        cells[i] && !cells[i].classList.contains("skip")
          ? getCellBorder(cells[i], "top")
          : null;
      if (spec) cellBorders[i].top = spec;
    }
  }
  if (perBottom) {
    for (let c = 0; c < cols; c++) {
      const i = idx(rows - 1, c);
      cellBorders[i].bottom = null;
    }
  } else {
    for (let c = 0; c < cols; c++) {
      const i = idx(rows - 1, c);
      const spec =
        cells[i] && !cells[i].classList.contains("skip")
          ? getCellBorder(cells[i], "bottom")
          : null;
      if (spec) cellBorders[i].bottom = spec;
    }
  }
  if (perLeft) {
    for (let r = 0; r < rows; r++) {
      const i = idx(r, 0);
      cellBorders[i].left = null;
    }
  } else {
    for (let r = 0; r < rows; r++) {
      const i = idx(r, 0);
      const spec =
        cells[i] && !cells[i].classList.contains("skip")
          ? getCellBorder(cells[i], "left")
          : null;
      if (spec) cellBorders[i].left = spec;
    }
  }
  if (perRight) {
    for (let r = 0; r < rows; r++) {
      const i = idx(r, cols - 1);
      cellBorders[i].right = null;
    }
  } else {
    for (let r = 0; r < rows; r++) {
      const i = idx(r, cols - 1);
      const spec =
        cells[i] && !cells[i].classList.contains("skip")
          ? getCellBorder(cells[i], "right")
          : null;
      if (spec) cellBorders[i].right = spec;
    }
  }

  return {
    columnWidths,
    rowHeights,
    templateColumns,
    templateRows,
    spans,
    cellBorders,
    gridPerimeter: {
      top: perTop || null,
      right: perRight || null,
      bottom: perBottom || null,
      left: perLeft || null,
    },
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

  // Apply grid perimeter using outline variables when present
  const gp = model.gridPerimeter;
  // Use the heaviest of the four to set outline defaults (outline is uniform); if sides differ, outline can't represent that — we prioritize top/right/bottom/left presence.
  const candidates = [gp.top, gp.right, gp.bottom, gp.left].filter(
    Boolean
  ) as BorderSpec[];
  if (candidates.length > 0) {
    // pick the visually dominant one
    let best = candidates[0]!;
    for (let i = 1; i < candidates.length; i++) {
      best = pickHeavier(best, candidates[i], "leftTop") || best;
    }
    grid.style.setProperty("--grid-border-width", `${best.weight}px`);
    grid.style.setProperty("--grid-border-style", best.style);
    grid.style.setProperty("--grid-border-color", best.color);
  } else {
    grid.style.setProperty("--grid-border-width", "0");
  }

  // Apply outer corner radii
  const corners = getGridCorners(grid);
  if (corners && Number.isFinite(corners.radius)) {
    const radiusPx = `${corners.radius}px`;
    // set on grid as well (background corner), noting outline may not round
    (grid.style as any).borderRadius = radiusPx;
    const rows = model.rowHeights.length;
    const cols = model.columnWidths.length;
    const cellsArr = getCells(grid);
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
    setCorner(
      0,
      Math.max(0, model.columnWidths.length - 1),
      "borderTopRightRadius"
    );
    setCorner(
      Math.max(0, model.rowHeights.length - 1),
      0,
      "borderBottomLeftRadius"
    );
    setCorner(
      Math.max(0, model.rowHeights.length - 1),
      Math.max(0, model.columnWidths.length - 1),
      "borderBottomRightRadius"
    );
  }

  // Nested grid perimeter suppression when parent cell draws perimeter
  // If a cell contains a nested .grid and this cell has any perimeter border, suppress nested grid outline.
  cells.forEach((cell, i) => {
    const b = model.cellBorders[i] ?? {};
    const hasPerimeter = Boolean(b.top || b.right || b.bottom || b.left);
    if (!hasPerimeter) return;
    const nested = cell.querySelector(".grid") as HTMLElement | null;
    if (nested) {
      nested.style.setProperty("--grid-border-width", "0");
    }
  });
}
