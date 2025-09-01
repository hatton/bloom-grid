import React from "react";

export type RadioOption = {
  id: string;
  label?: string;
  icon?: string; // optional svg path
};

type Props = {
  options: RadioOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

const itemBase: React.CSSProperties = {
  backgroundColor: "#2D8294",
  width: 64,
  height: 64,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "rgba(255,255,255,0.95)",
  fontSize: 14,
  textAlign: "center",
  lineHeight: 1.1,
  padding: 6,
};

const RadioTile: React.FC<{
  option: RadioOption;
  selected: boolean;
  onClick: () => void;
}> = ({ option, selected, onClick }) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    style={{
      ...itemBase,
      border: selected
        ? "3px solid rgba(255,255,255,0.95)"
        : "3px solid transparent",
    }}
    aria-pressed={selected}
    aria-label={option.label || option.id}
    title={option.label || option.id}
  >
    {option.icon ? (
      <img src={option.icon} alt="" style={{ width: 28, height: 28 }} />
    ) : (
      <div style={{ whiteSpace: "pre-wrap" }}>{option.label}</div>
    )}
  </button>
);

const RadioGroup: React.FC<Props> = ({
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div
      className={className}
      style={{ display: "flex", gap: 12, alignItems: "center" }}
    >
      {options.map((opt) => (
        <RadioTile
          key={opt.id}
          option={opt}
          selected={value === opt.id}
          onClick={() => onChange(opt.id)}
        />
      ))}
    </div>
  );
};

export default RadioGroup;
