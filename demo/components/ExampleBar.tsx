import React, { useState, useEffect } from "react";
import ExampleListItem from "./ExampleListItem";
import SaveButton from "./SaveButton";

export interface Example {
  name: string;
  htmlFile: string;
  pngFile?: string; // Optional PNG file for the example
}

interface ExampleBarProps {
  onExampleSelect: (example: Example) => void;
}

const ExampleBar: React.FC<ExampleBarProps> = ({ onExampleSelect }) => {
  const [exampleFiles, setExampleFiles] = useState<Example[]>([]);
  const [activeExample, setActiveExample] = useState<string>("");
  const LOCAL_STORAGE_KEY = "bloom-grid.activeExampleHtml";

  // Function to fetch available example files from the API
  const fetchExampleFiles = async (): Promise<void> => {
    try {
      const response = await fetch("/api/examples");
      if (response.ok) {
        const files: Example[] = await response.json();
        setExampleFiles(files);
        // Choose saved example if available, otherwise fallback to first
        if (files.length > 0) {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          const selected = saved
            ? files.find((f) => f.htmlFile === saved) || files[0]
            : files[0];
          setActiveExample(selected.htmlFile);
          onExampleSelect(selected);
        } else {
          setActiveExample("");
        }
      } else {
        console.error(
          "Failed to fetch example files from API, status:",
          response.status
        );
        setExampleFiles([]);
      }
    } catch (error) {
      console.error("Error fetching example files:", error);
      setExampleFiles([]);
    }
  };

  useEffect(() => {
    fetchExampleFiles();
  }, []);

  const handleExampleSelect = (example: Example) => {
    setActiveExample(example.htmlFile);
    // persist selection
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, example.htmlFile);
    } catch (e) {
      // ignore storage errors (e.g., privacy mode)
    }
    onExampleSelect(example);
  };

  return (
    <div className="sidebar">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Examples</h2>
      <div id="example-list">
        {exampleFiles.length === 0 ? (
          <div className="no-examples-message">No example files found</div>
        ) : (
          exampleFiles.map((example) => (
            <ExampleListItem
              key={example.htmlFile}
              example={example}
              isActive={activeExample === example.htmlFile}
              onSelect={() => handleExampleSelect(example)}
            />
          ))
        )}
      </div>
      <SaveButton currentExampleFile={activeExample} />
    </div>
  );
};

export default ExampleBar;
