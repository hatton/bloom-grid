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

const initGridObserver = (): void => {
  // Apply initial styles to all grids present on the page
  document.querySelectorAll<HTMLElement>(".grid").forEach(applyGrid);

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

  observer.observe(document.body, {
    childList: true, // Observe direct children additions/removals
    subtree: true, // Observe all descendants
    attributes: true, // Observe attribute changes
    attributeFilter: ["data-column-widths", "data-row-heights"], // Only specific attributes
  });
};

// Initialize the observer script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGridObserver);
} else {
  initGridObserver();
}
