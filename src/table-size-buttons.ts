// Four edge "+" buttons shown around the visible bounds of the selected grid.
// Right/Left insert columns; Top/Bottom insert rows.

import { BloomGrid } from "./BloomGrid";
import { getRowAndColumn } from "./structure";

let installed = false;

export function ensureTableSizeButtons(): void {
  if (installed) return;
  installed = true;

  ensureEdgeOverlays();

  document.addEventListener(
    "focusin",
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const cell = target.closest(".cell") as HTMLElement | null;
      if (!cell) {
        scheduleOverlayReposition();
        return;
      }
      const grid = cell.closest(".grid") as HTMLElement | null;
      if (!grid) return;
      showEdgeOverlays(grid);
    },
    true
  );

  window.addEventListener("resize", scheduleOverlayReposition, {
    passive: true,
  });
  window.addEventListener("scroll", scheduleOverlayReposition, {
    passive: true,
  });
  document.addEventListener(
    "gridHistoryUpdated",
    scheduleOverlayReposition as EventListener
  );
}

// --- Small "+" overlays on four sides ---
let overlayRight: HTMLButtonElement | null = null;
let overlayLeft: HTMLButtonElement | null = null;
let overlayTop: HTMLButtonElement | null = null;
let overlayBottom: HTMLButtonElement | null = null;
let overlayGrid: HTMLElement | null = null;
let repositionRaf = 0;

function makeOverlay(onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "+";
  Object.assign(btn.style, {
    position: "absolute",
    width: "24px",
    height: "24px",
    lineHeight: "22px",
    textAlign: "center",
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.3)",
    background: "#2D8294",
    color: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    zIndex: "2147483647",
    cursor: "pointer",
    display: "none",
  } as CSSStyleDeclaration);
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => onClick());
  document.body.appendChild(btn);
  return btn;
}

function ensureEdgeOverlays() {
  if (!overlayRight) overlayRight = makeOverlay(tryInsertColumnRight);
  if (!overlayLeft) overlayLeft = makeOverlay(tryInsertColumnLeft);
  if (!overlayTop) overlayTop = makeOverlay(tryInsertRowAbove);
  if (!overlayBottom) overlayBottom = makeOverlay(tryInsertRowBelow);
}

function showEdgeOverlays(grid: HTMLElement) {
  overlayGrid = grid;
  ensureEdgeOverlays();
  if (overlayRight) overlayRight.style.display = "block";
  if (overlayLeft) overlayLeft.style.display = "block";
  if (overlayTop) overlayTop.style.display = "block";
  if (overlayBottom) overlayBottom.style.display = "block";
  repositionEdgeOverlays();
}

function hideEdgeOverlays() {
  if (overlayRight) overlayRight.style.display = "none";
  if (overlayLeft) overlayLeft.style.display = "none";
  if (overlayTop) overlayTop.style.display = "none";
  if (overlayBottom) overlayBottom.style.display = "none";
  overlayGrid = null;
}

function scheduleOverlayReposition() {
  if (repositionRaf) cancelAnimationFrame(repositionRaf);
  repositionRaf = requestAnimationFrame(() => {
    repositionEdgeOverlays();
  });
}

function repositionEdgeOverlays() {
  if (!overlayGrid) return;
  if (!document.body.contains(overlayGrid)) {
    hideEdgeOverlays();
    return;
  }
  const cells: HTMLElement[] = Array.from(overlayGrid.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.classList.contains("cell")
  );

  let minLeft = Infinity;
  let maxRight = -Infinity;
  let minTop = Infinity;
  let maxBottom = -Infinity;
  for (const cell of cells) {
    const r = cell.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (r.left < minLeft) minLeft = r.left;
    if (r.right > maxRight) maxRight = r.right;
    if (r.top < minTop) minTop = r.top;
    if (r.bottom > maxBottom) maxBottom = r.bottom;
  }

  if (
    !isFinite(minLeft) ||
    !isFinite(maxRight) ||
    !isFinite(minTop) ||
    !isFinite(maxBottom)
  ) {
    const rect = overlayGrid.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    if (!isVisible) {
      hideEdgeOverlays();
      return;
    }
    minLeft = rect.left;
    maxRight = rect.right;
    minTop = rect.top;
    maxBottom = rect.bottom;
  }

  const centerX = (minLeft + maxRight) / 2;
  const centerY = (minTop + maxBottom) / 2;

  const size = 24;
  const gap = 8;

  if (overlayRight) {
    const px = Math.round(window.scrollX + maxRight + gap);
    const py = Math.round(window.scrollY + centerY - size / 2);
    overlayRight.style.left = `${px}px`;
    overlayRight.style.top = `${py}px`;
    overlayRight.style.display = "block";
  }
  if (overlayLeft) {
    const px = Math.round(window.scrollX + minLeft - gap - size);
    const py = Math.round(window.scrollY + centerY - size / 2);
    overlayLeft.style.left = `${px}px`;
    overlayLeft.style.top = `${py}px`;
    overlayLeft.style.display = "block";
  }
  if (overlayTop) {
    const px = Math.round(window.scrollX + centerX - size / 2);
    const py = Math.round(window.scrollY + minTop - gap - size);
    overlayTop.style.left = `${px}px`;
    overlayTop.style.top = `${py}px`;
    overlayTop.style.display = "block";
  }
  if (overlayBottom) {
    const px = Math.round(window.scrollX + centerX - size / 2);
    const py = Math.round(window.scrollY + maxBottom + gap);
    overlayBottom.style.left = `${px}px`;
    overlayBottom.style.top = `${py}px`;
    overlayBottom.style.display = "block";
  }
}

function tryInsertColumnRight() {
  const cell = document.querySelector<HTMLElement>(".cell.cell--selected");
  const grid = (cell?.closest(".grid") as HTMLElement | null) ?? overlayGrid;
  if (!grid) return;
  try {
    const controller = new BloomGrid(grid);
    if (cell) {
      const { column } = getRowAndColumn(grid, cell);
      controller.addColumnAt(column + 1);
      cell.focus();
    } else {
      const widths = (grid.getAttribute("data-column-widths") || "")
        .split(",")
        .filter((x) => x.length > 0);
      controller.addColumnAt(widths.length);
      grid.querySelector<HTMLElement>(".cell")?.focus();
    }
    scheduleOverlayReposition();
  } catch {}
}

function tryInsertColumnLeft() {
  const cell = document.querySelector<HTMLElement>(".cell.cell--selected");
  const grid = (cell?.closest(".grid") as HTMLElement | null) ?? overlayGrid;
  if (!grid) return;
  try {
    const controller = new BloomGrid(grid);
    if (cell) {
      const { column } = getRowAndColumn(grid, cell);
      controller.addColumnAt(column);
      cell.focus();
    } else {
      controller.addColumnAt(0);
      grid.querySelector<HTMLElement>(".cell")?.focus();
    }
    scheduleOverlayReposition();
  } catch {}
}

function tryInsertRowAbove() {
  const cell = document.querySelector<HTMLElement>(".cell.cell--selected");
  const grid = (cell?.closest(".grid") as HTMLElement | null) ?? overlayGrid;
  if (!grid) return;
  try {
    const controller = new BloomGrid(grid);
    if (cell) {
      const { row } = getRowAndColumn(grid, cell);
      controller.addRowAt(row);
      cell.focus();
    } else {
      controller.addRowAt(0);
      grid.querySelector<HTMLElement>(".cell")?.focus();
    }
    scheduleOverlayReposition();
  } catch {}
}

function tryInsertRowBelow() {
  const cell = document.querySelector<HTMLElement>(".cell.cell--selected");
  const grid = (cell?.closest(".grid") as HTMLElement | null) ?? overlayGrid;
  if (!grid) return;
  try {
    const controller = new BloomGrid(grid);
    if (cell) {
      const { row } = getRowAndColumn(grid, cell);
      controller.addRowAt(row + 1);
      cell.focus();
    } else {
      const heights = (grid.getAttribute("data-row-heights") || "")
        .split(",")
        .filter((x) => x.length > 0);
      controller.addRowAt(heights.length);
      grid.querySelector<HTMLElement>(".cell")?.focus();
    }
    scheduleOverlayReposition();
  } catch {}
}
