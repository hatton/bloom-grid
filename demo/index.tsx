import React, { useState } from "react";
import Header from "./components/Header";
import ExampleBar from "./components/ExampleBar";
import MainContent from "./components/MainContent";
import Toolbar from "./Toolbar";
import ReactDOM from "react-dom/client";

interface Example {
  name: string;
  file: string;
}

const Demo: React.FC = () => {
  const [exampleContent, setExampleContent] = useState<string>("");

  // Function to load and parse HTML content
  const loadExampleContent = async (filename: string): Promise<string> => {
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
  };

  const handleExampleSelect = async (example: Example) => {
    console.log(`Loading example: ${example.name} (${example.file})`);
    const content = await loadExampleContent(example.file);
    setExampleContent(content);
  };

  return (
    <div className="demo-layout">
      <Header />
      <ExampleBar onExampleSelect={handleExampleSelect} />
      <MainContent exampleContent={exampleContent} />
      <div id="controls-panel">
        <Toolbar />
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>
);
