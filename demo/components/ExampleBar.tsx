import React, { useState, useEffect } from "react";
import ExampleListItem from "./ExampleListItem";
import SaveButton from "./SaveButton";

interface Example {
  name: string;
  file: string;
}

interface ExampleBarProps {
  onExampleSelect: (example: Example) => void;
}

const ExampleBar: React.FC<ExampleBarProps> = ({ onExampleSelect }) => {
  const [exampleFiles, setExampleFiles] = useState<Example[]>([]);
  const [activeExample, setActiveExample] = useState<string>("");

  // Function to fetch available example files from the API
  const fetchExampleFiles = async (): Promise<void> => {
    try {
      const response = await fetch("/api/examples");
      if (response.ok) {
        const files = await response.json();
        setExampleFiles(files);

        // Set the first example as active by default
        if (files.length > 0) {
          setActiveExample(files[0].file);
          onExampleSelect(files[0]);
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
    setActiveExample(example.file);
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
              key={example.file}
              example={example}
              isActive={activeExample === example.file}
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
