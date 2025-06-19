const mapToken = (t?: string | null): string => {
  t = (t || "").trim();
  if (t === "fit") return "minmax(max-content,max-content)";
  if (t === "fill") return "minmax(0,1fr)";
  return t; // assume %, px, fr, rem, etc.
};

const applyColumns = (grid: HTMLElement): void => {
  const spec = grid.getAttribute("data-column-widths");
  if (!spec) return;
  const template = spec.split(",").map(mapToken).join(" ");
  grid.style.gridTemplateColumns = template;
};

const applyRows = (grid: HTMLElement): void => {
  const spec = grid.getAttribute("data-row-heights");
  if (!spec) return;
  const template = spec.split(",").map(mapToken).join(" ");
  grid.style.gridTemplateRows = template;
};

const applyGrid = (grid: HTMLElement): void => {
  applyColumns(grid);
  applyRows(grid);
};

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
