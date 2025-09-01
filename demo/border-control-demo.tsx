import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BorderControl } from "../src/components/BorderControl/BorderControl";
import type {
  BorderValueMap,
  BorderWeight,
  BorderStyle,
  CornerRadius,
  EdgeKey,
} from "../src/components/BorderControl/logic/types";

type EdgeValue = {
  weight: BorderWeight;
  style: BorderStyle;
  radius: CornerRadius;
};

const initial: BorderValueMap = {
  top: { weight: 2, style: "solid", radius: 4 },
  right: { weight: 2, style: "solid", radius: 4 },
  bottom: { weight: 2, style: "solid", radius: 4 },
  left: { weight: 2, style: "solid", radius: 4 },
  innerH: { weight: 1, style: "dashed", radius: 0 },
  innerV: { weight: 1, style: "dashed", radius: 0 },
};

function applyChange(
  map: BorderValueMap,
  edges: EdgeKey[],
  change: Partial<EdgeValue>
): BorderValueMap {
  const next: BorderValueMap = { ...map } as any;
  for (const e of edges) {
    const v = { ...next[e], ...change } as EdgeValue;
    next[e] = v;
  }
  return next;
}

function Preview({ map }: { map: BorderValueMap }) {
  const size = 160;

  const toCss = (edge: EdgeKey): string => {
    const { weight, style } = map[edge];
    const w = weight ?? 0;
    const s = style ?? "none";
    if (w === 0 || s === "none") return "0 solid transparent";
    return `${w}px ${s} #000`;
  };

  // Derive each corner radius from adjacent edges: use the minimum so a 0 on either side yields a 0 corner
  const rTL = Math.min(map.top.radius, map.left.radius);
  const rTR = Math.min(map.top.radius, map.right.radius);
  const rBR = Math.min(map.bottom.radius, map.right.radius);
  const rBL = Math.min(map.bottom.radius, map.left.radius);

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    background: "#fff",
    boxSizing: "border-box",
    // Use per-side borders so radii apply correctly and each side can reflect its weight/style
    borderTop: toCss("top"),
    borderRight: toCss("right"),
    borderBottom: toCss("bottom"),
    borderLeft: toCss("left"),
    borderTopLeftRadius: rTL,
    borderTopRightRadius: rTR,
    borderBottomRightRadius: rBR,
    borderBottomLeftRadius: rBL,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  };

  const cellBase: React.CSSProperties = {
    background: "#fff",
    boxSizing: "border-box",
  };

  const innerHStyle = map.innerH;
  const innerVStyle = map.innerV;

  const innerHBorder = ((): string => {
    const { weight, style } = innerHStyle;
    if (weight === 0 || style === "none") return "0 solid transparent";
    return `${weight}px ${style} #000`;
  })();

  const innerVBorder = ((): string => {
    const { weight, style } = innerVStyle;
    if (weight === 0 || style === "none") return "0 solid transparent";
    return `${weight}px ${style} #000`;
  })();

  // Top-left, Top-right, Bottom-left, Bottom-right
  const c0: React.CSSProperties = {
    ...cellBase,
    borderRight: innerVBorder,
    borderBottom: innerHBorder,
  };
  const c1: React.CSSProperties = { ...cellBase, borderBottom: innerHBorder };
  const c2: React.CSSProperties = { ...cellBase, borderRight: innerVBorder };
  const c3: React.CSSProperties = { ...cellBase };

  return (
    <div style={{ background: "white", padding: 10 }}>
      <div style={wrapperStyle}>
        <div style={c0} />
        <div style={c1} />
        <div style={c2} />
        <div style={c3} />
      </div>
    </div>
  );
}

function App() {
  const [map, setMap] = useState<BorderValueMap>(initial);
  const [log, setLog] = useState<string[]>([]);

  const onChange = (next: BorderValueMap) => {
    setLog((old) => [
      `${new Date().toLocaleTimeString()}: map updated`,
      ...old.slice(0, 20),
    ]);
    setMap(next);
  };

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        gap: 100,
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 className="text-xl">Border Control</h2>
        <BorderControl valueMap={map} showInner onChange={onChange} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 className="text-xl">Preview</h2>
        <Preview map={map} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minWidth: 360,
        }}
      >
        <h2 className="text-xl">Events</h2>
        <div
          style={{
            background: "#161616",
            borderRadius: 8,
            padding: 12,
            height: 200,
            overflow: "auto",
          }}
        >
          <ul style={{ fontFamily: "monospace", fontSize: 12 }}>
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
        <h2 className="text-xl">Current valueMap</h2>
        <pre
          style={{
            background: "#161616",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
          }}
        >
          {JSON.stringify(map, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
