import React, { useEffect, useState } from "react";
import { BorderControl } from "./BorderControl/BorderControl";
import Section from "./Section";
import type {
  BorderValueMap,
  BorderWeight,
  BorderStyle,
  CornerRadius,
} from "./BorderControl/logic/types";
import CornerMenu from "./BorderControl/menus/CornerMenu";

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
  // Read grid corner radius (use top-left as representative; CornerMenu will handle mixed state separately)
  const radiusPx = parsePx(cs.borderTopLeftRadius);
  const radius: CornerRadius = ([0, 2, 4, 8] as number[]).includes(radiusPx)
    ? (radiusPx as CornerRadius)
    : 0;
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
};

const menuItemStyle =
  "flex items-center gap-2 px-4 py-1 cursor-pointer w-full text-left";

export const TableSection: React.FC<Props> = ({ grid }) => {
  // Corner menu value state, derived from the grid and updated on change
  const getCornerValue = (
    g: HTMLElement | undefined | null
  ): CornerRadius | "mixed" => {
    if (!g) return 0;
    const cs = getComputedStyle(g);
    const radii = [
      parsePx(cs.borderTopLeftRadius),
      parsePx(cs.borderTopRightRadius),
      parsePx(cs.borderBottomRightRadius),
      parsePx(cs.borderBottomLeftRadius),
    ].map((n) => Math.round(n));
    const uniq = Array.from(new Set(radii));
    if (uniq.length !== 1) return "mixed";
    const r = uniq[0];
    return ([0, 2, 4, 8] as number[]).includes(r)
      ? (r as CornerRadius)
      : ("mixed" as const);
  };

  const [cornerValue, setCornerValue] = useState<CornerRadius | "mixed">(
    getCornerValue(grid)
  );
  useEffect(() => {
    setCornerValue(getCornerValue(grid));
  }, [grid]);

  return (
    <Section label="Table">
      {grid && (
        <>
          {(() => {
            const valueMap = buildBorderMapFromGrid(grid);
            const cornerDisabled =
              valueMap.top.weight === 0 || valueMap.top.style === "none";
            return (
              <>
                <div className={menuItemStyle} style={{ cursor: "default" }}>
                  <BorderControl
                    valueMap={valueMap}
                    showInner
                    onChange={(next) => applyBorderMapToGrid(grid, next)}
                  />
                </div>
                <div className={menuItemStyle} style={{ cursor: "default" }}>
                  <CornerMenu
                    value={cornerValue}
                    onChange={(v) => {
                      if (!grid) return;
                      grid.style.borderRadius = v ? `${v}px` : "";
                      setCornerValue(v);
                    }}
                    disabled={cornerDisabled}
                  />
                </div>
              </>
            );
          })()}
        </>
      )}
    </Section>
  );
};

export default TableSection;
