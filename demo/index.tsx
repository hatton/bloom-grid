import React, { useState } from "react";
import Header from "./components/Header";
import ExampleBar, { Example } from "./components/ExampleBar";
import MainContent from "./components/MainContent";
import Toolbar from "./Toolbar";
import ReactDOM from "react-dom/client";

const Demo: React.FC = () => {
  const [exampleHtmlContent, setExampleHtmlContent] = useState<string>("");
  const [examplePngPath, setExamplePngPath] = useState<string | undefined>();

  // Function to load and parse HTML content
  const loadExampleContent = async (
    group: "exercises" | "tests",
    filename: string
  ): Promise<string> => {
    try {
      const response = await fetch(`./${group}/${filename}`);
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
    console.log(
      `Loading example: ${example.name} (${example.group}/${example.htmlFile})`
    );
    const exampleHtml = await loadExampleContent(
      example.group,
      example.htmlFile
    );
    setExampleHtmlContent(exampleHtml);
    setExamplePngPath(example.pngPath);
  };

  return (
    <div className="demo-layout">
      <Header />
      <ExampleBar onExampleSelect={handleExampleSelect} />

      <div className="sample-image">
        {examplePngPath && (
          <>
            <h3 className="text-lg font-semibold text-white mb-2">
              Try to match the essence of this example
            </h3>
            <img src={examplePngPath} alt="Example" />
          </>
        )}
      </div>

      <MainContent exampleContent={exampleHtmlContent} />
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
