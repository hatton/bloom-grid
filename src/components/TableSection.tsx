import React from "react";
import { BorderControl } from "./BorderControl/BorderControl";
import type {
  BorderValueMap,
  BorderWeight,
  BorderStyle,
  CornerRadius,
} from "./BorderControl/logic/types";

type Props = {
  grid?: HTMLElement;
};

// --- BorderControl wiring helpers (moved from GridMenu) ---
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
const buildBorderMapFromGrid = (g: HTMLElement): BorderValueMap => {
  const cs = getComputedStyle(g);
  const outlineW = snapWeight(parsePx(cs.outlineWidth));
  const computedOutlineStyle = (cs.outlineStyle || "").trim();
  const outlineStyle: BorderStyle =
    computedOutlineStyle === "solid" ||
    computedOutlineStyle === "dashed" ||
    computedOutlineStyle === "dotted" ||
    computedOutlineStyle === "none"
      ? (computedOutlineStyle as BorderStyle)
      : outlineW === 0
      ? "none"
      : "solid";
  const innerVar = cs.getPropertyValue("--cell-border-width")?.trim();
  const innerW = snapWeight(parsePx(innerVar));
  const innerStyleVar = cs
    .getPropertyValue("--cell-border-style")
    ?.trim()
    .toLowerCase();
  const innerStyle: BorderStyle =
    innerStyleVar === "solid" ||
    innerStyleVar === "dashed" ||
    innerStyleVar === "dotted" ||
    innerStyleVar === "none"
      ? (innerStyleVar as BorderStyle)
      : innerW === 0
      ? "none"
      : "solid";
  const radius: CornerRadius = 0;
  return {
    top: { weight: outlineW, style: outlineStyle, radius },
    right: { weight: outlineW, style: outlineStyle, radius },
    bottom: { weight: outlineW, style: outlineStyle, radius },
    left: { weight: outlineW, style: outlineStyle, radius },
    innerH: { weight: innerW, style: innerStyle, radius: 0 },
    innerV: { weight: innerW, style: innerStyle, radius: 0 },
  };
};
const applyBorderMapToGrid = (g: HTMLElement, map: BorderValueMap) => {
  const perimeter = map.top;
  g.style.setProperty(
    "--grid-border-width",
    perimeter.weight === 0 ? "0px" : `${perimeter.weight}px`
  );
  g.style.setProperty("--grid-border-style", perimeter.style);

  const maxInnerW = Math.max(map.innerH.weight, map.innerV.weight);
  const innerStyle: BorderStyle =
    map.innerH.style === "none" && map.innerV.style === "none"
      ? "none"
      : map.innerH.style !== "none"
      ? map.innerH.style
      : map.innerV.style;
  g.style.setProperty(
    "--cell-border-width",
    innerStyle === "none" || maxInnerW === 0 ? "0px" : `${maxInnerW}px`
  );
  g.style.setProperty("--cell-border-style", innerStyle);

  const r = Math.max(
    map.top.radius,
    map.right.radius,
    map.bottom.radius,
    map.left.radius
  );
  const cells = g.querySelectorAll<HTMLElement>(":scope > .cell");
  cells.forEach((c) => {
    c.style.borderRadius = r ? `${r}px` : "";
  });
};

const menuItemStyle =
  "flex items-center gap-2 px-4 py-1 cursor-pointer w-full text-left";
const sectionStyle = "border-b border-gray-200 pb-2 flex flex-col gap-1";
const sectionTitleStyle = "px-4 py-1 text-lg font-medium";

export const TableSection: React.FC<Props> = ({ grid }) => {
  return (
    <div className={sectionStyle}>
      <h2 className={sectionTitleStyle}>Table</h2>
      {grid && (
        <div className={menuItemStyle} style={{ cursor: "default" }}>
          <BorderControl
            valueMap={buildBorderMapFromGrid(grid)}
            showInner
            onChange={(next) => applyBorderMapToGrid(grid, next)}
          />
        </div>
      )}
    </div>
  );
};

export default TableSection;
