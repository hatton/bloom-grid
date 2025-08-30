# Border Control UI – Implementation Plan

This document plans the Border Control UI comprised of:

- BorderSelector (with optional Inner toggle)
- Three compact menus (Weight, Style, Corner radius), each with a computed SVG icon and mixed-state support
- A small coordination layer wiring selection to menu changes

Scope focuses on component contracts, state logic, rendering strategy, and tests. Tech stack: TypeScript + React, Material UI v5 for primitives and interactions. No theming requirements beyond reasonable defaults.

## High-level UX

- Layout: a left BorderSelector and a right vertical stack of three compact menu buttons.
- Clicking a border button toggles it between selected and unselected (unselected renders at 50% opacity). No per-corner toggles in the selector.
- Menus always apply their chosen value to the currently selected borders.
- If selected borders have differing values for a menu’s attribute, the menu button shows “Mixed”. Opening a mixed menu highlights no option by default.
- Many tooltips: each toggle and menu/button should expose a concise tooltip describing action/value.

## Components

1. BorderSelector

- Renders buttons for: top, right, bottom, left, and optional inner (plus-shaped: one horizontal, one vertical segment).
- Props
  - valueMap: BorderValueMap (see types below) that includes weight/style/radius values for each edge.
  - showInner: boolean (controls visibility of the inner toggle button).
  - selected: SelectedEdges (controlled selection state of edges).
  - onChange(selected: SelectedEdges): void.
  - size?: number (px) approximate sizing to match reference image; if omitted, default reasonable compact size.
- Behavior
  - Toggle individual edges on click. Inner toggles the plus (both inner horizontal and vertical as one logical group).
  - Visuals: selected edges render fully opaque; unselected edges at 50% opacity. No color theming requirements beyond sensible defaults.
  - No per-corner selection.

2. BorderMenu (thin wrapper)

- Wraps a small MUI v5 control (recommended: Button with Menu or Select-like Popover) to pick from a small set of values.
- Props
  - label: string (for tooltip and aria-label).
  - value: BorderMenuValue | "mixed".
  - options: Array<{ value: BorderMenuValue; label: string; icon: () => JSX.Element }>.
  - onChange(value: BorderMenuValue): void.
  - disabled?: boolean.
  - renderButtonIcon(current: BorderMenuValue | "mixed"): JSX.Element (computes the button icon SVG reflecting the current state; when mixed, render the word “Mixed”).
- Behavior
  - Button shows computed icon; if mixed, button text/icon shows “Mixed”.
  - Opening a mixed menu highlights no option by default (A).

3. BorderControl (composite)

- Composes BorderSelector + 3 menus (Weight, Style, Corner radius).
- Props
  - valueMap: BorderValueMap (complete set of values per edge group: top, right, bottom, left, innerV, innerH where inner is logically treated as a pair under one toggle).
  - showInner: boolean.
  - onApply(next: PartialEdgeUpdate): void (fires when a menu selection changes; contains edges affected and the attribute/value change). Implementation note: the component itself does not mutate upstream state; it emits intent.
  - initialSelected?: SelectedEdges (optional override). If not provided, initial selection is derived from `valueMap` by an internal algorithm (see below).
- Internal state
  - selected: SelectedEdges (controlled via onChange from BorderSelector and internal initialization algorithm).
  - derived menu states (weight/style/radius): either a concrete value or "mixed" computed from `selected` + `valueMap`.
- Visual rules for disabling menus (see “Interdependency rules” below).

## Types

- EdgeKey: "top" | "right" | "bottom" | "left" | "innerH" | "innerV".
- BorderWeight: 0 | 1 | 2 | 4.
- BorderStyle: "none" | "solid" | "dashed" | "dotted" | "double" (keep small; support double if needed; can be reduced later).
- CornerRadius: 0 | 2 | 4 | 8.
- EdgeValue = { weight: BorderWeight; style: BorderStyle; radius: CornerRadius }.
- BorderValueMap: Record<EdgeKey, EdgeValue>.
- SelectedEdges: Set<EdgeKey> (or Record<EdgeKey, boolean> for serialization).
- BorderMenuValue: BorderWeight | BorderStyle | CornerRadius (menu-specific union).
- PartialEdgeUpdate: { edges: EdgeKey[]; change: { weight?: BorderWeight; style?: BorderStyle; radius?: CornerRadius } }.

Notes:

- Inner is exposed as a single toggle in the UI but stored as `innerH` and `innerV` for precision. The toggle affects both.

## Algorithms

1. Initial selection from valueMap

- Goal: Start with the largest equivalence class of edge values so menus present a coherent default.
- Steps
  - Form tuples per edge: t(edge) = `${weight}|${style}|${radius}`.
  - Group edges by tuple; choose group with max cardinality. Ties: prefer the group that includes an outer edge over inner-only; if still tied, prefer the group with more contiguous outers (heuristic), else first.
  - Initialize `selected` as that group’s edges. If `showInner=false`, drop any inner edges from consideration when grouping and selection.
- Unit-test this grouping logic independently.

2. Mixed-state computation per menu

- For each attribute (weight/style/radius):
  - Extract values for all currently selected edges.
  - If the set size is 0, treat as mixed (no selection -> keep button neutral, tooltip instructs to select edges).
  - If set size > 1, show "Mixed".
  - Else show the single value.

3. Applying changes

- When a menu change occurs:
  - Determine `edgesToApply = Array.from(selected)`; if the BorderSelector’s inner toggle is on, apply to both innerH and innerV.
  - Emit `onApply({ edges: edgesToApply, change: { [attr]: value } })`.
  - The parent app decides how this maps to cell grids; this component treats edges abstractly.

## Interdependency rules (none-influenced disabling)

- Both Weight and Style menus include a "none" concept:
  - Weight: `0`.
  - Style: `"none"`.
- Disabling logic:
  - If exactly one of the two (weight or style) is set to none for the currently selected edges (and not mixed), disable the other menu. Examples:
    - Weight is 0 (not mixed) -> disable Style menu.
    - Style is "none" (not mixed) -> disable Weight menu.
  - If both are none (not mixed), keep the Style menu enabled (Weight may remain enabled too, but the requirement only mandates Style remains enabled).
  - If either attribute is mixed, no disabling is applied solely based on mixed; disabling is computed after user picks a non-mixed value.
- Corner menu is independent, but if only inner edges are selected, radius changes have no effect in many models; we will not auto-disable per requirement (out of scope). A tooltip can note “Corners affect outer edges”.

## Visual design and rendering

- BorderSelector rendering options
  - Approach A (recommended): Single SVG sized by `size` prop. Draw five hit regions (top/right/bottom/left/plus). Each region handles pointer events, toggles selection, and draws at full or 50% opacity.
  - Approach B: 3x3 layout of MUI IconButtons with custom SVG paths per region; slightly heavier DOM but simpler hit-testing.
  - Use a teal-ish stroke/fill for edges, matching the reference screenshot, with hover feedback via slight brightness or stroke width change.
- Menu buttons
  - Each button’s icon is a tiny SVG that visually represents its current state:
    - Weight: draw a horizontal line with the chosen stroke width (0, 1, 2, 4). Weight 0 renders an empty/ghosted line.
    - Style: line with stroke-dasharray for dashed/dotted; empty/ghosted for none.
    - Corner: a quarter-arc path; larger radius draws a more pronounced curve; radius 0 renders sharp angle.
  - In mixed state, the button shows the text “Mixed”. Keep width stable; can combine an icon + text if needed.
  - Use MUI Button (size="small") with Menu; or MUI Select in displayEmpty mode with a custom renderValue. Prefer Button+Menu for clearer mixed state.

## Tooltips and accessibility

- Tooltips
  - BorderSelector: “Toggle top border”, “Toggle right border”, …, “Toggle inner borders”.
  - Menus: Button tooltip reflects current value or Mixed. Each menu item has a label tooltip as well if needed.
- Accessibility: Rely on MUI v5 defaults. Provide aria-labels on buttons and a roving tabindex within the BorderSelector if using SVG (so arrow keys move between focusable regions if feasible). No custom keyboard handling beyond MUI basics is required.

## File/Component layout (TypeScript)

- src/components/BorderControl/
  - BorderControl.tsx – composite orchestrator.
  - BorderSelector.tsx – SVG-based selector.
  - BorderMenu.tsx – menu wrapper (generic).
  - menus/
    - WeightMenu.tsx – options [0, 1, 2, 4].
    - StyleMenu.tsx – options [none, solid, dashed, dotted, double].
    - CornerMenu.tsx – options [0, 2, 4, 8].
  - icons/
    - weightIcon.tsx
    - styleIcon.tsx
    - cornerIcon.tsx
  - logic/
    - selectionInit.ts – initial selection algorithm.
    - mixedState.ts – compute mixed/concrete values per attribute for current selection.
    - types.ts – shared types (EdgeKey, EdgeValue, etc.).

## Contracts (concise)

- Inputs
  - valueMap (complete per-edge values), showInner, initialSelected? (optional).
- Outputs
  - onChange(selected) from BorderSelector.
  - onApply({ edges, change }) from BorderControl when user picks a menu value.
- Error modes
  - No selected edges -> menus show Mixed and do nothing until a value is chosen (then apply to none; parent may ignore). Optionally grey out menus until at least one edge is selected.
- Success criteria
  - Toggling edges updates mixed/computed menu button visuals in real time.
  - Picking a menu option emits exactly one onApply with the chosen edges and attribute.

## Testing strategy (Vitest)

- Unit tests
  - selectionInit: grouping by (weight,style,radius); tie-breaking; honoring showInner=false.
  - mixedState: empty selection -> mixed; homogeneous selection -> concrete; heterogeneous -> mixed.
  - interdependency rules: disabling behavior across combinations (weight 0 vs style none, both none, mixed states).
- Component tests (React Testing Library)
  - BorderSelector toggling: click regions change selection; opacity reflects state.
  - BorderMenu: mixed label, no highlighted item when opening; onChange fires with correct values.
  - BorderControl: integration—select a subset, change weight, assert onApply edges/values.

## Implementation phases

1. Scaffolding

- Add shared types and logic files; write unit tests for selectionInit and mixedState first.

2. BorderSelector

- Build SVG version with five hit regions and visual states; wire tooltips.

3. Generic BorderMenu

- Button + Menu scaffold with renderButtonIcon; ensure mixed display and no default highlight on open.

4. Concrete menus

- Weight/Style/Corner menus with option sets and SVG icons.

5. Integration in BorderControl

- Derive initialSelected; compute mixed states; implement interdependency rules; emit onApply.

6. Tests and polish

- RTL tests for interactions; snapshot the button icons across values; tune sizes/spacing to reference.

## Edge cases

- Mixed selection across all attributes -> all three menus show Mixed.
- Weight 0 not mixed -> Style disabled; Style none not mixed -> Weight disabled; both none not mixed -> keep Style enabled.
- showInner=false -> inner toggle hidden and inner values ignored for initial selection grouping.
- No selection (possible if user deselects all) -> menus show Mixed; tooltips instruct to select borders.

## Out of scope

- Mapping edges to actual grid/cell geometry; cell selections; per-corner toggles; color picking; custom keyboard handling beyond MUI defaults; theme/dark-mode adaptations.

## Open items (minor, can decide during build)

- Whether to keep Weight enabled when both are none (currently allowed; only requirement is Style remains enabled).
- Include or drop the “double” style option (safe to include; trivial to remove later).

---

This plan is aligned with the clarified requirements and keeps components small, typed, and testable. Next step: implement logic modules and unit tests, then the SVG-based BorderSelector, and finally wire menus and interdependency rules.
