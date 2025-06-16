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
  const rows = Array.from(grid.children).filter(
    (e): e is HTMLElement =>
      e instanceof HTMLElement && e.classList.contains("row")
  );
  if (rows.length === 0) return;
  const template = rows
    .map((r) => mapToken(r.getAttribute("data-row-height") || "fit"))
    .join(" ");
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
        if (targetElement instanceof HTMLElement) {
          if (mutation.attributeName === "data-column-widths") {
            applyColumns(targetElement);
          } else if (
            mutation.attributeName === "data-row-height" &&
            targetElement.classList.contains("row")
          ) {
            // If data-row-height changes on a .row, update its parent .grid
            const grid =
              targetElement.parentElement?.closest<HTMLElement>(".grid");
            if (grid) {
              applyRows(grid);
            }
          }
        }
      } else if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // If a new .grid is added, apply styles to it
            if (node.classList.contains("grid")) {
              applyGrid(node);
            }
            // If a new .row is added, update its parent .grid
            else if (node.classList.contains("row")) {
              const grid = node.parentElement?.closest<HTMLElement>(".grid");
              if (grid) {
                applyRows(grid);
              }
            }
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // If a .row is removed, update its parent .grid
            if (node.classList.contains("row")) {
              // mutation.target is the parent from which the node was removed
              const parentOfRemovedNode = mutation.target;
              if (parentOfRemovedNode instanceof HTMLElement) {
                const grid = parentOfRemovedNode.closest<HTMLElement>(".grid");
                if (grid) {
                  applyRows(grid);
                }
              }
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
    attributeFilter: ["data-column-widths", "data-row-height"], // Only specific attributes
  });
};

// Initialize the observer script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGridObserver);
} else {
  initGridObserver();
}
