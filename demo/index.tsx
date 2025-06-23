console.log("Script starting to load...");

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { attachGrid } from "../src";

console.log("React, ReactDOM, and App imported successfully");

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

      // Load and display the selected example
      const content = await loadExampleContent(example.file);
      displayExample(content);
    });

    listContainer.appendChild(item);

    // Load the first example by default
    if (index === 0) {
      item.classList.add("active");
      loadExampleContent(example.file).then((content) => {
        displayExample(content);
      });
    }
  });
}

// Initialize the demo
console.log("Looking for root element...");
const rootElement = document.getElementById("controls-root");
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

console.log("Demo initialization complete");
