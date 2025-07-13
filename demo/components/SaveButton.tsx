import React, { useState, useEffect } from "react";
import { gridHistoryManager } from "../../src";

interface SaveButtonProps {
  currentExampleFile: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ currentExampleFile }) => {
  const [canUndo, setCanUndo] = useState(gridHistoryManager.canUndo());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const pageElement =
      document.querySelector("#page") || document.querySelector(".page");
    if (!pageElement) {
      alert("Could not find page element to save.");
      return;
    }

    setIsSaving(true);
    try {
      // Use the current example file name without extension
      const exampleName = currentExampleFile.replace(".html", "");
      const content = pageElement.innerHTML;

      console.log(`Saving example: ${exampleName}`);

      const apiUrl = `/api/save-example`;
      console.log(
        `API URL: ${apiUrl} (using relative path to avoid base URL issues)`
      );

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exampleName,
          content,
        }),
      });
      console.log(`Response status: ${response.status}`);

      if (response.ok) {
        alert("Saved successfully!");
        gridHistoryManager.clearHistory();
        setCanUndo(false);
      } else {
        const errorText = await response.text();
        console.error(`Error response body: ${errorText}`);

        let errorObj;
        try {
          errorObj = JSON.parse(errorText);
        } catch (e) {
          errorObj = { error: errorText || "Unknown error" };
        }
        alert(`Failed to save: ${errorObj.error}`);
        console.error("Failed to save:", errorObj, "Response:", response);
      }
    } catch (error) {
      console.error("Error saving:", error);
      const errorDetails =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
      console.log(`Error details: ${errorDetails}`);
      alert(`Error saving: ${errorDetails}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleHistoryUpdate = () => {
      setCanUndo(gridHistoryManager.canUndo());
    };

    document.addEventListener("gridHistoryUpdated", handleHistoryUpdate);
    return () => {
      document.removeEventListener("gridHistoryUpdated", handleHistoryUpdate);
    };
  }, []);

  return (
    <button
      disabled={!canUndo || isSaving}
      onClick={handleSave}
      style={{
        padding: "10px 20px",
        backgroundColor: canUndo && !isSaving ? "#28a745" : "#cccccc",
        color: canUndo && !isSaving ? "#fff" : "#666666",
        border: "none",
        borderRadius: "5px",
        cursor: canUndo && !isSaving ? "pointer" : "not-allowed",
        opacity: canUndo && !isSaving ? 1 : 0.7,
        marginTop: "20px",
        width: "100%",
      }}
    >
      {isSaving ? "Saving..." : "Save"}
    </button>
  );
};

export default SaveButton;
