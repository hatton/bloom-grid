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
// icons
import textIcon from "./icons/cell-content-text.svg";
import tableIcon from "./icons/cell-content-table.svg";
import videoIcon from "./icons/cell-content-video.svg"; // used for the third content type
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
  const outlineW = snapWeight(parsePx(cs.outlineWidth));
  const computedOutlineStyle = (cs.outlineStyle || "").trim();
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
  return {
    top: { weight: outlineW, style: outlineStyle, radius: 0 },
    right: { weight: outlineW, style: outlineStyle, radius: 0 },
    bottom: { weight: outlineW, style: outlineStyle, radius: 0 },
    left: { weight: outlineW, style: outlineStyle, radius: 0 },
    innerH: { weight: 0, style: "none", radius: 0 },
    innerV: { weight: 0, style: "none", radius: 0 },
  };
};
const applyBorderMapToCell = (c: HTMLElement, map: BorderValueMap) => {
  // Cells can't do per-edge outlines; collapse to a single perimeter value.
  const weights = [
    map.top.weight,
    map.right.weight,
    map.bottom.weight,
    map.left.weight,
  ];
  const maxW = Math.max(...weights);
  const styles: BorderStyle[] = [
    map.top.style,
    map.right.style,
    map.bottom.style,
    map.left.style,
  ];
  const anyStyle = styles.find((s) => s !== "none") || "none";
  const finalStyle: BorderStyle = maxW === 0 ? "none" : anyStyle || "solid";
  c.style.outlineWidth = maxW === 0 ? "0px" : `${maxW}px`;
  c.style.outlineStyle = finalStyle;
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
              icon:
                o.id === "text"
                  ? textIcon
                  : o.id === "grid"
                  ? tableIcon
                  : /* image */ videoIcon,
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
