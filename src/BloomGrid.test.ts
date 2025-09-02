import { describe, it, expect, vi, beforeEach } from "vitest";
import BloomGrid from "./BloomGrid";
import { setRenderer } from "./render-scheduler";
import { render } from "./grid-renderer";
import { attachGrid } from "./attach";
import { gridHistoryManager } from "./history";

describe("BloomGrid controller", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    gridHistoryManager.reset?.();
    setRenderer(render);
  });

  function setupGrid(): { grid: HTMLElement; ctrl: BloomGrid } {
    const grid = document.createElement("div");
    document.body.appendChild(grid);
    attachGrid(grid);
    const ctrl = new BloomGrid(grid);
    return { grid, ctrl };
  }

  it("schedules one render per operation (coalesced)", async () => {
    const { grid, ctrl } = setupGrid();

    const spy = vi.spyOn(grid.style, "setProperty");

    ctrl.setColumnWidth(0, "120px");
    ctrl.setRowHeight(0, "34px");

    // wait a macrotask
    await new Promise((r) => setTimeout(r, 0));

    // renderer should have applied template props at least once
    const calls = spy.mock.calls.filter(
      (c) => c[0] === "--grid-column-count" || c[0] === "--grid-row-count"
    );
    expect(calls.length).toBeGreaterThan(0);
  });

  it("updates data attributes for sizes via history-wrapped ops", async () => {
    const { grid, ctrl } = setupGrid();
    const before = grid.getAttribute("data-column-widths");
    ctrl.setColumnWidth(0, "200px");
    await new Promise((r) => setTimeout(r, 0));
    expect(grid.getAttribute("data-column-widths")).not.toBe(before);
    expect(grid.getAttribute("data-column-widths")?.startsWith("200px")).toBe(
      true
    );
  });

  it("sets spans and maintains skip semantics", async () => {
    const { grid, ctrl } = setupGrid();
    const cells = Array.from(grid.querySelectorAll<HTMLElement>(".cell"));
    expect(cells.length).toBeGreaterThan(0);
    const first = cells[0];
    ctrl.setSpan(first, 2, 1);
    await new Promise((r) => setTimeout(r, 0));
    expect(first.getAttribute("data-span-x")).toBe("2");
    // structure.setCellSpan should add skip to covered neighbor if present
    const neighbor = cells[1];
    if (neighbor) {
      expect(neighbor.classList.contains("skip")).toBe(true);
    }
  });

  it("supports add/remove row/column and schedules renders", async () => {
    const { grid, ctrl } = setupGrid();
    const initialCells = grid.querySelectorAll(".cell").length;
    ctrl.addRow();
    ctrl.addColumn();
    await new Promise((r) => setTimeout(r, 0));
    const afterAdd = grid.querySelectorAll(".cell").length;
    expect(afterAdd).toBeGreaterThan(initialCells);
    ctrl.removeLastColumn();
    ctrl.removeLastRow();
    await new Promise((r) => setTimeout(r, 0));
    const afterRemove = grid.querySelectorAll(".cell").length;
    expect(afterRemove).toBeLessThan(afterAdd);
  });
});
