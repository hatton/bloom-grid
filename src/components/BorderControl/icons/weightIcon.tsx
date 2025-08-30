import { BorderStyle, BorderWeight } from "../logic/types";

export function WeightIcon({
  value,
  style,
  color = "#fff",
}: {
  value: BorderWeight | "mixed";
  style?: BorderStyle | "mixed";
  color?: string;
}) {
  if (value === "mixed") return <span style={{ fontSize: 11 }}>Mixed</span>;
  if (value === 0)
    return <span style={{ fontSize: 13, fontWeight: 600, color }}>Ø</span>;
  const strokeWidth = value;
  const visible = value > 0;
  const stroke = color;

  const dash =
    style === "dashed" ? "6 4" : style === "dotted" ? "1 3" : undefined;
  return (
    <svg width={32} height={18} viewBox="0 0 32 18" aria-hidden>
      {visible ? (
        style === "double" ? (
          <>
            <line
              x1="4"
              y1="7"
              x2="28"
              y2="7"
              stroke={stroke}
              strokeWidth={Math.max(1, strokeWidth - 1)}
            />
            <line
              x1="4"
              y1="11"
              x2="28"
              y2="11"
              stroke={stroke}
              strokeWidth={Math.max(1, strokeWidth - 1)}
            />
          </>
        ) : (
          <line
            x1="4"
            y1="9"
            x2="28"
            y2="9"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
          />
        )
      ) : (
        <rect x="4" y="8" width="24" height="2" fill="transparent" />
      )}
    </svg>
  );
}
