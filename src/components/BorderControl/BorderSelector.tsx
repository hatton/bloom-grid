import { useMemo } from "react";
import {
  BorderValueMap,
  EdgeKey,
  InnerEdges,
  OuterEdges,
  SelectedEdges,
} from "./logic/types";

const TEAL = "#2b6e77";

export function BorderSelector(props: {
  valueMap: BorderValueMap;
  showInner?: boolean;
  selected: SelectedEdges;
  onChange: (sel: SelectedEdges) => void;
  size?: number;
}) {
  const { showInner = true, selected, onChange } = props;
  const size = props.size ?? 112;
  const stroke = TEAL;

  useMemo(() => [...OuterEdges, ...(showInner ? InnerEdges : [])], [showInner]);

  const isSel = (e: EdgeKey) => selected.has(e);
  const toggle = (e: EdgeKey | "inner") => {
    const next = new Set(selected);
    if (e === "inner") {
      for (const ie of InnerEdges) {
        if (next.has(ie)) next.delete(ie);
        else next.add(ie);
      }
    } else {
      if (next.has(e)) next.delete(e);
      else next.add(e);
    }
    onChange(next);
  };

  const w = size;
  const h = size;
  const pad = 10;
  const outerRect = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

  const segOpacity = (edge: EdgeKey) => (isSel(edge) ? 1 : 0.5);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-label="Border selector"
      style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}
    >
      {/* outer container for reference */}
      {/* Top */}
      <rect
        x={outerRect.x}
        y={outerRect.y}
        width={outerRect.w}
        height={10}
        fill={stroke}
        opacity={segOpacity("top")}
        onClick={() => toggle("top")}
      >
        <title>Toggle top border</title>
      </rect>
      {/* Bottom */}
      <rect
        x={outerRect.x}
        y={outerRect.y + outerRect.h - 8}
        width={outerRect.w}
        height={10}
        fill={stroke}
        opacity={segOpacity("bottom")}
        onClick={() => toggle("bottom")}
      />

      {/* Left */}
      <rect
        x={outerRect.x}
        y={outerRect.y}
        width={10}
        height={outerRect.h}
        fill={stroke}
        opacity={segOpacity("left")}
        onClick={() => toggle("left")}
      >
        <title>Toggle left border</title>
      </rect>
      {/* Right */}
      <rect
        x={outerRect.x + outerRect.w - 8}
        y={outerRect.y}
        width={10}
        height={outerRect.h}
        fill={stroke}
        opacity={segOpacity("right")}
        onClick={() => toggle("right")}
      >
        <title>Toggle right border</title>
      </rect>

      {/* Inner plus */}
      {showInner && (
        <g
          opacity={selected.has("innerH") || selected.has("innerV") ? 1 : 0.5}
          onClick={() => toggle("inner")}
          style={{ cursor: "pointer" }}
        >
          <title>Toggle inner borders</title>
          {/* horizontal bar */}
          <rect
            x={outerRect.x + outerRect.w * 0.25}
            y={outerRect.y + outerRect.h * 0.5 - 8}
            width={outerRect.w * 0.5}
            height={16}
            fill={stroke}
          />
          {/* vertical bar */}
          <rect
            x={outerRect.x + outerRect.w * 0.5 - 8}
            y={outerRect.y + outerRect.h * 0.25}
            width={16}
            height={outerRect.h * 0.5}
            fill={stroke}
          />
        </g>
      )}
    </svg>
  );
}

export default BorderSelector;
