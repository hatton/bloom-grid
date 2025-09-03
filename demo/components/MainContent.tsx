import React, { useEffect, useRef } from "react";
import { attachGridsAfterContentLoad } from "../utils/gridAttachment";

interface MainContentProps {
  exampleContent: string;
}

const MainContent: React.FC<MainContentProps> = ({ exampleContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && exampleContent) {
      containerRef.current.innerHTML = exampleContent;
      attachGridsAfterContentLoad(containerRef.current);
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
