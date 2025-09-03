import {
  addRow as structAddRow,
  removeLastRow as structRemoveLastRow,
  addColumn as structAddColumn,
  removeLastColumn as structRemoveLastColumn,
  setCellSpan as structSetCellSpan,
  addRowAt as structAddRowAt,
  addColumnAt as structAddColumnAt,
  removeRowAt as structRemoveRowAt,
  removeColumnAt as structRemoveColumnAt,
} from "./structure";
import {
  getColumnWidths,
  setColumnWidths,
  getRowHeights,
  setRowHeights,
  setGridCorners,
  setSpan,
  getSpan,
} from "./grid-model";
import { gridHistoryManager } from "./history";
import { request } from "./render-scheduler";

export class BloomGrid {
  constructor(private grid: HTMLElement) {
    if (!this.grid.classList.contains("grid")) {
      this.grid.classList.add("grid");
    }
  }

  // Structure ops (already history-wrapped in structure.ts)
  addRow(): void {
    structAddRow(this.grid);
    this.schedule("addRow");
  }

  removeLastRow(): void {
    structRemoveLastRow(this.grid);
    this.schedule("removeLastRow");
  }

  addColumn(): void {
    structAddColumn(this.grid);
    this.schedule("addColumn");
  }

  removeLastColumn(): void {
    structRemoveLastColumn(this.grid);
    this.schedule("removeLastColumn");
  }

  // Positioned structure ops
  addRowAt(index: number): void {
    structAddRowAt(this.grid, index);
    this.schedule("addRowAt");
  }

  addColumnAt(index: number): void {
    structAddColumnAt(this.grid, index);
    this.schedule("addColumnAt");
  }

  removeRowAt(index: number): void {
    structRemoveRowAt(this.grid, index);
    this.schedule("removeRowAt");
  }

  removeColumnAt(index: number): void {
    structRemoveColumnAt(this.grid, index);
    this.schedule("removeColumnAt");
  }

  // Column/Row sizing with history integration
  setColumnWidth(index: number, value: string): void {
    const perform = () => {
      const widths = getColumnWidths(this.grid);
      if (index < 0 || index >= widths.length) return;
      widths[index] = value;
      setColumnWidths(this.grid, widths);
    };
    gridHistoryManager.addHistoryEntry(
      this.grid,
      `Set Column ${index} Width`,
      perform
    );
    this.schedule("setColumnWidth");
  }

  setRowHeight(index: number, value: string): void {
    const perform = () => {
      const heights = getRowHeights(this.grid);
      if (index < 0 || index >= heights.length) return;
      heights[index] = value;
      setRowHeights(this.grid, heights);
    };
    gridHistoryManager.addHistoryEntry(
      this.grid,
      `Set Row ${index} Height`,
      perform
    );
    this.schedule("setRowHeight");
  }

  // Getters to read current specs for UI
  getRowHeight(index: number): string | null {
    const heights = getRowHeights(this.grid);
    return index >= 0 && index < heights.length ? heights[index] : null;
  }

  getColumnWidth(index: number): string | null {
    const widths = getColumnWidths(this.grid);
    return index >= 0 && index < widths.length ? widths[index] : null;
  }

  getSpan(cell: HTMLElement): { x: number; y: number } {
    return getSpan(cell);
  }

  // Borders are modeled via unified edge arrays; callers should use grid-model setEdgesH/V helpers directly.

  setGridCorners(radiusPx: number): void {
    const perform = () => setGridCorners(this.grid, { radius: radiusPx });
    gridHistoryManager.addHistoryEntry(this.grid, "Set Grid Corners", perform);
    this.schedule("setGridCorners");
  }

  // Spans: write data-*, and call structure's setCellSpan to maintain skip semantics today
  setSpan(cell: HTMLElement, x: number, y: number): void {
    const perform = () => {
      setSpan(cell, { x, y });
      // maintain skip coverage using existing structure helper (also sets CSS vars for now)
      structSetCellSpan(cell, x, y);
    };
    gridHistoryManager.addHistoryEntry(
      this.grid,
      `Set Cell Span ${x}x${y}`,
      perform
    );
    this.schedule("setSpan");
  }

  private schedule(reason: string) {
    request(this.grid, reason);
  }
}

export default BloomGrid;
