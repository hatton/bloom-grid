import React from "react";
import * as Grid from "../";
import { setupContentsOfCell } from "../cell-contents";
import { defaultCellContents } from "../cell-contents";

interface GridMenuProps {
  updateUIState: () => void;
  showBorders: boolean;
  selectedCellRef?: React.RefObject<HTMLElement | null>;
}

const GridMenu: React.FC<GridMenuProps> = ({
  updateUIState,
  showBorders,
  selectedCellRef,
}) => {
  console.log(
    "🎨 GridMenu render - selectedCellRef?.current:",
    selectedCellRef?.current
  );
  console.log(
    "🎨 GridMenu render - document.activeElement:",
    document.activeElement
  );

  const cellContentTypes = defaultCellContents;
  // Helper function to restore focus to the selected cell
  const restoreCellFocus = () => {
    console.log("🔄 restoreCellFocus called");
    console.log("📍 selectedCellRef?.current:", selectedCellRef?.current);
    if (selectedCellRef?.current) {
      console.log("✅ Restoring focus to cell:", selectedCellRef.current);
      selectedCellRef.current.focus();
      console.log(
        "📍 document.activeElement after focus:",
        document.activeElement
      );
    } else {
      console.log("❌ No selectedCellRef.current to focus");
    }
  }; // Helper to get grid from selected cell or fallback to getTargetGrid
  const getTargetGridFromSelection = (): HTMLElement | null => {
    // Try to find grid from selectedCellRef first
    if (selectedCellRef?.current) {
      const grid = selectedCellRef.current.closest<HTMLElement>(".grid");
      if (grid) return grid;
    }

    // Fallback to the original method
    return Grid.getTargetGrid();
  };

  // Helper to get cell info when a cell is selected
  const getSelectedCellInfo = () => {
    console.log("🔍 getSelectedCellInfo called");
    const grid = Grid.getTargetGrid();
    if (!grid) {
      console.log("❌ No grid found");
      return null;
    }

    // Prioritize the selected cell reference since it's more reliable
    console.log("📍 selectedCellRef?.current:", selectedCellRef?.current);
    console.log("📍 document.activeElement:", document.activeElement);

    let selectedCell = selectedCellRef?.current;

    // Only fallback to document.activeElement if selectedCellRef is not available
    if (!selectedCell) {
      console.log(
        "📍 document.activeElement.closest('.cell'):",
        document.activeElement?.closest(".cell")
      );
      selectedCell = document.activeElement?.closest(".cell") as HTMLElement;
    }

    if (!selectedCell) {
      console.log("❌ No selected cell found");
      return null;
    }

    console.log("✅ Selected cell found:", selectedCell);

    // Use the now exported getRowAndColumn function
    const { row, column } = Grid.getRowAndColumn(grid, selectedCell);
    const spanX =
      parseInt(selectedCell.style.getPropertyValue("--span-x")) || 1;
    const spanY =
      parseInt(selectedCell.style.getPropertyValue("--span-y")) || 1;

    console.log(
      `📊 Cell info - Row: ${row}, Column: ${column}, SpanX: ${spanX}, SpanY: ${spanY}`
    );
    return { grid, cell: selectedCell, row, column, spanX, spanY };
  };
  // Cell operations
  const handleSetCellContentType = (contentTypeId: string) => {
    const info = getSelectedCellInfo();
    if (!info) throw new Error("No cell selected");

    setupContentsOfCell(info.cell, contentTypeId);
    updateUIState();
    restoreCellFocus();
  };

  const handleExtendCell = () => {
    const info = getSelectedCellInfo();
    if (!info) throw new Error("No cell selected");

    // Increase horizontal span by 1
    const newSpanX = info.spanX + 1;
    info.cell.style.setProperty("--span-x", newSpanX.toString());
    updateUIState();
    restoreCellFocus();
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
    restoreCellFocus();
  }; // Row operations
  const handleInsertRowAbove = () => {
    const grid = getTargetGridFromSelection();
    if (!grid) throw "no grid identified";

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.addRow(grid);
    } else {
      Grid.addRowAt(grid, info.row);
    }
    updateUIState();
    restoreCellFocus();
  };
  const handleInsertRowBelow = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    console.log("🚀 handleInsertRowBelow called");
    console.log("📍 Event target:", event.target);
    console.log("📍 Event currentTarget:", event.currentTarget);
    console.log("📍 document.activeElement at start:", document.activeElement);

    // prevent taking focus away from the cell
    event.preventDefault();
    event.stopPropagation();

    console.log(
      "📍 document.activeElement after preventDefault:",
      document.activeElement
    );
    console.log("📍 selectedCellRef?.current:", selectedCellRef?.current);

    const grid = getTargetGridFromSelection();
    console.log("🎯 Grid found:", grid);

    if (!grid) {
      console.log("❌ No grid identified");
      throw "no grid identified";
    }

    const info = getSelectedCellInfo();
    if (!info) {
      console.log("⚠️ No cell info, adding row at end");
      Grid.addRow(grid);
    } else {
      console.log(
        "✅ Cell info found, adding row below at position:",
        info.row + info.spanY
      );
      Grid.addRowAt(grid, info.row + info.spanY);
    }
    updateUIState();
    restoreCellFocus();
  };
  const handleDeleteRow = () => {
    const grid = getTargetGridFromSelection();
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
    restoreCellFocus();
  }; // Column operations
  const handleInsertColumnLeft = () => {
    const grid = getTargetGridFromSelection();
    if (!grid) throw "no grid identified";

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.addColumn(grid);
    } else {
      Grid.addColumnAt(grid, info.column);
    }
    updateUIState();
    restoreCellFocus();
  };

  const handleInsertColumnRight = () => {
    const grid = getTargetGridFromSelection();
    if (!grid) throw "no grid identified";

    const info = getSelectedCellInfo();
    if (!info) {
      Grid.addColumn(grid);
    } else {
      Grid.addColumnAt(grid, info.column + info.spanX);
    }
    updateUIState();
    restoreCellFocus();
  };

  const handleDeleteColumn = () => {
    const grid = getTargetGridFromSelection();
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
    restoreCellFocus();
  }; // Grid operations
  const handleToggleOutsideBorder = () => {
    const grid = getTargetGridFromSelection();
    if (!grid) throw "no grid identified";

    if (!showBorders) {
      grid.style.setProperty("--cell-border-width", "1px");
    } else {
      grid.style.setProperty("--cell-border-width", "0px");
    }
    updateUIState();
    restoreCellFocus();
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
        <div
          className={menuItemStyle}
          onClick={(event) => handleInsertRowBelow(event)}
        >
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
