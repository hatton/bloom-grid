import { describe, it, expect, beforeEach } from "vitest";
import { attach } from "./cssGrid-style-updater";

describe("Nested Grid Support", () => {
  beforeEach(() => {
    // Clean up DOM before each test
    document.body.innerHTML = "";
  });

  it("should process nested grids when main grid is attached", () => {
    // Create a main grid with nested grids
    const mainGrid = document.createElement("div");
    mainGrid.className = "grid";
    mainGrid.setAttribute("data-column-widths", "100px,200px");
    mainGrid.setAttribute("data-row-heights", "50px,60px");

    // Create a cell with a nested grid
    const cell = document.createElement("div");
    cell.className = "cell";

    const nestedGrid = document.createElement("div");
    nestedGrid.className = "grid";
    nestedGrid.setAttribute("data-column-widths", "80px,120px");
    nestedGrid.setAttribute("data-row-heights", "30px,40px");

    // Create a nested cell with another nested grid
    const nestedCell = document.createElement("div");
    nestedCell.className = "cell";

    const deepNestedGrid = document.createElement("div");
    deepNestedGrid.className = "grid";
    deepNestedGrid.setAttribute("data-column-widths", "60px,90px");
    deepNestedGrid.setAttribute("data-row-heights", "25px,35px");

    // Assemble the structure
    nestedCell.appendChild(deepNestedGrid);
    nestedGrid.appendChild(nestedCell);
    cell.appendChild(nestedGrid);
    mainGrid.appendChild(cell);
    document.body.appendChild(mainGrid);

    // Before attaching, nested grids should not have any styles applied
    expect(nestedGrid.style.cssText).toBe("");
    expect(deepNestedGrid.style.cssText).toBe("");

    // Attach the main grid - this should process nested grids too
    attach(mainGrid);

    // After attaching, all grids should have been processed (have style attributes)
    expect(mainGrid.style.cssText).not.toBe("");
    expect(nestedGrid.style.cssText).not.toBe("");
    expect(deepNestedGrid.style.cssText).not.toBe("");
  });
  it("should process nested grids with different data attributes", () => {
    const mainGrid = document.createElement("div");
    mainGrid.className = "grid";
    mainGrid.setAttribute("data-column-widths", "fit,fill");
    mainGrid.setAttribute("data-row-heights", "fit,fill");

    const cell = document.createElement("div");
    cell.className = "cell";

    const nestedGrid = document.createElement("div");
    nestedGrid.className = "grid";
    nestedGrid.setAttribute("data-column-widths", "fill,fit,100px");
    nestedGrid.setAttribute("data-row-heights", "fit,50px");

    cell.appendChild(nestedGrid);
    mainGrid.appendChild(cell);
    document.body.appendChild(mainGrid);

    // Before attaching, no styles should be applied
    expect(nestedGrid.style.cssText).toBe("");

    attach(mainGrid);

    // After attaching, both grids should have been processed
    expect(mainGrid.style.cssText).not.toBe("");
    expect(nestedGrid.style.cssText).not.toBe("");
  });

  it("should not process grids without data attributes", () => {
    const mainGrid = document.createElement("div");
    mainGrid.className = "grid";
    // No data attributes set

    const cell = document.createElement("div");
    cell.className = "cell";

    const nestedGrid = document.createElement("div");
    nestedGrid.className = "grid";
    // No data attributes set

    cell.appendChild(nestedGrid);
    mainGrid.appendChild(cell);
    document.body.appendChild(mainGrid);

    attach(mainGrid);

    // Neither grid should have styles applied since they have no data attributes
    expect(mainGrid.style.cssText).toBe("");
    expect(nestedGrid.style.cssText).toBe("");
  });

  it("should handle style updates when data attributes change", () => {
    const mainGrid = document.createElement("div");
    mainGrid.className = "grid";
    mainGrid.setAttribute("data-column-widths", "100px,200px");

    const nestedGrid = document.createElement("div");
    nestedGrid.className = "grid";
    nestedGrid.setAttribute("data-column-widths", "50px,150px");

    mainGrid.appendChild(nestedGrid);
    document.body.appendChild(mainGrid);

    attach(mainGrid);

    // Both should have initial styles
    const initialMainStyles = mainGrid.style.cssText;
    const initialNestedStyles = nestedGrid.style.cssText;
    expect(initialMainStyles).not.toBe("");
    expect(initialNestedStyles).not.toBe("");

    // Update data attributes
    mainGrid.setAttribute("data-column-widths", "150px,250px");
    nestedGrid.setAttribute("data-column-widths", "75px,175px");

    // Trigger a small delay to allow observer to process changes
    setTimeout(() => {
      // Styles should have been updated (cssText should be different)
      expect(mainGrid.style.cssText).not.toBe(initialMainStyles);
      expect(nestedGrid.style.cssText).not.toBe(initialNestedStyles);
    }, 10);
  });
});
