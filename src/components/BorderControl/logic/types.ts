export type EdgeKey = "top" | "right" | "bottom" | "left" | "innerH" | "innerV";

export type BorderWeight = 0 | 1 | 2 | 4;
export type BorderStyle = "none" | "solid" | "dashed" | "dotted" | "double";
export type CornerRadius = 0 | 2 | 4 | 8 | 16;

export interface EdgeValue {
  weight: BorderWeight;
  style: BorderStyle;
  radius: CornerRadius;
}

export type BorderValueMap = Record<EdgeKey, EdgeValue>;

// Selected edges stored as a Set for internal logic but frequently serialized to array/record
export type SelectedEdges = Set<EdgeKey>;

export type BorderMenuValue = BorderWeight | BorderStyle | CornerRadius;

// Visual look options for the BorderSelector widget (static, no animations)
export type SelectorLook =
  | "flat" // current simple solid bars
  | "gradients" // directional linear gradients for a raised look
  | "bevel" // thin highlight/shadow lines to fake a bevel
  | "rounded" // rounded corners on bars
  | "card"; // background card + gradients

export type PartialEdgeUpdate = {
  edges: EdgeKey[];
  change: Partial<Pick<EdgeValue, "weight" | "style" | "radius">>;
};

export const OuterEdges: EdgeKey[] = ["top", "right", "bottom", "left"];
export const InnerEdges: EdgeKey[] = ["innerH", "innerV"];
