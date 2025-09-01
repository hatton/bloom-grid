import React from "react";
import * as Grid from "../";

type Props = {
  grid?: HTMLElement;
  currentCell: HTMLElement | null | undefined;
  onInsertLeft: () => void;
  onInsertRight: (cell: HTMLElement) => void;
  onDelete: () => void;
};

const menuItemStyle =
  "flex items-center gap-2 px-4 py-1 cursor-pointer w-full text-left";
const sectionStyle = "border-b border-gray-200 pb-2 flex flex-col gap-1";
const sectionTitleStyle = "px-4 py-1 text-lg font-medium";

const SizeControl: React.FC<{
  grid?: HTMLElement;
  cell: HTMLElement | null | undefined;
}> = ({ grid, cell }) => {
  if (!grid || !cell) return null;
  const columnIndex = Grid.getRowAndColumn(grid, cell).column;
  const width = Grid.getColumnWidth(grid, columnIndex);
  return (
    <div className="flex items-center gap-2">
      <button
        className={`px-2 py-1 rounded-md text-sm`}
        style={{
          backgroundColor: "#2D8294",
          color: "rgba(255,255,255,0.95)",
          border:
            width === "hug"
              ? "2px solid rgba(255,255,255,0.95)"
              : "2px solid transparent",
        }}
        onClick={() => Grid.setColumnWidth(grid, columnIndex, "hug")}
      >
        Hug
      </button>
      <button
        className={`px-2 py-1 rounded-md text-sm`}
        style={{
          backgroundColor: "#2D8294",
          color: "rgba(255,255,255,0.95)",
          border:
            width === "fill"
              ? "2px solid rgba(255,255,255,0.95)"
              : "2px solid transparent",
        }}
        onClick={() => Grid.setColumnWidth(grid, columnIndex, "fill")}
      >
        Fill
      </button>
      <div>{width !== "hug" && width !== "fill" ? width : ""}</div>
    </div>
  );
};

export const ColumnSection: React.FC<Props> = ({
  grid,
  currentCell,
  onInsertLeft,
  onInsertRight,
  onDelete,
}) => {
  return (
    <div className={sectionStyle}>
      <h2 className={sectionTitleStyle}>Column</h2>
      <div className={menuItemStyle}>
        <SizeControl grid={grid} cell={currentCell} />
      </div>
      <div className={menuItemStyle} onClick={onInsertLeft}>
        <span className="text-2xl">_←</span>
        <span>Insert Column Left</span>
      </div>
      <div
        className={menuItemStyle}
        onClick={() => currentCell && onInsertRight(currentCell)}
      >
        <span className="text-2xl">→_</span>
        <span>Insert Column Right</span>
      </div>
      <div className={menuItemStyle} onClick={onDelete}>
        <span className="text-xl">🗑️</span>
        <span>Delete Column</span>
      </div>
    </div>
  );
};

export default ColumnSection;
