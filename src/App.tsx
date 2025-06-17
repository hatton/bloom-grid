import React, { useState, useEffect } from "react";
import * as GridUtils from "./grid-operations";
import { dragToResize } from "./drag-to-resize";

const App: React.FC = () => {
  const [canUndo, setCanUndo] = useState(false);

  // Update undo state after any operation
  const updateUndoState = () => {
    setCanUndo(GridUtils.canUndo());
  };

  useEffect(() => {
    updateUndoState();

    // get it from the body
    const mainGrid = document.querySelector("#main-grid");
    if (mainGrid) {
      dragToResize.attach(mainGrid! as HTMLElement);
    }

    // Listen for history updates to refresh undo state
    const handleGridHistoryUpdated = (event: Event) => {
      updateUndoState();
    };

    document.addEventListener("gridHistoryUpdated", handleGridHistoryUpdated);

    // Cleanup on unmount
    return () => {
      if (mainGrid) {
        dragToResize.detach(mainGrid);
      }
      document.removeEventListener(
        "gridHistoryUpdated",
        handleGridHistoryUpdated
      );
    };
  }, []);

  const handleAddRow = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      GridUtils.addRow(grid);
      // updateUndoState(); // No longer needed here, gridHistoryUpdated handles it
    } else {
      console.warn("Target grid not found for adding a row.");
    }
  };

  const handleRemoveRow = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      GridUtils.removeLastRow(grid);
      // updateUndoState(); // No longer needed here, gridHistoryUpdated handles it
    } else {
      console.warn("Target grid not found for removing a row.");
    }
  };

  const handleAddColumn = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      GridUtils.addColumn(grid);
      // updateUndoState(); // No longer needed here, gridHistoryUpdated handles it
    } else {
      console.warn("Target grid not found for adding a column.");
    }
  };

  const handleRemoveColumn = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      GridUtils.removeLastColumn(grid);
      // updateUndoState(); // No longer needed here, gridHistoryUpdated handles it
    } else {
      console.warn("Target grid not found for removing a column.");
    }
  };

  const handleUndo = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      const success = GridUtils.undoLastOperation(grid);
      // if (success) {
      //   updateUndoState(); // No longer needed here, gridHistoryUpdated handles it
      // } else {
      //   console.warn("No operations to undo or undo failed.");
      // }
      if (!success) {
        console.warn("No operations to undo or undo failed.");
      }
    } else {
      console.warn("Target grid not found for undo operation.");
    }
  };
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow">
      {" "}
      <div className="flex flex-wrap space-x-0 sm:space-x-4 space-y-2 sm:space-y-0 justify-center">
        <button
          onClick={handleAddRow}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Add a new row to the bottom of the main grid"
        >
          + Row
        </button>
        <button
          onClick={handleRemoveRow}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Remove the last row from the main grid"
        >
          - Row
        </button>
        <button
          onClick={handleAddColumn}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Add a new column to the right of the main grid"
        >
          + Column
        </button>
        {/* - Column */}
        <button
          onClick={handleRemoveColumn}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Remove the last column from the main grid"
        >
          - Column
        </button>
        <button
          onClick={handleUndo}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canUndo}
          tabIndex={-1}
          className={`w-full sm:w-auto font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 transition duration-150 ease-in-out ${
            canUndo
              ? "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400 focus:ring-opacity-50"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-label="Undo the last grid operation"
        >
          Undo
        </button>
      </div>
    </div>
  );
};

export default App;
