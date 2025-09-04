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
import { getEdgesH, getEdgesV } from "../grid-model";
import {
  applyUniformInner,
  setDefaultBorder,
  applyOuterBorders,
} from "../edge-utils";
import { BloomGrid } from "../";

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

  const cols = (g.getAttribute("data-column-widths") || "")
    .split(",")
    .filter(Boolean).length;
  const rows = (g.getAttribute("data-row-heights") || "")
    .split(",")
    .filter(Boolean).length;
  const edgesH = getEdgesH(g);
  const edgesV = getEdgesV(g);
  const sample = <T,>(
    arr: Array<T> | null | undefined,
    idx: number
  ): T | null => (arr && arr.length > idx ? (arr[idx] as any) : null);
  const top = edgesH ? sample(edgesH[0], 0) : null;
  const right = edgesV ? sample(edgesV[0], cols) : null;
  const bottom = edgesH ? sample(edgesH[rows], 0) : null;
  const left = edgesV ? sample(edgesV[0], 0) : null;

  const mapOuter = (
    spec: any
  ): { weight: BorderWeight; style: BorderStyle } => ({
    weight: spec ? snapWeight(spec.weight) : 0,
    style:
      (spec?.style as BorderStyle | undefined) ?? (spec ? spec.style : "none"),
  });

  const outer = {
    top: mapOuter(top),
    right: mapOuter(right),
    bottom: mapOuter(bottom),
    left: mapOuter(left),
  } as const;

  // Inner: not inferable from computed CSS without per-cell, keep 0 defaults for UI until a cell is selected
  const innerH = { weight: 0 as BorderWeight, style: "none" as BorderStyle };
  const innerV = { weight: 0 as BorderWeight, style: "none" as BorderStyle };

  // Corners from computed style (model value shown via render)
  const radiusPx = parsePx(cs.borderTopLeftRadius);
  const radius: CornerRadius = ([0, 2, 4, 8] as number[]).includes(radiusPx)
    ? (radiusPx as CornerRadius)
    : 0;

  return {
    top: { weight: outer.top.weight, style: outer.top.style, radius },
    right: { weight: outer.right.weight, style: outer.right.style, radius },
    bottom: { weight: outer.bottom.weight, style: outer.bottom.style, radius },
    left: { weight: outer.left.weight, style: outer.left.style, radius },
    innerH: { weight: innerH.weight, style: innerH.style, radius: 0 },
    innerV: { weight: innerV.weight, style: innerV.style, radius: 0 },
  };
};

const applyBorderMapToGrid = (g: HTMLElement, map: BorderValueMap) => {
  const cs = getComputedStyle(g);
  const outerColor = (cs.color || "black").trim();
  const innerColor = (cs.color || "#444").trim();

  // Write outer edges individually for each side based on the UI map
  applyOuterBorders(
    g,
    {
      top: { weight: map.top.weight, style: map.top.style, color: outerColor },
      right: {
        weight: map.right.weight,
        style: map.right.style,
        color: outerColor,
      },
      bottom: {
        weight: map.bottom.weight,
        style: map.bottom.style,
        color: outerColor,
      },
      left: {
        weight: map.left.weight,
        style: map.left.style,
        color: outerColor,
      },
    },
    outerColor
  );
  // Inner edges: write uniform inner H and V
  applyUniformInner(
    g,
    "innerH",
    {
      weight: map.innerH.weight,
      style: map.innerH.style,
      color: innerColor,
    } as any,
    innerColor
  );
  applyUniformInner(
    g,
    "innerV",
    {
      weight: map.innerV.weight,
      style: map.innerV.style,
      color: innerColor,
    } as any,
    innerColor
  );

  // Default border as a safety for unspecified edges
  setDefaultBorder(
    g,
    {
      weight: map.innerH.weight,
      style: map.innerH.style,
      color: innerColor,
    } as any,
    innerColor
  );
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
                      const ctrl = new BloomGrid(grid);
                      ctrl.setGridCorners(v as number);
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

// Export for testing
export { buildBorderMapFromGrid, applyBorderMapToGrid };
