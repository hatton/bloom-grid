// Our html grid model uses CSS Grid layout, but also needs to control the structure of the grid declaratively
// via attributes on the div.grid. I.e, whenever the attributes change, we need to update the CSS style on that element.
// This module observes changes to grid elements and updates their styles accordingly.

// Store observer instances for each grid
const observers = new Map<HTMLElement, MutationObserver>();
const minColumnWidth = "60px"; // Minimum width for a column
/**
 * Attaches a grid observer to a specific grid element
 * @param grid The grid element to observe
 */
export function attach(grid: HTMLElement): void {
  // Apply initial styles to the grid
  updateStyleRulesForGrid(grid);

  // Also apply styles to any existing nested grids
  const nestedGrids = findNestedGrids(grid);
  nestedGrids.forEach((nestedGrid) => {
    updateStyleRulesForGrid(nestedGrid);
  });

  if (observers.has(grid)) {
    // Observer already attached to this grid
    return;
  }

  // Create a new observer for this grid
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "attributes") {
        const targetElement = mutation.target;
        if (
          targetElement instanceof HTMLElement &&
          targetElement.classList.contains("grid")
        ) {
          if (mutation.attributeName === "data-column-widths") {
            updateStyleRulesForColumns(targetElement);
          } else if (mutation.attributeName === "data-row-heights") {
            updateStyleRulesForRows(targetElement);
          }
        }
      } else if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // If a new .grid is added, apply styles to it
            if (node.classList.contains("grid")) {
              updateStyleRulesForGrid(node);
            }
          }
        });
      }
    });
  });

  // Observe the grid and its children
  observer.observe(grid, {
    childList: true, // Observe direct children additions/removals
    subtree: true, // Observe all descendants
    attributes: true, // Observe attribute changes
    attributeFilter: ["data-column-widths", "data-row-heights"], // Only specific attributes
  });

  // Store the observer
  observers.set(grid, observer);
}

/**
 * Detaches the grid observer from a specific grid element
 * @param grid The grid element to stop observing
 */
export function detach(grid: HTMLElement): void {
  const observer = observers.get(grid);
  if (observer) {
    observer.disconnect();
    observers.delete(grid);
  }
}

function makeGridRule(size: string, minimum: string): string {
  size = (size || "").trim();
  if (size === "hug") return `minmax(${minimum},max-content)`;
  if (size === "fill") return `minmax(${minColumnWidth},1fr)`;
  return size;
}

function updateStyleRulesForColumns(grid: HTMLElement): void {
  const spec = grid.getAttribute("data-column-widths");
  if (!spec) return;
  const columns = spec.split(",");
  const template = columns
    .map((x) => makeGridRule(x, minColumnWidth))
    .join(" ");
  grid.style.gridTemplateColumns = template;
  grid.style.setProperty("--grid-column-count", columns.length.toString());
}

function updateStyleRulesForRows(grid: HTMLElement): void {
  const spec = grid.getAttribute("data-row-heights");
  if (!spec) return;
  const rows = spec.split(",");
  const minRowHeight = "20px"; // Minimum height for a row
  const template = rows.map((x) => makeGridRule(x, minRowHeight)).join(" ");
  console.info("updateStyleRulesForRows template = ", JSON.stringify(template));
  grid.style.gridTemplateRows = template;
  console.info(
    "updateStyleRulesForRows gridTemplateRows = " +
      JSON.stringify(grid.style.gridTemplateRows, null, 2)
  );
  console.info("updateStyleRulesForRows style" + grid.style);
  // Set the custom property for row count
  grid.style.setProperty("--grid-row-count", rows.length.toString());
}

function updateStyleRulesForGrid(grid: HTMLElement): void {
  updateStyleRulesForColumns(grid);
  updateStyleRulesForRows(grid);
}

/**
 * Finds all nested grids within a given grid element, recursively
 * @param grid The grid element to search within
 * @returns Array of all nested grid elements found
 */
function findNestedGrids(grid: HTMLElement): HTMLElement[] {
  const nestedGrids: HTMLElement[] = [];

  // Find all .grid elements that are descendants of this grid
  const allGrids = grid.querySelectorAll<HTMLElement>(".grid");

  // Add them to our list
  allGrids.forEach((nestedGrid) => {
    nestedGrids.push(nestedGrid);
  });

  return nestedGrids;
}
