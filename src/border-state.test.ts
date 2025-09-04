import { describe, it, expect } from "vitest";
import { getGridOuterBorderValueMap } from "./border-state";

function makeGrid(cols = 2, rows = 2): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "grid";
  grid.setAttribute("data-column-widths", Array(cols).fill("hug").join(","));
  grid.setAttribute("data-row-heights", Array(rows).fill("hug").join(","));
  // Create cells (DOM order by rows x cols)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      grid.appendChild(cell);
    }
  }
  document.body.appendChild(grid);
  return grid;
}

describe("border-state:getGridOuterBorderValueMap", () => {
  it("derives 1px solid from CSS default vars when no edges are specified", () => {
    const g = makeGrid(2, 2);
    // Provide defaults via CSS custom properties inline (jsdom-friendly)
    g.style.setProperty("--edge-default-weight", "1");
    g.style.setProperty("--edge-default-style", "solid");
    g.style.setProperty("--edge-default-color", "#000");

    const map = getGridOuterBorderValueMap(g);
    expect(map.top.weight).toBe(1);
    expect(map.top.style).toBe("solid");
    expect(map.right.weight).toBe(1);
    expect(map.right.style).toBe("solid");
    expect(map.bottom.weight).toBe(1);
    expect(map.bottom.style).toBe("solid");
    expect(map.left.weight).toBe(1);
    expect(map.left.style).toBe("solid");
  });

  it("prefers data-border-default over CSS vars for unspecified perimeters", () => {
    const g = makeGrid(2, 2);
    // Global-ish vars that would be ignored when data-border-default is present
    g.style.setProperty("--edge-default-weight", "1");
    g.style.setProperty("--edge-default-style", "solid");
    g.style.setProperty("--edge-default-color", "#000");
    g.setAttribute(
      "data-border-default",
      JSON.stringify({ weight: 2, style: "dashed", color: "red" })
    );

    const map = getGridOuterBorderValueMap(g);
    expect(map.top.weight).toBe(2);
    expect(map.top.style).toBe("dashed");
    expect(map.left.weight).toBe(2);
    expect(map.left.style).toBe("dashed");
  });
});
