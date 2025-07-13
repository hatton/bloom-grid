import React, { useEffect, useRef } from "react";
import { attachGrid } from "../../src";

interface MainContentProps {
  exampleContent: string;
}

const MainContent: React.FC<MainContentProps> = ({ exampleContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && exampleContent) {
      containerRef.current.innerHTML = exampleContent;
      const gridElement = containerRef.current.querySelector(
        ".grid"
      ) as HTMLElement;
      if (gridElement) {
        attachGrid(gridElement);
      }

      // Dispatch a custom event to notify React components that new content has been loaded
      const event = new CustomEvent("exampleContentLoaded", {
        detail: { container: containerRef.current },
      });
      document.dispatchEvent(event);
    }
  }, [exampleContent]);

  return (
    <div className="main-content">
      <div id="example-container" ref={containerRef}>
        {/* Content will be loaded here */}
      </div>
    </div>
  );
};

export default MainContent;
