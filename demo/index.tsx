console.log("Script starting to load...");

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { attachGrid, gridHistoryManager } from "../src";

console.log("React, ReactDOM, and App imported successfully");

// Current example file reference
let currentExampleFile = "";

// Save Button Component
const SaveButton: React.FC = () => {
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

      // Make sure we're using the right API URL - use direct path with no base
      // This should help ensure Vite's base URL configuration doesn't affect our API call
      const apiUrl = `/api/save-example`;
      console.log(
        `API URL: ${apiUrl} (using relative path to avoid base URL issues)`
      );

      // Log the request to help debug
      const requestBody = JSON.stringify({
        exampleName,
        content: content.substring(0, 50) + "...", // Log truncated content for clarity
      });
      console.log(
        `Sending request with body: ${JSON.stringify({ exampleName })}`
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
      console.log(
        `Response headers:`,
        Object.fromEntries([...response.headers.entries()])
      );

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

// Example files to load - will be populated from API
let exampleFiles: { name: string; file: string }[] = [];

// Function to fetch available example files from the API
async function fetchExampleFiles(): Promise<void> {
  try {
    const response = await fetch("/api/examples");
    if (response.ok) {
      exampleFiles = await response.json();
    } else {
      console.error(
        "Failed to fetch example files from API, status:",
        response.status
      );
      exampleFiles = [];
    }
  } catch (error) {
    console.error("Error fetching example files:", error);
    exampleFiles = [];
  }
}

// Function to load and parse HTML content
async function loadExampleContent(filename: string): Promise<string> {
  try {
    const response = await fetch(`./${filename}`);
    const htmlContent = await response.text();

    // Parse the HTML and extract the body content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const bodyContent = doc.body.innerHTML;

    return bodyContent;
  } catch (error) {
    console.error("Error loading example file:", error);
    return "<p>Error loading example content</p>";
  }
}

// Function to display example content
function displayExample(content: string) {
  const container = document.getElementById("example-container");
  if (container) {
    container.innerHTML = content;
    attachGrid(container.querySelector(".grid") as HTMLElement);
    // Dispatch a custom event to notify React components that new content has been loaded
    const event = new CustomEvent("exampleContentLoaded", {
      detail: { container },
    });
    document.dispatchEvent(event);
  }
}

// Function to create example list
async function createExampleList() {
  // First, fetch the available example files
  await fetchExampleFiles();

  const listContainer = document.getElementById("example-list");
  if (!listContainer) return;

  // Clear any existing content
  listContainer.innerHTML = "";

  if (exampleFiles.length === 0) {
    const noFilesMessage = document.createElement("div");
    noFilesMessage.className = "no-examples-message";
    noFilesMessage.textContent = "No example files found";
    listContainer.appendChild(noFilesMessage);
    return;
  }

  exampleFiles.forEach((example, index) => {
    const item = document.createElement("div");
    item.className = "example-list-item";
    item.textContent = example.name;
    item.addEventListener("click", async () => {
      // Remove active class from all items
      document.querySelectorAll(".example-list-item").forEach((el) => {
        el.classList.remove("active");
      });

      // Add active class to clicked item
      item.classList.add("active");

      // Update current example file
      currentExampleFile = example.file;
      console.log(`Current example file set to: ${currentExampleFile}`);

      // Load and display the selected example
      const content = await loadExampleContent(example.file);
      displayExample(content);
    });

    listContainer.appendChild(item);

    // Load the first example by default
    if (index === 0) {
      item.classList.add("active");
      // Set the current example file
      currentExampleFile = example.file;
      console.log(`Initial example file set to: ${currentExampleFile}`);

      loadExampleContent(example.file).then((content) => {
        displayExample(content);
      });
    }
  });
}

// Initialize the demo
console.log("Looking for root element...");
const rootElement = document.getElementById("controls-panel");
if (!rootElement) {
  console.error("Could not find root element to mount to");
} else {
  console.log("Found root element:", rootElement);
  console.log("Creating React root...");
  const root = ReactDOM.createRoot(rootElement);
  console.log("Rendering React app...");
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React app rendered");
}

// Create the example list
createExampleList();

// Add Save Button to sidebar
const sidebarElement = document.querySelector(".sidebar");
if (sidebarElement) {
  console.log("Found sidebar element, adding save button");
  const saveButtonContainer = document.createElement("div");
  saveButtonContainer.id = "save-button-container";
  sidebarElement.appendChild(saveButtonContainer);

  const saveButtonRoot = ReactDOM.createRoot(saveButtonContainer);
  saveButtonRoot.render(<SaveButton />);
}

console.log("Demo initialization complete");
