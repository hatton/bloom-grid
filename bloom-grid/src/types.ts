// src/types.ts

// Basic types
export type CellType = 'Text' | 'Image' | 'Button' | 'Video' | 'Grid';
export type BorderStyle = 'None' | 'Outline' | 'All';
export type BorderColor = 'Black' | 'Grey' | 'None';

// Sizing modes
export type WidthMode = 'Auto' | 'Manual'; // Manual is percentage
export type HeightMode = 'Auto' | 'Manual'; // Manual is pixels

// Data model interfaces
export interface CellData {
  id: string;
  type: CellType;
  content: string; // For Text/Button type, or placeholder text
  borderOverride?: {
    style: 'Inherit' | 'None' | 'Solid';
    color: 'Black' | 'Grey';
  };
  nestedGridState?: GridState; // For 'Grid' type cells
}

export interface ColumnData {
  id: string;
  widthMode: WidthMode;
  width?: number; // Percentage value if manual
}

export interface RowData {
  id: string;
  heightMode: HeightMode;
  height?: number; // Pixel value if manual
  cells: CellData[];
}

export interface GridState {
  columns: ColumnData[];
  rows: RowData[];
  borderStyle: BorderStyle;
  borderColor: BorderColor;
}
