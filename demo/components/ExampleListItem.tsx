import React from "react";

interface ExampleListItemProps {
  example: { name: string; file: string };
  isActive: boolean;
  onSelect: () => void;
}

const ExampleListItem: React.FC<ExampleListItemProps> = ({
  example,
  isActive,
  onSelect,
}) => {
  return (
    <div
      className={`example-list-item ${isActive ? "active" : ""}`}
      onClick={onSelect}
    >
      {example.name}
    </div>
  );
};

export default ExampleListItem;
