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
import { applyCellPerimeter, ensureEdgesArrays } from "../edge-utils";
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
const buildBorderMapFromCell = (c: HTMLElement): BorderValueMap => {
  // For now, sampling defaults to none; authoring writes via edge model.
  const grid = c.closest(".grid") as HTMLElement | null;
  let top = {
    weight: 0 as BorderWeight,
    style: "none" as BorderStyle,
  } as const;
  let right = {
    weight: 0 as BorderWeight,
    style: "none" as BorderStyle,
  } as const;
  let bottom = {
    weight: 0 as BorderWeight,
    style: "none" as BorderStyle,
  } as const;
  let left = {
    weight: 0 as BorderWeight,
    style: "none" as BorderStyle,
  } as const;
  if (grid) {
    ensureEdgesArrays(grid);
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
  const outerColor = (cs.color || "black").trim();
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
