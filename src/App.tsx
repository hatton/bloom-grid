import React from "react";
import * as GridUtils from "./grid-utils";

const App: React.FC = () => {
  const handleAddRow = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      GridUtils.addRow(grid);
    } else {
      console.warn("Target grid not found for adding a row.");
    }
  };

  const handleRemoveRow = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      GridUtils.removeLastRow(grid);
    } else {
      console.warn("Target grid not found for removing a row.");
    }
  };

  const handleAddColumn = () => {
    const grid = GridUtils.getTargetGrid();
    if (grid) {
      GridUtils.addColumn(grid);
    } else {
      console.warn("Target grid not found for adding a column.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow">
      <div className="flex flex-wrap space-x-0 sm:space-x-4 space-y-2 sm:space-y-0 justify-center">
        <button
          onClick={handleAddRow}
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Add a new row to the bottom of the main grid"
        >
          Add Row to Grid
        </button>
        <button
          onClick={handleRemoveRow}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Remove the last row from the main grid"
        >
          Remove Last Row
        </button>
        <button
          onClick={handleAddColumn}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
          aria-label="Add a new column to the right of the main grid"
        >
          Add Column to Grid
        </button>
      </div>
    </div>
  );
};

export default App;
