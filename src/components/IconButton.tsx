import React from "react";

type Props = {
  icon: string;
  alt: string;
  onClick: () => void;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number; // default 32
};

const baseStyle: React.CSSProperties = {
  backgroundColor: "#2D8294",
  width: 64,
  height: 64,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export const IconButton: React.FC<Props> = ({
  icon,
  alt,
  onClick,
  title,
  className,
  style,
  iconSize = 32,
}) => (
  <button
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    style={{ ...baseStyle, ...style }}
    className={className}
    aria-label={alt}
    title={title ?? alt}
  >
    <img src={icon} alt="" style={{ width: iconSize, height: iconSize }} />
  </button>
);

export default IconButton;
