import React, { useState, useEffect } from "react";
import * as Grid from "../";
import { setupContentsOfCell } from "../cell-contents";
import { contentTypeOptions, getCurrentContentTypeId } from "../cell-contents";

import { changeCellSpan } from "../structure";

const GridMenu: React.FC<{ currentCell: HTMLElement | null | undefined }> = (
  props
) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!props.currentCell) return;
    const grid = props.currentCell.closest(".grid");
    if (!grid) return;

    const observer = new MutationObserver(() => {
      forceUpdate((x) => x + 1);
    });

    // We're interested in when the grid's columns change, which is stored
    // in the data-column-widths attribute. We also watch style in case
    // other things change that should cause a re-render.
    observer.observe(grid, {
      attributes: true,
      attributeFilter: ["data-column-widths", "style"],
    });

    return () => {
      observer.disconnect();
    };
  }, [props.currentCell]);

  const getTargetGridFromSelection = (): HTMLElement => {
    // Using props.currentCell is more reliable than document.activeElement,
    // because focus can move to the menu itself when we click a menu item.
    const grid = props.currentCell!.closest(".grid") as HTMLElement;
    return grid;
  };

  const handleSetCellContentType = (contentTypeId: string) => {
    assert(!!props.currentCell, "No cell selected");
    setupContentsOfCell(props.currentCell!, contentTypeId, true);
  };

  const handleExtendCell = () => {
    assert(!!props.currentCell, "No cell selected");

    changeCellSpan(props.currentCell!, 1, 0);
  };

  const handleContractCell = () => {
    changeCellSpan(props.currentCell!, -1, 0);
  };
  const handleInsertRowAbove = () => {
    const grid = getTargetGridFromSelection();
    const rowIndex = Grid.getRowIndex(props.currentCell!);
    Grid.addRowAt(grid, rowIndex);
  };
  const handleInsertRowBelow = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const grid = getTargetGridFromSelection();
    const rowIndex = Grid.getRowIndex(props.currentCell!);
    Grid.addRowAt(grid, rowIndex + 1);
  };
  const handleDeleteRow = () => {
    const grid = getTargetGridFromSelection();
    const rowIndex = Grid.getRowIndex(props.currentCell!);
    Grid.removeRowAt(grid, rowIndex);
  };
  const handleInsertColumnLeft = () => {
    const grid = getTargetGridFromSelection();
    const columnIndex = Grid.getRowAndColumn(grid, props.currentCell!).column;
    Grid.addColumnAt(grid, columnIndex);
  };

  const handleInsertColumnRight = () => {
    const grid = getTargetGridFromSelection();
    const columnIndex = Grid.getRowAndColumn(grid, props.currentCell!).column;
    Grid.addColumnAt(grid, columnIndex + 1);
  };

  const handleDeleteColumn = () => {
    const grid = getTargetGridFromSelection();
    const columnIndex = Grid.getRowAndColumn(grid, props.currentCell!).column;
    Grid.removeColumnAt(grid, columnIndex);
  };
  const handleToggleOutsideBorder = () => {
    const grid = getTargetGridFromSelection();
    const haveBorders =
      !grid.style ||
      !grid.style.getPropertyValue("--grid-border-width") ||
      grid.style.getPropertyValue("--grid-border-width") === "1px";
    if (!haveBorders) {
      grid.style.setProperty("--grid-border-width", "1px");
    } else {
      grid.style.setProperty("--grid-border-width", "0px");
    }
  };

  const handleToggleInsideBorders = () => {
    const grid = getTargetGridFromSelection();
    const haveBorders =
      !grid.style ||
      !grid.style.getPropertyValue("--cell-border-width") ||
      grid.style?.getPropertyValue("--cell-border-width") === "1px";
    if (!haveBorders) {
      grid.style.setProperty("--cell-border-width", "1px");
    } else {
      grid.style.setProperty("--cell-border-width", "0px");
    }
  };

  const menuItemStyle =
    "flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer w-full text-left";
  const sectionStyle = "border-b border-gray-200 pb-3";
  const sectionTitleStyle = "px-4 py-2 text-lg font-medium";
  const subSectionTitleStyle = "text-gray-500 px-4 py-2 text-md font-medium";

  const grid = props.currentCell ? getTargetGridFromSelection() : undefined;

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="grid-menu bg-white border border-gray-300 rounded-md shadow-lg w-64 fixed right-4 top-4 z-10"
      /* if haveSelectedCell is false, dim/disable the menu */
      style={{
        opacity: !!props.currentCell ? 1 : 0.5,
        pointerEvents: !!props.currentCell ? "auto" : "none",
      }}

      // onMouseDown, store the current document selection in a react state. Then onMouseUp, restore the selection.
      // TODO
    >
      {/* <div>{JSON.stringify(selectedCellRef?.current?.outerHTML || "nope")}</div> */}
      {/* Cell section */}
      <div className={sectionStyle}>
        <h2 className={sectionTitleStyle}>Cell</h2>
        {/* a submenu named "Content Type" that has options from contentTypeOptions(). 
        The one with id matching getCurrentContentTypeId() should be checked.*/}

        <div className={menuItemStyle}>
          {/* not using select because I can't get it to work without losing focus on the cell
          {props.currentCell && (
            <select
              className="ml-2"
              value={getCurrentContentTypeId(props.currentCell!)}
              onChange={(e) => handleSetCellContentType(e.target.value)}
            >
              {contentTypeOptions().map((option) => (
                <option key={option.id} value={option.id}>
                  {option.englishName}
                </option>
              ))}
            </select>
          )} */}
          {/* a row of buttons, one for each type, with the current type selected. i.e. radio button behavior */}

          <div className="flex flex-wrap gap-2 ml-2">
            {props.currentCell &&
              contentTypeOptions().map((option) => (
                <button
                  key={option.id}
                  className={`px-2 py-1 rounded-md text-sm ${
                    getCurrentContentTypeId(props.currentCell!) === option.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  onMouseDown={(e) => e.preventDefault()} // Prevent default to avoid losing focus
                  onClick={() => handleSetCellContentType(option.id)}
                >
                  {option.englishName}
                </button>
              ))}
          </div>
        </div>

        <div
          className={menuItemStyle}
          onClick={(e) => {
            handleExtendCell();
          }}
        >
          <span className="text-xl">↦</span>
          <span>Extend Cell</span>
        </div>
        <div className={menuItemStyle} onClick={handleContractCell}>
          <span className="text-xl">⭰</span>
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
          onClick={(event) => {
            handleInsertRowBelow(event);
          }}
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

        <div className={menuItemStyle}>
          <SizeControl grid={grid} cell={props.currentCell} />
        </div>
        <div className={menuItemStyle} onClick={handleInsertColumnLeft}>
          <span className="text-2xl">_←</span>
          <span>Insert Column Left</span>
        </div>
        <div className={menuItemStyle} onClick={handleInsertColumnRight}>
          <span className="text-2xl">→_</span>
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
        <div
          className={menuItemStyle}
          onClick={(event) => {
            handleToggleOutsideBorder();
          }}
        >
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

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/* 
const [canUndo, setCanUndo] = useState(false);
  const [showBorders, setShowBorders] = useState(true);
  const [canRemoveRow, setCanRemoveRow] = useState(true);
  const [canRemoveColumn, setCanRemoveColumn] = useState(true);
  const [canAddRow, setCanAddRow] = useState(true);
  const [canAddColumn, setCanAddColumn] = useState(true);
  const [selectionUpdateTrigger, setSelectionUpdateTrigger] = useState(0);
  const [cellSelected, setCellSelected] = useState(false);
  // Reference to the currently selected cell
  const selectedCellRef = useRef<HTMLElement | null>(null);
  // Store the grid reference
  const gridRef = useRef<HTMLElement | null>(null);

  // Helper function to get grid state information
  const getGridState = (grid: HTMLElement | null) => {
    if (!grid) return { rowCount: 0, columnCount: 0, hasBorders: false };

    const rowHeightsAttr = grid.getAttribute("data-row-heights");
    const rowCount = rowHeightsAttr ? rowHeightsAttr.split(",").length : 0;

    const columnWidthsAttr = grid.getAttribute("data-column-widths");
    const columnCount = columnWidthsAttr
      ? columnWidthsAttr.split(",").length
      : 0;

    const borderWidth =
      grid.style.getPropertyValue("--cell-border-width") ||
      getComputedStyle(grid).getPropertyValue("--cell-border-width");
    const hasBorders = borderWidth !== "0px" && borderWidth !== "0";

    return { rowCount, columnCount, hasBorders };
  }; // Update all UI state based on current grid
  const updateUIState = () => {
    const grid = Grid.getTargetGrid();
    gridRef.current = grid;
    const { rowCount, columnCount, hasBorders } = getGridState(grid);

    setCanUndo(Grid.canUndo());
    setCanRemoveRow(rowCount > 1);
    setCanRemoveColumn(columnCount > 1);
    setShowBorders(hasBorders);
    // we can always add rows/columns if we have the focus is in a grid
    setCanAddColumn(!!grid);
    setCanAddRow(!!grid);

    // Check if a cell is selected and update our stored reference
    const currentlyFocusedCell = document.activeElement?.closest(
      ".cell"
    ) as HTMLElement;

    // Only update the stored reference if we actually have a focused cell
    // This preserves the last selected cell when focus moves to menu items
    if (currentlyFocusedCell) {
      selectedCellRef.current = currentlyFocusedCell;
    }

    // A cell is considered "selected" if we have a stored reference,
    // regardless of current focus
    setCellSelected(!!selectedCellRef.current);

    // Trigger an update for the selected cell info component
    setSelectionUpdateTrigger((prev) => prev + 1);
  }; // Function to restore focus to the previously selected cell
  const restoreCellFocus = () => {
    if (selectedCellRef.current) {
      selectedCellRef.current.focus();
    }
  };*/

const SizeControl: React.FC<{
  grid?: HTMLElement;
  cell: HTMLElement | null | undefined;
}> = ({ grid, cell }) => {
  if (!grid || !cell) {
    return null;
  }
  const columnIndex = Grid.getRowAndColumn(grid, cell).column;
  const width = Grid.getColumnWidth(grid, columnIndex);

  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        className={`px-2 py-1 rounded-md text-sm ${
          width === "hug"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => Grid.setColumnWidth(grid, columnIndex, "hug")}
      >
        Hug
      </button>
      <button
        className={`px-2 py-1 rounded-md text-sm ${
          width === "fill"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => Grid.setColumnWidth(grid, columnIndex, "fill")}
      >
        Fill
      </button>
      <div>{width !== "hug" && width !== "fill" ? width : ""}</div>
    </div>
  );
};

export default GridMenu;
