import React from "react";
import IconButton from "./IconButton";

export type RadioOption = {
  id: string;
  label?: string;
  icon?: string; // optional svg path
  labelStyle?: React.CSSProperties; // optional style for text-only labels
};

type Props = {
  options: RadioOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

// No per-tile sizing here; tiles inherit size from IconButton.

const RadioGroup: React.FC<Props> = ({
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div className={className} style={{ display: "flex", gap: 12 }}>
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <IconButton
            key={opt.id}
            icon={opt.icon}
            alt={opt.label || opt.id}
            title={opt.label || opt.id}
            onClick={() => onChange(opt.id)}
            selected={selected}
            style={{
              border: selected
                ? "3px solid rgba(255,255,255,0.95)"
                : "3px solid transparent",
            }}
          >
            {!opt.icon && (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  textAlign: "center",
                  lineHeight: 1.1,
                  padding: 6,
                  // Allow per-option label styling to be controlled by the caller
                  ...(opt.labelStyle || {}),
                }}
              >
                {opt.label}
              </div>
            )}
          </IconButton>
        );
      })}
    </div>
  );
};

export default RadioGroup;
