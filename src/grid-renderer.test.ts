import { describe, it, expect } from "vitest";
import { buildRenderModel, render } from "./grid-renderer";

function makeGrid(): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "grid";
  return grid as HTMLElement;
}

function addCell(grid: HTMLElement, spanX = 1, spanY = 1): HTMLElement {
  const cell = document.createElement("div");
  cell.className = "cell";
  if (spanX !== 1) cell.setAttribute("data-span-x", String(spanX));
  if (spanY !== 1) cell.setAttribute("data-span-y", String(spanY));
  grid.appendChild(cell);
  return cell;
}

describe("grid-renderer", () => {
  it("builds template strings from data attributes", () => {
    const g = makeGrid();
    g.setAttribute("data-column-widths", "hug,100px,fill");
    g.setAttribute("data-row-heights", "20px,hug");
    const m = buildRenderModel(g);
    expect(m.templateColumns).toBe(
      "minmax(60px,max-content) 100px minmax(60px,1fr)"
    );
    expect(m.templateRows).toBe("20px minmax(20px,max-content)");
  });

  it("applies span css variables per cell", () => {
    const g = makeGrid();
    g.setAttribute("data-column-widths", "100px,100px");
    g.setAttribute("data-row-heights", "30px,30px");
    const a = addCell(g, 2, 1);
    const b = addCell(g, 1, 3); // y will clamp later by CSS usage; renderer just writes vars

    render(g, "test");

    expect(g.style.gridTemplateColumns).toBe("100px 100px");
    expect(g.style.gridTemplateRows).toBe("30px 30px");
    expect(a.style.getPropertyValue("--span-x")).toBe("2");
    expect(a.style.getPropertyValue("--span-y")).toBe("1");
    expect(b.style.getPropertyValue("--span-x")).toBe("1");
    expect(b.style.getPropertyValue("--span-y")).toBe("3");
  });

  it("resolves adjacent edge conflicts (heaviest wins)", () => {
    const g = makeGrid();
    g.setAttribute("data-column-widths", "100px,100px");
    g.setAttribute("data-row-heights", "30px");
    const a = addCell(g); // left cell
    const b = addCell(g); // right cell
    a.setAttribute(
      "data-border-right",
      JSON.stringify({ weight: 4, style: "solid", color: "blue" })
    );
    b.setAttribute(
      "data-border-left",
      JSON.stringify({ weight: 2, style: "dotted", color: "red" })
    );

    const m = buildRenderModel(g);
    // winner should be applied to one side only; right cell left suppressed
    expect(m.cellBorders[0].right).toEqual({
      weight: 4,
      style: "solid",
      color: "blue",
    });
    expect(m.cellBorders[1].left).toBeNull();
  });

  it("uses grid inner borders when cells have none", () => {
    const g = makeGrid();
    g.setAttribute("data-column-widths", "100px,100px");
    g.setAttribute("data-row-heights", "30px");
    const a = addCell(g); // left cell
    const b = addCell(g); // right cell
    g.setAttribute(
      "data-border-inner-v",
      JSON.stringify({ weight: 1, style: "solid", color: "#444" })
    );
    a.removeAttribute("data-border-right");
    b.removeAttribute("data-border-left");

    const m = buildRenderModel(g);
    expect(m.cellBorders[0].right).toEqual({
      weight: 1,
      style: "solid",
      color: "#444",
    });
    expect(m.cellBorders[1].left).toBeNull();
  });

  it("perimeter suppresses cell edges and sets grid outline vars", () => {
    const g = makeGrid();
    g.setAttribute("data-column-widths", "100px,100px");
    g.setAttribute("data-row-heights", "30px,30px");
    addCell(g);
    addCell(g);
    addCell(g);
    addCell(g);
    g.setAttribute(
      "data-border-top",
      JSON.stringify({ weight: 3, style: "double", color: "green" })
    );

    const m = buildRenderModel(g);
    // top row cell top edges should be null
    expect(m.cellBorders[0].top).toBeNull();
    expect(m.cellBorders[1].top).toBeNull();

    render(g);
    expect(g.style.getPropertyValue("--grid-border-width")).toBe("3px");
    expect(g.style.getPropertyValue("--grid-border-style")).toBe("double");
    expect(g.style.getPropertyValue("--grid-border-color")).toBe("green");
  });

  it("applies grid corner radius to outermost cells", () => {
    const g = makeGrid();
    g.setAttribute("data-column-widths", "100px,100px");
    g.setAttribute("data-row-heights", "30px,30px");
    const a = addCell(g);
    const b = addCell(g);
    const c = addCell(g);
    const d = addCell(g);
    g.setAttribute("data-corners", JSON.stringify({ radius: 8 }));
    render(g);
    // top-left (a), top-right (b), bottom-left (c), bottom-right (d)
    expect((a.style as any).borderTopLeftRadius).toBe("8px");
    expect((b.style as any).borderTopRightRadius).toBe("8px");
    expect((c.style as any).borderBottomLeftRadius).toBe("8px");
    expect((d.style as any).borderBottomRightRadius).toBe("8px");
  });

  it("suppresses nested grid perimeter when parent has perimeter", () => {
    const g = makeGrid();
    g.setAttribute("data-column-widths", "100px");
    g.setAttribute("data-row-heights", "30px");
    const cell = addCell(g);
    // Parent cell perimeter
    cell.setAttribute(
      "data-border-top",
      JSON.stringify({ weight: 2, style: "solid", color: "black" })
    );
    // Nested grid inside cell
    const nested = document.createElement("div");
    nested.className = "grid";
    nested.setAttribute("data-column-widths", "100px");
    nested.setAttribute("data-row-heights", "30px");
    cell.appendChild(nested);

    render(g);
    expect(nested.style.getPropertyValue("--grid-border-width")).toBe("0");
  });
});
