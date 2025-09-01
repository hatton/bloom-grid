import React from "react";
import * as Grid from "../";
import addRowAboveIcon from "./icons/add-row-above.svg";
import addRowBelowIcon from "./icons/add-row-below.svg";
import deleteRowIcon from "./icons/delete-row.svg";
import IconButton from "./IconButton";
import rowGrowIcon from "./icons/row-grow.svg";
import rowHugIcon from "./icons/row-hug.svg";
import RadioGroup, { RadioOption } from "./RadioGroup";

type Props = {
  grid?: HTMLElement;
  currentCell?: HTMLElement | null;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onDelete: () => void;
};

const sectionStyle = "border-b border-gray-200 pb-3 flex flex-col gap-2";
const sectionTitleStyle = "px-4 pt-1 text-2xl font-semibold";
const subTitleStyle = "px-4 text-base opacity-90";

// IconButton now comes from ./IconButton and defaults to 64x64.

export const RowSection: React.FC<Props> = ({
  grid,
  currentCell,
  onInsertAbove,
  onInsertBelow,
  onDelete,
}) => {
  // Determine current row height and map to radio value
  let selectedSize: "grow" | "hug" | "px" = "hug";
  let pxLabel = "px";
  try {
    if (grid && currentCell) {
      const rowIndex = Grid.getRowIndex(currentCell);
      const h = Grid.getRowHeight(grid, rowIndex) || "hug";
      if (h === "hug") selectedSize = "hug";
      else if (h === "fill") selectedSize = "grow";
      else if (/(px|mm)$/i.test(h)) {
        selectedSize = "px";
        pxLabel = h;
      }
    }
  } catch {}

  const sizeOptions: RadioOption[] = [
    { id: "grow", icon: rowGrowIcon, label: "Grow" },
    { id: "hug", icon: rowHugIcon, label: "Hug" },
    { id: "px", label: pxLabel },
  ];

  const onChangeSize = (id: string) => {
    if (!grid || !currentCell) return;
    const rowIndex = Grid.getRowIndex(currentCell);
    if (id === "grow") Grid.setRowHeight(grid, rowIndex, "fill");
    else if (id === "hug") Grid.setRowHeight(grid, rowIndex, "hug");
    else if (id === "px") {
      // Keep existing fixed value if present; otherwise set a default 10mm
      const current = Grid.getRowHeight(grid, rowIndex);
      const next = current && /(px|mm)$/i.test(current) ? current : "10mm";
      Grid.setRowHeight(grid, rowIndex, next);
    }
  };
  return (
    <div className={sectionStyle}>
      <h2 className={sectionTitleStyle}>Row</h2>
      <div className={subTitleStyle}>Size</div>
      <RadioGroup
        className="px-4"
        options={sizeOptions}
        value={selectedSize}
        onChange={onChangeSize}
      />
      <div className={subTitleStyle}>Add / Remove</div>
      <div
        className="px-4 pb-1 flex items-center justify-between gap-3"
        // Ensure the menu doesn't steal focus on mousedown (consistent with other sections)
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex gap-3">
          <IconButton
            icon={addRowAboveIcon}
            alt="Insert Row Above"
            onClick={onInsertAbove}
          />
          <IconButton
            icon={addRowBelowIcon}
            alt="Insert Row Below"
            onClick={onInsertBelow}
          />
        </div>
        <IconButton icon={deleteRowIcon} alt="Delete Row" onClick={onDelete} />
      </div>
    </div>
  );
};

export default RowSection;
