import React from "react";
import Section from "./Section";
import { contentTypeOptions, getCurrentContentTypeId } from "../cell-contents";

type Props = {
  currentCell?: HTMLElement | null;
  onSetContentType: (id: string) => void;
  onExtend: () => void;
  onContract: () => void;
};

const menuItemStyle =
  "flex items-center gap-2 px-4 py-1 cursor-pointer w-full text-left";

const CellSection: React.FC<Props> = ({
  currentCell,
  onSetContentType,
  onExtend,
  onContract,
}) => {
  const currentType = currentCell
    ? getCurrentContentTypeId(currentCell)
    : undefined;

  return (
    <Section label="Cell">
      <div className={menuItemStyle} style={{ cursor: "default" }}>
        <div className="flex flex-wrap gap-2 ml-2">
          {currentCell &&
            contentTypeOptions().map((option) => (
              <button
                key={option.id}
                className={`px-2 py-1 rounded-md text-sm`}
                style={{
                  backgroundColor: "#2D8294",
                  color: "rgba(255,255,255,0.95)",
                  border:
                    currentType === option.id
                      ? "2px solid rgba(255,255,255,0.95)"
                      : "2px solid transparent",
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSetContentType(option.id)}
              >
                {option.englishName}
              </button>
            ))}
        </div>
      </div>

      <div className={menuItemStyle} onClick={onExtend}>
        <span className="text-xl">↦</span>
        <span>Extend Cell</span>
      </div>
      <div className={menuItemStyle} onClick={onContract}>
        <span className="text-xl">⭰</span>
        <span>Contract Cell</span>
      </div>
    </Section>
  );
};

export default CellSection;
