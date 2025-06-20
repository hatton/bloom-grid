import React, { useState, useEffect } from "react";
import * as Grid from "../src";

const App: React.FC = () => {
  const [canUndo, setCanUndo] = useState(false);
  const [showBorders, setShowBorders] = useState(true);
  const [canRemoveRow, setCanRemoveRow] = useState(true);
  const [canRemoveColumn, setCanRemoveColumn] = useState(true);
  const [canAddRow, setCanAddRow] = useState(true);
  const [canAddColumn, setCanAddColumn] = useState(true);

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
  };

  // Update all UI state based on current grid
  const updateUIState = () => {
    const grid = Grid.getTargetGrid();
    const { rowCount, columnCount, hasBorders } = getGridState(grid);

    setCanUndo(Grid.canUndo());
    setCanRemoveRow(rowCount > 1);
    setCanRemoveColumn(columnCount > 1);
    setShowBorders(hasBorders);
    // we can always add rows/columns if we have the focus is in a grid
    setCanAddColumn(!!grid);
    setCanAddRow(!!grid);
  };
  // Handle border toggle
  const handleBorderToggle = () => {
    const grid = Grid.getTargetGrid();
    if (!grid) {
      console.warn("Target grid not found for updating border visibility.");
      return;
    }

    const newShowBorders = !showBorders;
    if (newShowBorders) {
      grid.style.setProperty("--cell-border-width", "1px");
    } else {
      grid.style.setProperty("--cell-border-width", "0px");
    }

    // Update UI state to reflect the change
    updateUIState();
  };
  useEffect(() => {
    updateUIState();

    // Function to attach grid when content is loaded
    const attachGridWhenReady = () => {
      const mainGrid = document.querySelector("#main-grid");
      if (mainGrid) {
        Grid.attachGrid(mainGrid as HTMLElement);
        updateUIState();
        return true;
      }
      return false;
    };

    // Listen for custom event when example content is loaded
    const handleExampleContentLoaded = () => {
      // Small delay to ensure DOM is fully updated
      setTimeout(() => {
        attachGridWhenReady();
      }, 100);
    };

    // Try to attach immediately
    attachGridWhenReady();

    // Listen for focus changes to update UI state
    const handleFocusChange = () => {
      updateUIState();
    };

    // Listen for history updates to refresh UI state
    const handleGridHistoryUpdated = () => {
      updateUIState();
    };

    // Add event listeners
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);
    document.addEventListener("gridHistoryUpdated", handleGridHistoryUpdated);
    document.addEventListener(
      "exampleContentLoaded",
      handleExampleContentLoaded
    );

    // Cleanup on unmount
    return () => {
      const mainGrid = document.querySelector("#main-grid");
      if (mainGrid) {
        Grid.dragToResize.detach(mainGrid as HTMLElement);
      }
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
      document.removeEventListener(
        "gridHistoryUpdated",
        handleGridHistoryUpdated
      );
      document.removeEventListener(
        "exampleContentLoaded",
        handleExampleContentLoaded
      );
    };
  }, []);
  const handleAddRow = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      Grid.addRow(grid);
      updateUIState();
    } else {
      console.warn("Target grid not found for adding a row.");
    }
  };

  const handleRemoveRow = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      Grid.removeLastRow(grid);
      updateUIState();
    } else {
      console.warn("Target grid not found for removing a row.");
    }
  };

  const handleAddColumn = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      Grid.addColumn(grid);
      updateUIState();
    } else {
      console.warn("Target grid not found for adding a column.");
    }
  };

  const handleRemoveColumn = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      Grid.removeLastColumn(grid);
      updateUIState();
    } else {
      console.warn("Target grid not found for removing a column.");
    }
  };

  const handleUndo = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      const success = Grid.undoLastOperation(grid);
      updateUIState();
      if (!success) {
        console.warn("No operations to undo or undo failed.");
      }
    } else {
      console.warn("Target grid not found for undo operation.");
    }
  };
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <button
          onClick={handleAddRow}
          disabled={!canAddRow}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Add a new row to the bottom of the main grid"
        >
          + Row
        </button>

        <button
          onClick={handleRemoveRow}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canRemoveRow}
          tabIndex={-1}
          className={`w-full font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 transition duration-150 ease-in-out ${
            canRemoveRow
              ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 focus:ring-opacity-50"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-label="Remove the last row from the main grid"
        >
          - Row
        </button>

        <button
          onClick={handleAddColumn}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canAddColumn}
          tabIndex={-1}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Add a new column to the right of the main grid"
        >
          + Column
        </button>

        <button
          onClick={handleRemoveColumn}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canRemoveColumn}
          tabIndex={-1}
          className={`w-full font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 transition duration-150 ease-in-out ${
            canRemoveColumn
              ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 focus:ring-opacity-50"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-label="Remove the last column from the main grid"
        >
          - Column
        </button>

        <button
          onClick={handleUndo}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canUndo}
          tabIndex={-1}
          className={`w-full font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 transition duration-150 ease-in-out ${
            canUndo
              ? "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400 focus:ring-opacity-50"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-label="Undo the last grid operation"
        >
          Undo
        </button>

        <label
          className="flex items-center space-x-2 w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-md border border-gray-300 cursor-pointer transition duration-150 ease-in-out"
          onMouseDown={(e) => e.preventDefault()}
        >
          <input
            type="checkbox"
            checked={showBorders}
            onChange={handleBorderToggle}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex={-1}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            aria-label="Toggle grid cell borders"
          />
          <span>Show Borders</span>
        </label>
      </div>
    </div>
  );
};

export default App;
