import React from "react";

type Props = {
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onDelete: () => void;
};

const menuItemStyle =
  "flex items-center gap-2 px-4 py-1 cursor-pointer w-full text-left";
const sectionStyle = "border-b border-gray-200 pb-2 flex flex-col gap-1";
const sectionTitleStyle = "px-4 py-1 text-lg font-medium";

export const RowSection: React.FC<Props> = ({
  onInsertAbove,
  onInsertBelow,
  onDelete,
}) => {
  return (
    <div className={sectionStyle}>
      <h2 className={sectionTitleStyle}>Row</h2>
      <div className={menuItemStyle} onClick={onInsertAbove}>
        <span className="text-2xl">↑</span>
        <span>Insert Row Above</span>
      </div>
      <div className={menuItemStyle} onClick={onInsertBelow}>
        <span className="text-2xl">↓</span>
        <span>Insert Row Below</span>
      </div>
      <div className={menuItemStyle} onClick={onDelete}>
        <span className="text-xl">🗑️</span>
        <span>Delete Row</span>
      </div>
    </div>
  );
};

export default RowSection;
