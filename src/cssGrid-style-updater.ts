// Our html grid model uses CSS Grid layout, but also needs to control the structure of the grid declaratively
// via attributes on the div.grid. I.e, whenever the attributes change, we need to update the CSS style on that element.
// This module observes changes to grid elements and updates their styles accordingly.

// Store observer instances for each grid
const observers = new Map<HTMLElement, MutationObserver>();

/**
 * Attaches a grid observer to a specific grid element
 * @param grid The grid element to observe
 */
export function attach(grid: HTMLElement): void {
  if (observers.has(grid)) {
    // Observer already attached to this grid
    return;
  }

  // Apply initial styles to the grid
  applyGrid(grid);

  // Also apply styles to any existing nested grids
  const nestedGrids = findNestedGrids(grid);
  nestedGrids.forEach((nestedGrid) => {
    applyGrid(nestedGrid);
  });

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
            applyColumns(targetElement);
          } else if (mutation.attributeName === "data-row-heights") {
            applyRows(targetElement);
          }
        }
      } else if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // If a new .grid is added, apply styles to it
            if (node.classList.contains("grid")) {
              applyGrid(node);
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

function mapToken(t?: string | null): string {
  t = (t || "").trim();
  if (t === "fit") return "minmax(max-content,max-content)";
  if (t === "fill") return "minmax(0,1fr)";
  return t; // assume %, px, fr, rem, etc.
}

function applyColumns(grid: HTMLElement): void {
  const spec = grid.getAttribute("data-column-widths");
  if (!spec) return;
  const template = spec.split(",").map(mapToken).join(" ");
  grid.style.gridTemplateColumns = template;
}

function applyRows(grid: HTMLElement): void {
  const spec = grid.getAttribute("data-row-heights");
  if (!spec) return;
  const template = spec.split(",").map(mapToken).join(" ");
  grid.style.gridTemplateRows = template;
}

function applyGrid(grid: HTMLElement): void {
  applyColumns(grid);
  applyRows(grid);
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
