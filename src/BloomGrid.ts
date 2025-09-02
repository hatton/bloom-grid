import {
  addRow as structAddRow,
  removeLastRow as structRemoveLastRow,
  addColumn as structAddColumn,
  removeLastColumn as structRemoveLastColumn,
  setCellSpan as structSetCellSpan,
} from "./structure";
import {
  getColumnWidths,
  setColumnWidths,
  getRowHeights,
  setRowHeights,
  setGridBorder,
  setCellBorder,
  setGridCorners,
  setSpan,
  type BorderSpec,
  type GridBorderSide,
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

  // Borders & corners (model-level attributes)
  setGridBorder(side: GridBorderSide, border: BorderSpec | null): void {
    const perform = () => setGridBorder(this.grid, side, border);
    gridHistoryManager.addHistoryEntry(
      this.grid,
      `Set Grid Border ${side}`,
      perform
    );
    this.schedule("setGridBorder");
  }

  setCellBorder(
    cell: HTMLElement,
    side: "top" | "right" | "bottom" | "left",
    border: BorderSpec | null
  ): void {
    const perform = () => setCellBorder(cell, side, border);
    gridHistoryManager.addHistoryEntry(
      this.grid,
      `Set Cell Border ${side}`,
      perform
    );
    this.schedule("setCellBorder");
  }

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
