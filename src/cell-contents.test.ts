import { describe, it, expect } from "vitest";
import { setupContentsOfCell } from "./cell-contents";

describe("setupContentsOfCell", () => {
  let cell: HTMLElement;

  it("should set up text content by default", () => {
    cell = document.createElement("div");
    setupContentsOfCell(cell);
    expect(cell.innerHTML).toBe(`<div contenteditable="true"></div>`);
    expect(cell.dataset.contentType).toBe("text");
  });

  it("should change content type when specified", () => {
    cell = document.createElement("div");
    setupContentsOfCell(cell, "grid");
    expect(cell.innerHTML).toContain(`grid`);
    expect(cell.dataset.contentType).toBe("grid");
  });

  it("should not change content if type is the same", () => {
    cell = document.createElement("div");
    const textDiv = setupContentsOfCell(cell, "text");
    textDiv!.innerHTML = "hello world";
    const unchangedDiv = setupContentsOfCell(cell, "text");
    expect(unchangedDiv!.innerHTML).toBe("hello world");
  });

  it("if target is not specified and the cell is empty, it should set up with default content type", () => {
    cell = document.createElement("div");
    const contentDiv = setupContentsOfCell(cell);
    expect(contentDiv?.outerHTML).toContain(`contenteditable="true"`);
    expect(cell.dataset.contentType).toBe("text");
  });

  // TODO there are many more cases to cover
});
