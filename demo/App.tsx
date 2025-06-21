import React, { useState, useEffect, useRef } from "react";
import GridMenu from "../src/components/GridMenu";
import { gridHistoryManager } from "../src";

const App: React.FC<{}> = () => {
  const [currentCell, setCurrentCell] = useState<HTMLDivElement | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  // Use event listeners to update currentCell when a cell is focused
  useEffect(() => {
    // Handle focus events on cells
    const handleCellFocus = (event: FocusEvent) => {
      const target = event.target as HTMLDivElement;
      if (target && target.closest(".cell")) {
        setCurrentCell(target.closest(".cell") as HTMLDivElement);
      } else {
        setCurrentCell(null);
      }
    };

    // // Handle blur events to potentially clear selection
    // const handleCellBlur = (event: FocusEvent) => {
    //   // Only clear if focus isn't moving to another cell
    //   const relatedTarget = event.relatedTarget as HTMLElement;
    //   if (!relatedTarget || !relatedTarget.closest(".cell")) {
    //     setCurrentCell(null);
    //   }
    // };

    // Attach the event listeners using event delegation
    document.addEventListener("focusin", handleCellFocus, true);
    //document.addEventListener("focusout", handleCellFocus, true);

    // Cleanup function to remove the event listeners
    return () => {
      document.removeEventListener("focusin", handleCellFocus, true);
      //document.removeEventListener("focusout", handleCellFocus, true);
    };
  }, []);
  const isDisabled = !currentCell || !gridHistoryManager.canUndo();

  return (
    <>
      {/* TODO: the history manager would need to call us back to know to enable or disable this when operations happen */}
      <button
        disabled={isDisabled}
        onMouseDown={(e) => e.preventDefault()} // Prevent default to avoid losing focus
        onClick={() => {
          if (currentCell) {
            gridHistoryManager.undo(
              currentCell!.closest(".grid") as HTMLElement
            );
          }
        }}
        style={{
          padding: "10px 20px",
          backgroundColor: isDisabled ? "#cccccc" : "#007bff",
          color: isDisabled ? "#666666" : "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.7 : 1,
        }}
      >
        Undo
      </button>

      <GridMenu currentCell={currentCell} />
    </>
  );
};

export default App;
