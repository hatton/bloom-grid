import { BorderStyle } from "../logic/types";

export function StyleIcon({
  value,
  color = "#fff",
}: {
  value: BorderStyle | "mixed";
  color?: string;
}) {
  if (value === "mixed") return <span style={{ fontSize: 11 }}>Mixed</span>;
  if (value === "none") {
    return <svg width={32} height={18} viewBox="0 0 32 18" aria-hidden></svg>;
  }
  const dashMap: Record<Exclude<BorderStyle, "none">, string | undefined> = {
    solid: undefined,
    dashed: "6 4",
    dotted: "1 3",
    double: undefined,
  } as const;
  if (value === "double") {
    return (
      <svg width={32} height={18} viewBox="0 0 32 18" aria-hidden>
        <line x1="4" y1="7" x2="28" y2="7" stroke={color} strokeWidth={1} />
        <line x1="4" y1="11" x2="28" y2="11" stroke={color} strokeWidth={1} />
      </svg>
    );
  }
  return (
    <svg width={32} height={18} viewBox="0 0 32 18" aria-hidden>
      <line
        x1="4"
        y1="9"
        x2="28"
        y2="9"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashMap[value]}
      />
    </svg>
  );
}
