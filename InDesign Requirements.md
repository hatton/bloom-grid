# Scope

This is an LLM-generated set of requirements for InDesign-class appearance for tables: cell spanning, edge strokes (with conflict rules), fills (solid/gradient, alternation), opacity/blend, and export fidelity. No content/UX/header/footer features here.

## Non-Requirements / Out of Scope

- Diagonal strokes within cells (any kind), including their styling, placement, and export.
- Diagonal captions/labels and any anchor/attachment semantics for diagonals.
- Any rendering techniques dedicated to diagonals.

# Grid & Spans

- **Orthogonal grid**: rows × columns.
- **Merges (spans)**: rectangular `rowSpan` × `colSpan` only.
- **Span invariants**:

  - Spanning cells own the **interior edges** they cover (those edges are visually removed).
  - Fills for a spanning cell cover the entire merged rectangle.
  - Selection/edit outside this spec; rendering must resolve edges without double strokes.

- **Perimeter classification**: edges tagged as `outer` vs `inner` for styling defaults (see strokes).

# Stroke Model

- **Per-edge styling** at the cell level:

  - `strokeTop|Right|Bottom|Left`: { weight, type, color, tint, opacity, blendMode }.
  - `type`: solid, dashed, dotted, custom dash pattern (lengths + cap = butt/round/square).
  - **Gap color/tint for dashed types**: supported (stroke “gap color”) for path-like edges.

- **Corners & joins**:

  - Joins where two perpendicular strokes meet use `miter | round | bevel` (table-level default; edge can override).
  - Miter limit configurable.
  - Joins and endpoints respect inner padding (see insets) and clip to the cell content box.

## Stroke Conflict Resolution (adjacent cells)

When two neighboring cells specify different strokes on a shared edge:

- **Policy** (table-level, overridable per table style):

  - `maxWeightWins` (InDesign-like),
  - `priorityByRegion` (if you later add header/footer; for now treat all as body),
  - or explicit **precedence** `left-over-right / top-over-bottom` toggles.

- **Tie-breakers**: if weight equals, prefer non-solid > solid; else higher opacity; finally, table default.
- **Color blending**: do **not** blend; the winning edge fully determines appearance.

## Draw Order

1. Cell background fills
2. Inner edges
3. Outer perimeter edges (to avoid inner edges peeking)

# Fills

- **Cell fill**: { none | color | gradient }, with tint, opacity, blendMode. Clips to padding (insets).
- **Alternating fills** (striping):

  - By row and/or by column with cycle `n`.
  - Exceptions for first/last row/column (and for merged spans crossing cycles).
  - Priority: explicit cell fill overrides alternation.

- **Gradient fills**: linear/radial; angle, start/stop points relative to cell content box (not whole table).
- **Table background**: optional single fill drawn behind all cells (useful when inner strokes use gap color tricks).

# Insets / Padding & “Gaps”

- **Insets (padding)** per cell: `insetTop|Right|Bottom|Left` (points).

  - **Fills** honor insets (i.e., paint inside padding box).

- **Gaps between cells**:

  - **No separate inter-cell gutter** in the model. Visual separation is achieved via **inner strokes** (including dashed strokes with **gap color** equal to the table background to simulate gutters).
  - You can emulate a “gap” by:

    - Setting inner strokes to the page/table background color at a chosen weight, or
    - Using dashed types with a **gap color** to create patterned separators.

- **Stroke vs inset interaction**: Strokes sit **on the border**; insets reduce the fill/text area only—strokes do not encroach into the padding box.

# Merged Cells: Edge & Fill Semantics

- Any interior edges consumed by a span are not drawn.
- Alternating fills: evaluate on the **anchor cell** (top-left of the span) and extend across the merged area.
- Conflict resolution for the **outer boundary** of a merged cell follows standard shared-edge rules with neighbors.

# Transparency & Blend

- **Per-edge** and **per-fill** opacity and `blendMode` (Normal, Multiply, Screen, Overlay, etc.) supported.
- Strokes/fills participate in the page’s compositing stack; z-order per “Draw Order” above.

# Table Perimeter Controls

- Separate **outer border** style set (macro): optional override for the table’s rectangle perimeter.
- Corner joins for the table perimeter follow the corner join rule; inner grid joins follow edge-join rule.

# Decimal/Grid Alignment (Visual Only)

- Not a content feature here; mention solely that **justify vertical** (distribute) is outside this scope.

# Export Requirements

- **PDF**: strokes/fills must map to vector paths; dashed patterns preserved; overprint/knockout flags respected if present in your color model.
- **EPUB/HTML** (best effort): CSS borders for per-edge strokes; dashed patterns via `border-style`; gradients via CSS gradients. Gap-color emulation may degrade.
- **Tagged PDF/HTML semantics**: unaffected by this spec, but visual parity must hold.

# Performance Notes

- Coalesce identical **runs of inner edges** into single draw calls per row/column.
- Cache dash patterns and gradient shaders.
- Resolve conflicts once per layout pass; store **winning edge** on each shared boundary.

# API / DOM Sketch

```ts
interface Table {
  rows: Row[];
  columns: Column[];
  style?: TableStrokeFillStyle;
  outerBorder?: EdgeStyle | null;
  strokeConflictPolicy: "maxWeightWins" | "precedence";
  precedence?: {
    horizontal: "topOverBottom" | "bottomOverTop";
    vertical: "leftOverRight" | "rightOverLeft";
  };
  cornerJoin: "miter" | "round" | "bevel";
  miterLimit: number;
  backgroundFill?: Fill | null;
}

interface Cell {
  rowSpan: number;
  colSpan: number;
  insetTop: number;
  insetRight: number;
  insetBottom: number;
  insetLeft: number;
  fill?: Fill | null;
  edges: {
    top?: EdgeStyle;
    right?: EdgeStyle;
    bottom?: EdgeStyle;
    left?: EdgeStyle;
  };
}

interface EdgeStyle {
  weight: number; // pt
  type:
    | "solid"
    | "dashed"
    | "dotted"
    | { dash: number[]; cap: "butt" | "round" | "square" };
  color: ColorRef;
  tint?: number;
  opacity?: number;
  blendMode?: BlendMode;
  gapColor?: ColorRef;
  gapTint?: number; // for dashed/dotted
}

type Fill =
  | { kind: "none" }
  | {
      kind: "color";
      color: ColorRef;
      tint?: number;
      opacity?: number;
      blendMode?: BlendMode;
    }
  | {
      kind: "gradient";
      mode: "linear" | "radial";
      stops: Stop[];
      angle?: number;
      start?: { x: number; y: number };
      end?: { x: number; y: number };
      opacity?: number;
      blendMode?: BlendMode;
    };

interface TableStrokeFillStyle {
  // Defaults that individual cells inherit; includes alternating rules.
  alternating?: {
    by: "row" | "column" | "both";
    every: number; // cycle length
    startIndex?: number; // where striping starts
    odd?: Fill;
    even?: Fill;
    firstRowOverride?: Fill | null;
    lastRowOverride?: Fill | null;
    firstColOverride?: Fill | null;
    lastColOverride?: Fill | null;
  };
  defaultEdge?: EdgeStyle;
  defaultCellFill?: Fill | null;
}
```

# “Do we have control over gaps?”

- **Yes** for **dash “gap color/tint”** (the color of the spaces in dashed/dotted strokes).
- **No native inter-cell gutters** separate from strokes. To simulate a fixed “gap” between cells, use inner strokes colored to match the background (or dashed with gap color), effectively creating visual gutters.
