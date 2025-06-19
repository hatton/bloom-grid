console.log("Script starting to load...");

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

console.log("React, ReactDOM, and App imported successfully");

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
