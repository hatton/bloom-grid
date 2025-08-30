import { CornerRadius } from "../logic/types";

export function CornerIcon({
  value,
  color = "#fff",
}: {
  value: CornerRadius | "mixed";
  color?: string;
}) {
  if (value === "mixed") return <span style={{ fontSize: 11 }}>Mixed</span>;
  const r = value * 2; // make corners twice as big
  return (
    <svg
      width={32}
      height={18}
      viewBox="0 0 32 18"
      aria-hidden
      style={{ display: "block", margin: "auto" }}
    >
      <rect x="4" y="4" width="24" height="10" fill="none" />
      {r > 0 ? (
        <path
          d={`M 10 14 Q 10 ${14 - r} ${10 + r} ${14 - r}`}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      ) : (
        <path
          d="M 10 14 L 10 10 L 14 10"
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      )}
    </svg>
  );
}
