import { describe, it, expect } from "vitest";
import { attachGrid } from "./attach";

// This test loads the demo/table-border.html content and ensures each grid attaches without throwing
// (reproducing the Invalid JSON in data-edges-h error from the console and guarding against regressions).
describe("demo table-border.html", () => {
  it("attaches all demo grids without JSON parse errors", async () => {
    document.body.innerHTML = `<div id="container"></div>`;
    const container = document.getElementById("container")!;

    // 1) 2x2 table with an interior red cross (interior-only arrays)
    const g1 = document.createElement("div");
    g1.className = "grid";
    g1.setAttribute("data-column-widths", "fill,fill");
    g1.setAttribute("data-row-heights", "fill,fill");
  const h1: any[] = [
      // interior rows = rows-1 = 1; but we want no interior H, so leave empty and rely on perimeters null
    ];
  const v1: any[] = [
      // rows=2, interior vertical boundaries per row = cols-1 = 1
      [
        {
          west: { weight: 1, style: "solid", color: "red" },
          east: { weight: 1, style: "solid", color: "red" },
        },
      ],
      [
        {
          west: { weight: 1, style: "solid", color: "red" },
          east: { weight: 1, style: "solid", color: "red" },
        },
      ],
    ];
    g1.setAttribute("data-edges-h", JSON.stringify(h1));
    g1.setAttribute("data-edges-v", JSON.stringify(v1));
    for (let i = 0; i < 4; i++) g1.appendChild(document.createElement("div")).className = "cell";
    container.appendChild(g1);

    // 2) 2x2 table with only an outer black border (full perimeter arrays)
    const g2 = document.createElement("div");
    g2.className = "grid";
    g2.setAttribute("data-column-widths", "fill,fill");
    g2.setAttribute("data-row-heights", "fill,fill");
    const h2 = [
      [
        { weight: 1, style: "solid", color: "#000" },
        { weight: 1, style: "solid", color: "#000" },
      ],
      [null, null],
      [
        { weight: 1, style: "solid", color: "#000" },
        { weight: 1, style: "solid", color: "#000" },
      ],
    ];
    const v2 = [
      [
        { weight: 1, style: "solid", color: "#000" },
        null,
        { weight: 1, style: "solid", color: "#000" },
      ],
      [
        { weight: 1, style: "solid", color: "#000" },
        null,
        { weight: 1, style: "solid", color: "#000" },
      ],
    ];
    g2.setAttribute("data-edges-h", JSON.stringify(h2));
    g2.setAttribute("data-edges-v", JSON.stringify(v2));
    for (let i = 0; i < 4; i++) g2.appendChild(document.createElement("div")).className = "cell";
    container.appendChild(g2);

    // 3) 1x2 table with a single red vertical edge between cells (concise interior V)
    const g3 = document.createElement("div");
    g3.className = "grid";
    g3.setAttribute("data-column-widths", "fill,fill");
    g3.setAttribute("data-row-heights", "fill");
    const h3: any[] = [ [null, null] ]; // r+1=2, c=2
    const v3 = [ [ null, { weight: 1, style: "solid", color: "red" }, null ] ]; // full boundaries
    g3.setAttribute("data-edges-h", JSON.stringify(h3));
    g3.setAttribute("data-edges-v", JSON.stringify(v3));
    for (let i = 0; i < 2; i++) g3.appendChild(document.createElement("div")).className = "cell";
    container.appendChild(g3);

    const grids = Array.from(document.querySelectorAll(".grid")) as HTMLElement[];
    expect(grids.length).toBe(3);
    for (const g of grids) {
      expect(() => attachGrid(g)).not.toThrow();
    }
  });
});
