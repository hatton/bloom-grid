import { describe, it, expect, vi } from "vitest";
import { request, setRenderer, cancel } from "./render-scheduler";

function makeGrid(): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "grid";
  return grid as HTMLElement;
}

describe("render-scheduler", () => {
  it("coalesces multiple requests per grid", async () => {
    const g = makeGrid();
    const spy = vi.fn();
    setRenderer(spy);

    request(g, "a");
    request(g, "b");
    request(g, "c");

    // allow macrotask to run
    await new Promise((r) => setTimeout(r, 1));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toBeDefined();
  });

  it("runs immediately in immediate mode", () => {
    const g = makeGrid();
    const spy = vi.fn();
    setRenderer(spy);

    request(g, "now", { immediate: true });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("can cancel pending tasks", async () => {
    const g = makeGrid();
    const spy = vi.fn();
    setRenderer(spy);

    request(g, "later");
    cancel(g);
    await new Promise((r) => setTimeout(r, 1));
    expect(spy).not.toHaveBeenCalled();
  });
});
