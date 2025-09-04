import { buildRenderModel } from "./grid-renderer";
import { EDGE_DEFAULT } from "./defaults";
import type {
  BorderStyle,
  BorderValueMap,
  BorderWeight,
} from "./components/BorderControl/logic/types";

const snapWeight = (w: number): BorderWeight => {
  if (w <= 0) return 0;
  if (w < 1.5) return 1;
  if (w < 3) return 2;
  return 4;
};

export function getGridOuterBorderValueMap(grid: HTMLElement): BorderValueMap {
  const model = buildRenderModel(grid);
  const rows = model.rowHeights.length;
  const cols = model.columnWidths.length;

  const idx = (r: number, c: number) => r * Math.max(1, cols) + c;
  const safe = <T>(v: T | undefined | null, d: T): T => (v == null ? d : v);

  const topLeft = model.cellBorders[idx(0, 0)] || {};
  const topRight = model.cellBorders[idx(0, Math.max(0, cols - 1))] || {};
  const bottomLeft = model.cellBorders[idx(Math.max(0, rows - 1), 0)] || {};

  const toOuter = (spec: any): { weight: BorderWeight; style: BorderStyle } => {
    const w = snapWeight(Number.isFinite(spec?.weight) ? spec.weight : 0);
    let style: BorderStyle;
    if (w === 0) {
      style = "none";
    } else if (spec?.style) {
      style = spec.style as BorderStyle;
    } else {
      // Last resort: use TS default style to avoid inventing a third source here
      style = EDGE_DEFAULT.style as BorderStyle;
    }
    return { weight: w, style };
  };

  // Derive representative inner edges from the render model (zero-gap case assigns to one side):
  // - innerH: sample bottom of the top-left cell if there is at least 2 rows
  // - innerV: sample right of the top-left cell if there is at least 2 cols
  const sampleInnerH = () => {
    if (rows >= 2 && cols >= 1) {
      const spec = (model.cellBorders[idx(0, 0)] || {}).bottom as any;
      if (spec) return spec;
    }
    return { weight: EDGE_DEFAULT.weight, style: EDGE_DEFAULT.style } as any;
  };
  const sampleInnerV = () => {
    if (cols >= 2 && rows >= 1) {
      const spec = (model.cellBorders[idx(0, 0)] || {}).right as any;
      if (spec) return spec;
    }
    return { weight: EDGE_DEFAULT.weight, style: EDGE_DEFAULT.style } as any;
  };

  return {
    top: { ...toOuter(safe(topLeft.top, null)), radius: 0 },
    right: { ...toOuter(safe(topRight.right, null)), radius: 0 },
    bottom: { ...toOuter(safe(bottomLeft.bottom, null)), radius: 0 },
    left: { ...toOuter(safe(topLeft.left, null)), radius: 0 },
    innerH: { ...toOuter(sampleInnerH()), radius: 0 },
    innerV: { ...toOuter(sampleInnerV()), radius: 0 },
  };
}
