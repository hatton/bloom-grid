import React, { useState, useEffect, useRef } from "react";
import * as Grid from "../src";
import GridMenu from "../src/components/GridMenu";
import SelectedCellInfo from "../src/components/SelectedCellInfo";

const App: React.FC<{}> = () => {
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
  };

  // Function to clear selected cell when focus moves outside the grid
  const clearSelectedCellIfNeeded = () => {
    // const currentFocus = document.activeElement;
    // const isInGrid =
    //   currentFocus?.closest(".grid") || currentFocus?.closest(".cell");
    // const isInMenu = currentFocus?.closest(".grid-menu");
    // // Only clear if focus is not in grid and not in menu
    // if (!isInGrid && !isInMenu) {
    //   selectedCellRef.current = null;
    //   setCellSelected(false);
    // }
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

    // Restore focus to the previously selected cell
    restoreCellFocus();
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
    attachGridWhenReady(); // Listen for focus changes to update UI state
    const handleFocusChange = () => {
      updateUIState();
      // Also check if we should clear the selected cell
      setTimeout(clearSelectedCellIfNeeded, 10); // Small delay to ensure focus has settled
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
      // Restore focus to the previously selected cell
      restoreCellFocus();
    } else {
      console.warn("Target grid not found for adding a row.");
    }
  };

  const handleRemoveRow = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      Grid.removeLastRow(grid);
      updateUIState();
      // Restore focus to the previously selected cell
      restoreCellFocus();
    } else {
      console.warn("Target grid not found for removing a row.");
    }
  };

  const handleAddColumn = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      Grid.addColumn(grid);
      updateUIState();
      // Restore focus to the previously selected cell
      restoreCellFocus();
    } else {
      console.warn("Target grid not found for adding a column.");
    }
  };

  const handleRemoveColumn = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      Grid.removeLastColumn(grid);
      updateUIState();
      // Restore focus to the previously selected cell
      restoreCellFocus();
    } else {
      console.warn("Target grid not found for removing a column.");
    }
  };

  const handleUndo = () => {
    const grid = Grid.getTargetGrid();
    if (grid) {
      const success = Grid.undoLastOperation(grid);
      updateUIState();
      // Restore focus to the previously selected cell
      restoreCellFocus();
      if (!success) {
        console.warn("No operations to undo or undo failed.");
      }
    } else {
      console.warn("Target grid not found for undo operation.");
    }
  };
  return (
    <>
      {/* Cell Information UI */}
      <SelectedCellInfo updateTrigger={selectionUpdateTrigger} />{" "}
      {/* Grid Menu UI - only show when a cell is selected */}
      {cellSelected && (
        <GridMenu
          updateUIState={updateUIState}
          showBorders={showBorders}
          selectedCellRef={selectedCellRef}
        />
      )}
      {/* Keep this div to maintain layout structure, but it can be empty */}
      <div className="space-y-4"></div>
    </>
  );
};

export default App;
