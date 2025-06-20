import React from "react";
import * as Grid from "../";
import { setupContentsOfCell } from "../cell-contents";
import { defaultCellContents } from "../cell-contents";

interface GridMenuProps {
  updateUIState: () => void;
  showBorders: boolean;
}

const GridMenu: React.FC<GridMenuProps> = ({ updateUIState, showBorders }) => {
  const cellContentTypes = defaultCellContents;
  // Helper to get cell info when a cell is selected
  const getSelectedCellInfo = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) return null;

    const selectedCell = document.activeElement?.closest(
      ".cell"
    ) as HTMLElement;
    if (!selectedCell) return null;

    // Use the now exported getRowAndColumn function
    const { row, column } = Grid.getRowAndColumn(grid, selectedCell);
    const spanX =
      parseInt(selectedCell.style.getPropertyValue("--span-x")) || 1;
    const spanY =
      parseInt(selectedCell.style.getPropertyValue("--span-y")) || 1;

    return { grid, cell: selectedCell, row, column, spanX, spanY };
  };

  // Cell operations
  const handleSetCellContentType = (contentTypeId: string) => {
    const info = getSelectedCellInfo();
    if (!info) throw new Error("No cell selected");

    setupContentsOfCell(info.cell, contentTypeId);
    updateUIState();
  };

  const handleExtendCell = () => {
    const info = getSelectedCellInfo();
    if (!info) throw new Error("No cell selected");

    // Increase horizontal span by 1
    const newSpanX = info.spanX + 1;
    info.cell.style.setProperty("--span-x", newSpanX.toString());
    updateUIState();
  };

  const handleContractCell = () => {
    const info = getSelectedCellInfo();
    if (!info || info.spanX <= 1) throw "could not do it";

    // Decrease horizontal span by 1
    const newSpanX = info.spanX - 1;
    if (newSpanX > 1) {
      info.cell.style.setProperty("--span-x", newSpanX.toString());
    } else {
      info.cell.style.removeProperty("--span-x");
    }
    updateUIState();
  };

  // Row operations
  const handleInsertRowAbove = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) throw "no grid identified";

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.addRow(grid);
    } else {
      Grid.addRowAt(grid, info.row);
    }
    updateUIState();
  };

  const handleInsertRowBelow = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) throw "no grid identified";

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.addRow(grid);
    } else {
      Grid.addRowAt(grid, info.row + info.spanY);
    }
    updateUIState();
  };

  const handleDeleteRow = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) throw "no grid identified";

    const gridInfo = Grid.getGridInfo(grid);
    if (gridInfo.rowCount <= 1) throw "could not do it"; // Prevent deleting the last row

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.removeLastRow(grid);
    } else {
      Grid.removeRowAt(grid, info.row);
    }
    updateUIState();
  };

  // Column operations
  const handleInsertColumnLeft = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) throw "no grid identified";

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.addColumn(grid);
    } else {
      Grid.addColumnAt(grid, info.column);
    }
    updateUIState();
  };

  const handleInsertColumnRight = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) throw "no grid identified";

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.addColumn(grid);
    } else {
      Grid.addColumnAt(grid, info.column + info.spanX);
    }
    updateUIState();
  };

  const handleDeleteColumn = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) throw "no grid identified";

    const gridInfo = Grid.getGridInfo(grid);
    if (gridInfo.columnCount <= 1) throw "could not do it"; // Prevent deleting the last column

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.removeLastColumn(grid);
    } else {
      Grid.removeColumnAt(grid, info.column);
    }
    updateUIState();
  };

  // Grid operations
  const handleToggleOutsideBorder = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) throw "no grid identified";

    if (!showBorders) {
      grid.style.setProperty("--cell-border-width", "1px");
    } else {
      grid.style.setProperty("--cell-border-width", "0px");
    }
    updateUIState();
  };

  const handleToggleInsideBorders = () => {
    // This could be implemented if needed for different border styles
    handleToggleOutsideBorder(); // For now, just toggle all borders
  };

  const menuItemStyle =
    "flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer w-full text-left";
  const sectionStyle = "border-b border-gray-200 pb-3";
  const sectionTitleStyle = "text-gray-500 px-4 py-2 text-lg font-medium";

  return (
    <div className="grid-menu bg-white border border-gray-300 rounded-md shadow-lg w-64 fixed right-4 top-4 z-10">
      {/* Cell section */}
      <div className={sectionStyle}>
        <h2 className={sectionTitleStyle}>Cell</h2>
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            {cellContentTypes?.map((type) => (
              <button
                key={type.id}
                onClick={() => handleSetCellContentType(type.id)}
                className="mr-2"
              >
                {type.localizedName}
              </button>
            ))}
          </div>
          <div className="flex-shrink-0">
            <button
              className="focus:outline-none"
              aria-label="Show content options"
            >
              ▶
            </button>
          </div>
        </div>
        <div className={menuItemStyle} onClick={handleExtendCell}>
          <span className="text-xl">↔</span>
          <span>Extend Cell</span>
        </div>
        <div className={menuItemStyle} onClick={handleContractCell}>
          <span className="text-xl">↕</span>
          <span>Contract Cell</span>
        </div>
      </div>

      {/* Row section */}
      <div className={sectionStyle}>
        <h2 className={sectionTitleStyle}>Row</h2>
        <div className={menuItemStyle} onClick={handleInsertRowAbove}>
          <span className="text-2xl">↑</span>
          <span>Insert Row Above</span>
        </div>
        <div className={menuItemStyle} onClick={handleInsertRowBelow}>
          <span className="text-2xl">↓</span>
          <span>Insert Row Below</span>
        </div>
        <div className={menuItemStyle} onClick={handleDeleteRow}>
          <span className="text-xl">🗑️</span>
          <span>Delete Row</span>
        </div>
      </div>

      {/* Column section */}
      <div className={sectionStyle}>
        <h2 className={sectionTitleStyle}>Column</h2>
        <div className={menuItemStyle} onClick={handleInsertColumnLeft}>
          <span className="text-2xl">←</span>
          <span>Insert Column Left</span>
        </div>
        <div className={menuItemStyle} onClick={handleInsertColumnRight}>
          <span className="text-2xl">→</span>
          <span>Insert Column Right</span>
        </div>
        <div className={menuItemStyle} onClick={handleDeleteColumn}>
          <span className="text-xl">🗑️</span>
          <span>Delete Column</span>
        </div>
      </div>

      {/* Grid section */}
      <div>
        <h2 className={sectionTitleStyle}>Grid</h2>
        <div className={menuItemStyle} onClick={handleToggleOutsideBorder}>
          <span className="text-xl">◰</span>
          <span>Show Outside Border</span>
        </div>
        <div className={menuItemStyle} onClick={handleToggleInsideBorders}>
          <span className="text-xl">▦</span>
          <span>Show Inside Borders</span>
        </div>
      </div>
    </div>
  );
};

export default GridMenu;
