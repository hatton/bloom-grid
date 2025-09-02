import React, { useMemo } from "react";
import Section from "./Section";
import { contentTypeOptions, getCurrentContentTypeId } from "../cell-contents";
import RadioGroup from "./RadioGroup";
import IconButton from "./IconButton";
import { BorderControl } from "./BorderControl/BorderControl";
import type {
  BorderStyle,
  BorderValueMap,
  BorderWeight,
} from "./BorderControl/logic/types";
import {
  applyCellPerimeter,
  ensureEdgesArrays,
  getGridSize,
} from "../edge-utils";
import { getEdgesOuter } from "../grid-model";
// icons
// icons are now owned by CellContentType; no direct imports here
// (leftover icons removed)
import mergeIcon from "./icons/cell-merge.svg";
import splitIcon from "./icons/cell-split.svg";

type Props = {
  currentCell?: HTMLElement | null;
  onSetContentType: (id: string) => void;
  onExtend: () => void;
  onContract: () => void;
};

const menuItemStyle =
  "flex items-center gap-2 px-4 py-1 cursor-pointer w-full text-left";

// --- Border helpers for a single cell ---
const snapWeight = (w: number): BorderWeight => {
  if (w <= 0) return 0;
  if (w < 1.5) return 1;
  if (w < 3) return 2;
  return 4;
};
const parsePx = (s: string | null | undefined): number => {
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};
const buildBorderMapFromCell = (c: HTMLElement): BorderValueMap => {
  const cs = getComputedStyle(c);
  // Prefer using grid edges where we can infer them; fallback to outline
  const outlineW = snapWeight(parsePx(cs.outlineWidth));
  const computedOutlineStyle = (cs.outlineStyle || "").trim().toLowerCase();
  const outlineStyle: BorderStyle =
    computedOutlineStyle === "solid" ||
    computedOutlineStyle === "dashed" ||
    computedOutlineStyle === "dotted" ||
    computedOutlineStyle === "double" ||
    computedOutlineStyle === "none"
      ? (computedOutlineStyle as BorderStyle)
      : outlineW === 0
      ? "none"
      : "solid";

  // Determine if this cell is on any outer edges to sample edges-outer
  const grid = c.closest(".grid") as HTMLElement | null;
  let top = { weight: outlineW, style: outlineStyle } as const;
  let right = { weight: outlineW, style: outlineStyle } as const;
  let bottom = { weight: outlineW, style: outlineStyle } as const;
  let left = { weight: outlineW, style: outlineStyle } as const;
  if (grid) {
    ensureEdgesArrays(grid);
    const { cols } = getGridSize(grid);
    const cells = Array.from(grid.children).filter((el) =>
      (el as HTMLElement).classList.contains("cell")
    ) as HTMLElement[];
    const idx = cells.indexOf(c);
    const r = Math.floor(idx / Math.max(1, cols));
    const ci = idx % Math.max(1, cols);
    const outer = getEdgesOuter(grid);
    const mapOuter = (
      spec: any,
      fallback: { weight: BorderWeight; style: BorderStyle }
    ) => ({
      weight: (spec?.weight as number) ?? fallback.weight,
      style: (spec?.style as BorderStyle) ?? fallback.style,
    });
    if (outer) {
      if (r === 0) top = mapOuter(outer.top[ci], top) as any;
      if (ci === cols - 1) right = mapOuter(outer.right[r], right) as any;
      if (cells.length > 0) {
        const rows = Math.ceil(cells.length / Math.max(1, cols));
        if (r === rows - 1) bottom = mapOuter(outer.bottom[ci], bottom) as any;
      }
      if (ci === 0) left = mapOuter(outer.left[r], left) as any;
    }
  }

  return {
    top: { weight: top.weight, style: top.style, radius: 0 },
    right: { weight: right.weight, style: right.style, radius: 0 },
    bottom: { weight: bottom.weight, style: bottom.style, radius: 0 },
    left: { weight: left.weight, style: left.style, radius: 0 },
    innerH: { weight: 0, style: "none", radius: 0 },
    innerV: { weight: 0, style: "none", radius: 0 },
  };
};
const applyBorderMapToCell = (c: HTMLElement, map: BorderValueMap) => {
  // Write via edge model so renderer picks it up deterministically
  const grid = c.closest(".grid") as HTMLElement | null;
  if (!grid) return;
  const cs = getComputedStyle(grid);
  const outerColor = (
    cs.getPropertyValue("--grid-border-color") ||
    cs.outlineColor ||
    "black"
  ).trim();
  const toUI = (w: number, s: BorderStyle) => ({
    weight: w,
    style: s,
    color: outerColor,
  });
  applyCellPerimeter(grid, c, {
    top: toUI(map.top.weight, map.top.style),
    right: toUI(map.right.weight, map.right.style),
    bottom: toUI(map.bottom.weight, map.bottom.style),
    left: toUI(map.left.weight, map.left.style),
  });
};

const CellSection: React.FC<Props> = ({
  currentCell,
  onSetContentType,
  onExtend,
  onContract,
}) => {
  const currentType = currentCell
    ? getCurrentContentTypeId(currentCell)
    : undefined;

  const borderValueMap: BorderValueMap | undefined = useMemo(() => {
    if (!currentCell) return undefined;
    return buildBorderMapFromCell(currentCell);
  }, [currentCell]);

  return (
    <Section label="Cell">
      {/* Content type selector */}
      <div
        className={menuItemStyle}
        style={{ cursor: "default", display: "block" }}
      >
        <div className="text-sm opacity-80 mb-2">Content</div>
        {currentCell && currentType && (
          <RadioGroup
            className="ml-2"
            value={currentType}
            onChange={(id) => onSetContentType(id)}
            options={contentTypeOptions().map((o) => ({
              id: o.id,
              label: o.englishName,
              icon: o.icon,
            }))}
          />
        )}
      </div>

      {/* Borders */}
      <div
        className={menuItemStyle}
        style={{ cursor: "default", display: "block" }}
      >
        <div className="text-sm opacity-80 mb-2">Borders</div>
        {currentCell && borderValueMap && (
          <BorderControl
            valueMap={borderValueMap}
            showInner={false}
            onChange={(next) => applyBorderMapToCell(currentCell, next)}
          />
        )}
      </div>

      {/* Merge / Split */}
      <div
        className={menuItemStyle}
        style={{ cursor: "default", display: "block" }}
      >
        <div className="text-sm opacity-80 mb-2">Merge / Split</div>
        <div className="flex items-center gap-3 ml-2">
          <IconButton
            alt="Merge"
            title="Merge"
            icon={mergeIcon}
            onClick={onExtend}
          />
          <IconButton
            alt="Split"
            title="Split"
            icon={splitIcon}
            onClick={onContract}
          />
        </div>
      </div>
    </Section>
  );
};

export default CellSection;
