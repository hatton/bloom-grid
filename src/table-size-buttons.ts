// Four edge "+" buttons shown around the visible bounds of the selected grid.
// Right/Left insert columns; Top/Bottom insert rows.

import { BloomGrid } from "./BloomGrid";
import { getRowAndColumn } from "./structure";
import { ProximityDiv } from "./ProximityDiv";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { kBloomBlue } from "./constants";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

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
// Add buttons
let overlayRight: HTMLButtonElement | null = null; // add column right
let overlayLeft: HTMLButtonElement | null = null; // add column left
let overlayTop: HTMLButtonElement | null = null; // add row above
let overlayBottom: HTMLButtonElement | null = null; // add row below
// Delete buttons
let overlayRightDel: HTMLButtonElement | null = null; // delete column
let overlayLeftDel: HTMLButtonElement | null = null; // delete column
let overlayTopDel: HTMLButtonElement | null = null; // delete row
let overlayBottomDel: HTMLButtonElement | null = null; // delete row

// Group containers (per side)
let groupRight: HTMLDivElement | null = null;
let groupLeft: HTMLDivElement | null = null;
let groupTop: HTMLDivElement | null = null;
let groupBottom: HTMLDivElement | null = null;

// Proximity wrappers for groups
let proxRightGroup: ProximityDiv | null = null;
let proxLeftGroup: ProximityDiv | null = null;
let proxTopGroup: ProximityDiv | null = null;
let proxBottomGroup: ProximityDiv | null = null;
let overlayGrid: HTMLElement | null = null;
let repositionRaf = 0;

// --- Hover preview overlay for delete actions ---
let deletePreviewDiv: HTMLDivElement | null = null;
let deletePreviewVisible = false;
type PreviewKind = "row" | "column";
let currentPreviewKind: PreviewKind | null = null;

// Shared dimensions
const kAddButtonLength = 100; // px, long side of add button (tall for columns, wide for rows)
const kAddPreviewThickness = 10; // px, thickness of the pulsing add preview bar

// Ensure global overlay styles exist (for animations)
let overlayStylesInstalled = false;
function ensureOverlayStyles() {
  if (overlayStylesInstalled) return;
  const style = document.createElement("style");
  style.textContent = `
@keyframes bgrid-pulse {
  0% { opacity: 0.25; }
  50% { opacity: 0.9; }
  100% { opacity: 0.25; }
}`;
  document.head.appendChild(style);
  overlayStylesInstalled = true;
}

type OverlayKind = "add" | "delete";
type OverlaySide = "right" | "left" | "top" | "bottom";

function makeOverlay(
  onClick: () => void,
  icon: React.ReactElement,
  kind: OverlayKind,
  side: OverlaySide
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  Object.assign(btn.style, {
    position: "absolute",
    // base size; will be overridden per kind/side below
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.3)",
    backgroundColor: "#2D8294",
    color: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    zIndex: "2147483647",
    cursor: "pointer",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  } as CSSStyleDeclaration);

  // Shape adjustments: Add buttons are bigger targets; Delete stays circular 24px.
  if (kind === "add") {
    if (side === "right" || side === "left") {
      // Tall rounded rectangle for columns
      btn.style.width = "24px";
      btn.style.height = `${kAddButtonLength}px`;
      btn.style.borderRadius = "12px"; // pill-like vertically
    } else {
      // Wide rounded rectangle for rows
      btn.style.width = `${kAddButtonLength}px`;
      btn.style.height = "24px";
      btn.style.borderRadius = "12px"; // pill-like horizontally
    }
  } else {
    // delete: keep compact circle
    btn.style.width = "24px";
    btn.style.height = "24px";
    btn.style.borderRadius = "12px";
  }
  // Inject MUI icon as inline SVG for crisp rendering
  const svg = renderToStaticMarkup(
    React.cloneElement(icon, {
      // Use MUI color prop properly and ensure fill follows currentColor without relying on MUI CSS
      color: "inherit",
      style: { width: 18, height: 18, display: "block", fill: "currentColor" },
    })
  );
  btn.innerHTML = svg;
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => onClick());
  return btn;
}

function ensureGroupContainer(side: OverlaySide): HTMLDivElement {
  const existing =
    side === "right"
      ? groupRight
      : side === "left"
      ? groupLeft
      : side === "top"
      ? groupTop
      : groupBottom;
  if (existing) return existing;

  const div = document.createElement("div");
  div.setAttribute("data-overlay-group", side);
  Object.assign(div.style, {
    position: "absolute",
    zIndex: "2147483647",
    display: "none",
    gap: "6px",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    // We'll center on the appropriate axis using transform
    transform:
      side === "right" || side === "left"
        ? "translateY(-50%)"
        : "translateX(-50%)",
  } as any);
  // flex direction depends on side and we'll toggle display when showing
  div.style.flexDirection =
    side === "right" || side === "left" ? "column" : "row";
  (div.style as any).display = "none";
  document.body.appendChild(div);

  if (side === "right") groupRight = div;
  else if (side === "left") groupLeft = div;
  else if (side === "top") groupTop = div;
  else groupBottom = div;

  // Attach proximity to group
  const prox = new ProximityDiv(document.body, div);
  if (side === "right") proxRightGroup = prox;
  else if (side === "left") proxLeftGroup = prox;
  else if (side === "top") proxTopGroup = prox;
  else proxBottomGroup = prox;

  return div;
}

function ensureEdgeOverlays() {
  ensureOverlayStyles();
  // Use MUI Add/Delete icons. Placement conveys direction.
  if (!overlayRight)
    overlayRight = makeOverlay(
      tryInsertColumnRight,
      React.createElement(AddIcon),
      "add",
      "right"
    );
  if (!overlayLeft)
    overlayLeft = makeOverlay(
      tryInsertColumnLeft,
      React.createElement(AddIcon),
      "add",
      "left"
    );
  if (!overlayTop)
    overlayTop = makeOverlay(
      tryInsertRowAbove,
      React.createElement(AddIcon),
      "add",
      "top"
    );
  if (!overlayBottom)
    overlayBottom = makeOverlay(
      tryInsertRowBelow,
      React.createElement(AddIcon),
      "add",
      "bottom"
    );
  // Delete buttons with MUI Delete icon
  if (!overlayRightDel)
    overlayRightDel = makeOverlay(
      tryRemoveColumn,
      React.createElement(DeleteIcon),
      "delete",
      "right"
    );
  if (!overlayLeftDel)
    overlayLeftDel = makeOverlay(
      tryRemoveColumn,
      React.createElement(DeleteIcon),
      "delete",
      "left"
    );
  if (!overlayTopDel)
    overlayTopDel = makeOverlay(
      tryRemoveRow,
      React.createElement(DeleteIcon),
      "delete",
      "top"
    );
  if (!overlayBottomDel)
    overlayBottomDel = makeOverlay(
      tryRemoveRow,
      React.createElement(DeleteIcon),
      "delete",
      "bottom"
    );
  // Create group containers and place buttons inside
  const rightGroup = ensureGroupContainer("right");
  const leftGroup = ensureGroupContainer("left");
  const topGroup = ensureGroupContainer("top");
  const bottomGroup = ensureGroupContainer("bottom");

  const addToGroup = (
    group: HTMLDivElement,
    ...buttons: (HTMLButtonElement | null)[]
  ) => {
    for (const btn of buttons) {
      if (!btn) continue;
      // Make button participate in flex layout vs absolute
      btn.style.position = "static";
      btn.style.display = "flex";
      if (!group.contains(btn)) group.appendChild(btn);
    }
  };
  addToGroup(rightGroup, overlayRight, overlayRightDel);
  addToGroup(leftGroup, overlayLeft, overlayLeftDel);
  addToGroup(topGroup, overlayTop, overlayTopDel);
  addToGroup(bottomGroup, overlayBottom, overlayBottomDel);

  // Attach hover handlers once for delete previews
  const ensureHover = (btn: HTMLButtonElement | null, kind: PreviewKind) => {
    if (!btn) return;
    if ((btn as any)._hasPreviewHandlers) return;
    (btn as any)._hasPreviewHandlers = true;
    btn.addEventListener("mouseenter", () => showDeletePreview(kind));
    btn.addEventListener("mouseleave", hideDeletePreview);
  };
  ensureHover(overlayRightDel, "column");
  ensureHover(overlayLeftDel, "column");
  ensureHover(overlayTopDel, "row");
  ensureHover(overlayBottomDel, "row");

  // Attach hover handlers for ADD previews (show where the insertion will occur)
  const ensureAddHover = (
    btn: HTMLButtonElement | null,
    kind: PreviewKind,
    position: "above" | "below" | "left" | "right"
  ) => {
    if (!btn) return;
    if ((btn as any)._hasAddPreviewHandlers) return;
    (btn as any)._hasAddPreviewHandlers = true;
    btn.addEventListener("mouseenter", () => showAddPreview(kind, position));
    btn.addEventListener("mouseleave", hideAddPreview);
  };
  ensureAddHover(overlayTop, "row", "above");
  ensureAddHover(overlayBottom, "row", "below");
  ensureAddHover(overlayLeft, "column", "left");
  ensureAddHover(overlayRight, "column", "right");
}

function showEdgeOverlays(grid: HTMLElement) {
  overlayGrid = grid;
  ensureEdgeOverlays();
  if (groupRight) groupRight.style.display = "flex";
  if (groupLeft) groupLeft.style.display = "flex";
  if (groupTop) groupTop.style.display = "flex";
  if (groupBottom) groupBottom.style.display = "flex";
  repositionEdgeOverlays();
}

function hideEdgeOverlays() {
  if (groupRight) groupRight.style.display = "none";
  if (groupLeft) groupLeft.style.display = "none";
  if (groupTop) groupTop.style.display = "none";
  if (groupBottom) groupBottom.style.display = "none";
  overlayGrid = null;
  hideDeletePreview();
  hideAddPreview();
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

  // Sizes and gap
  const base = 24; // button base size (also top/bottom group height)
  const size = 24;
  const gap = 8;

  // Right group (vertical, centered on Y)
  if (proxRightGroup && groupRight) {
    groupRight.style.display = "flex";
    const px = Math.round(window.scrollX + maxRight + gap);
    const py = Math.round(window.scrollY + centerY);
    proxRightGroup.setPosition(px, py);
  }
  // Left group (vertical, centered on Y). Width ~ base, position to the left of grid
  if (proxLeftGroup && groupLeft) {
    groupLeft.style.display = "flex";
    const px = Math.round(window.scrollX + minLeft - gap - base);
    const py = Math.round(window.scrollY + centerY);
    proxLeftGroup.setPosition(px, py);
  }
  // Top group (horizontal, centered on X). Height ~ base, position above grid
  if (proxTopGroup && groupTop) {
    groupTop.style.display = "flex";
    const px = Math.round(window.scrollX + centerX);
    const py = Math.round(window.scrollY + minTop - gap - size);
    proxTopGroup.setPosition(px, py);
  }
  // Bottom group (horizontal, centered on X)
  if (proxBottomGroup && groupBottom) {
    groupBottom.style.display = "flex";
    const px = Math.round(window.scrollX + centerX);
    const py = Math.round(window.scrollY + maxBottom + gap);
    proxBottomGroup.setPosition(px, py);
  }

  // If a delete preview is visible, reposition/update it to track row/column bounds
  if (deletePreviewVisible) {
    updateDeletePreviewGeometry();
  }
  // If an add preview is visible, reposition/update it as well
  if (addPreviewVisible) {
    updateAddPreviewGeometry();
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
    } else {
      const widths = (grid.getAttribute("data-column-widths") || "")
        .split(",")
        .filter((x) => x.length > 0);
      controller.addColumnAt(widths.length);
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
    } else {
      controller.addColumnAt(0);
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
    } else {
      controller.addRowAt(0);
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
    } else {
      const heights = (grid.getAttribute("data-row-heights") || "")
        .split(",")
        .filter((x) => x.length > 0);
      controller.addRowAt(heights.length);
    }
    scheduleOverlayReposition();
  } catch {}
}

function tryRemoveColumn() {
  const cell = document.querySelector<HTMLElement>(".cell.cell--selected");
  const grid = (cell?.closest(".grid") as HTMLElement | null) ?? overlayGrid;
  if (!grid) return;
  try {
    const controller = new BloomGrid(grid);
    if (cell) {
      const { column } = getRowAndColumn(grid, cell);
      controller.removeColumnAt(column);
    }
    scheduleOverlayReposition();
  } catch {}
}

function tryRemoveRow() {
  const cell = document.querySelector<HTMLElement>(".cell.cell--selected");
  const grid = (cell?.closest(".grid") as HTMLElement | null) ?? overlayGrid;
  if (!grid) return;
  try {
    const controller = new BloomGrid(grid);
    if (cell) {
      const { row } = getRowAndColumn(grid, cell);
      controller.removeRowAt(row);
    }
    scheduleOverlayReposition();
  } catch {}
}

// ===== Delete Hover Preview =====
function ensureDeletePreviewDiv(): HTMLDivElement {
  if (deletePreviewDiv) return deletePreviewDiv;
  const div = document.createElement("div");
  Object.assign(div.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: "0px",
    height: "0px",
    pointerEvents: "none",
    zIndex: "2147483646", // just below the buttons
    display: "none",
  } as CSSStyleDeclaration);
  // Create an SVG with two diagonal lines (red X)
  div.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
      <line x1="0" y1="0" x2="100%" y2="100%" stroke="#e53935" stroke-width="2" stroke-linecap="round" />
      <line x1="100%" y1="0" x2="0" y2="100%" stroke="#e53935" stroke-width="2" stroke-linecap="round" />
    </svg>`;
  document.body.appendChild(div);
  deletePreviewDiv = div;
  return div;
}

function showDeletePreview(kind: PreviewKind) {
  if (!overlayGrid) return;
  const selected = document.querySelector<HTMLElement>(".cell.cell--selected");
  if (!selected) return;
  currentPreviewKind = kind;
  const div = ensureDeletePreviewDiv();
  deletePreviewVisible = true;
  updateDeletePreviewGeometry();
  div.style.display = "block";
}

function hideDeletePreview() {
  deletePreviewVisible = false;
  currentPreviewKind = null;
  if (deletePreviewDiv) deletePreviewDiv.style.display = "none";
}

function updateDeletePreviewGeometry() {
  if (!deletePreviewVisible || !overlayGrid || !deletePreviewDiv) return;
  const selected = document.querySelector<HTMLElement>(".cell.cell--selected");
  if (!selected) {
    hideDeletePreview();
    return;
  }
  const { row, column } = getRowAndColumn(overlayGrid, selected);
  // Find all visible cells and compute bounds for the target row/column
  const cells: HTMLElement[] = Array.from(overlayGrid.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.classList.contains("cell")
  );
  let minLeft = Infinity,
    maxRight = -Infinity,
    minTop = Infinity,
    maxBottom = -Infinity;
  for (const cell of cells) {
    const { row: r, column: c } = getRowAndColumn(overlayGrid, cell);
    const match = currentPreviewKind === "row" ? r === row : c === column;
    if (!match) continue;
    const rect = cell.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (rect.left < minLeft) minLeft = rect.left;
    if (rect.right > maxRight) maxRight = rect.right;
    if (rect.top < minTop) minTop = rect.top;
    if (rect.bottom > maxBottom) maxBottom = rect.bottom;
  }
  if (
    !isFinite(minLeft) ||
    !isFinite(maxRight) ||
    !isFinite(minTop) ||
    !isFinite(maxBottom)
  ) {
    hideDeletePreview();
    return;
  }
  const left = Math.round(window.scrollX + minLeft);
  const top = Math.round(window.scrollY + minTop);
  const width = Math.round(maxRight - minLeft);
  const height = Math.round(maxBottom - minTop);
  Object.assign(deletePreviewDiv.style, {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    display: "block",
  } as CSSStyleDeclaration);
}

// ===== Add Hover Preview (pulsing bar) =====
let addPreviewDiv: HTMLDivElement | null = null;
let addPreviewVisible = false;
let currentAddKind: PreviewKind | null = null;
let currentAddPosition: "above" | "below" | "left" | "right" | null = null;

function ensureAddPreviewDiv(): HTMLDivElement {
  if (addPreviewDiv) return addPreviewDiv;
  const div = document.createElement("div");
  Object.assign(div.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: "0px",
    height: "0px",
    pointerEvents: "none",
    zIndex: "2147483646",
    display: "none",
    backgroundColor: kBloomBlue,
    opacity: "0.6",
    animation: "bgrid-pulse 2.8s ease-in-out infinite",
    borderRadius: "3px",
  } as CSSStyleDeclaration);
  document.body.appendChild(div);
  addPreviewDiv = div;
  return div;
}

function showAddPreview(
  kind: PreviewKind,
  position: "above" | "below" | "left" | "right"
) {
  if (!overlayGrid) return;
  const selected = document.querySelector<HTMLElement>(".cell.cell--selected");
  if (!selected) return;
  currentAddKind = kind;
  currentAddPosition = position;
  const div = ensureAddPreviewDiv();
  addPreviewVisible = true;
  updateAddPreviewGeometry();
  div.style.display = "block";
}

function hideAddPreview() {
  addPreviewVisible = false;
  currentAddKind = null;
  currentAddPosition = null;
  if (addPreviewDiv) addPreviewDiv.style.display = "none";
}

function updateAddPreviewGeometry() {
  if (!addPreviewVisible || !overlayGrid || !addPreviewDiv) return;
  if (!currentAddKind || !currentAddPosition) return;
  const selected = document.querySelector<HTMLElement>(".cell.cell--selected");
  if (!selected) {
    hideAddPreview();
    return;
  }
  const { row, column } = getRowAndColumn(overlayGrid, selected);
  const cells: HTMLElement[] = Array.from(overlayGrid.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.classList.contains("cell")
  );
  let minLeft = Infinity,
    maxRight = -Infinity,
    minTop = Infinity,
    maxBottom = -Infinity;
  for (const cell of cells) {
    const { row: r, column: c } = getRowAndColumn(overlayGrid, cell);
    const match = currentAddKind === "row" ? r === row : c === column;
    if (!match) continue;
    const rect = cell.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (rect.left < minLeft) minLeft = rect.left;
    if (rect.right > maxRight) maxRight = rect.right;
    if (rect.top < minTop) minTop = rect.top;
    if (rect.bottom > maxBottom) maxBottom = rect.bottom;
  }
  if (
    !isFinite(minLeft) ||
    !isFinite(maxRight) ||
    !isFinite(minTop) ||
    !isFinite(maxBottom)
  ) {
    hideAddPreview();
    return;
  }

  if (currentAddKind === "row") {
    const boundary = currentAddPosition === "above" ? minTop : maxBottom;
    const left = Math.round(window.scrollX + minLeft);
    const width = Math.round(maxRight - minLeft);
    const top = Math.round(
      window.scrollY + boundary - kAddPreviewThickness / 2
    );
    const height = kAddPreviewThickness;
    Object.assign(addPreviewDiv.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      display: "block",
    } as CSSStyleDeclaration);
  } else {
    const boundary = currentAddPosition === "left" ? minLeft : maxRight;
    const top = Math.round(window.scrollY + minTop);
    const height = Math.round(maxBottom - minTop);
    const left = Math.round(
      window.scrollX + boundary - kAddPreviewThickness / 2
    );
    const width = kAddPreviewThickness;
    Object.assign(addPreviewDiv.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      display: "block",
    } as CSSStyleDeclaration);
  }
}
