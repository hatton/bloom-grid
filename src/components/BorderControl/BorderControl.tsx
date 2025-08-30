import { useMemo, useState } from "react";
import BorderSelector from "./BorderSelector";
import WeightMenu from "./menus/WeightMenu";
import StyleMenu from "./menus/StyleMenu";
import CornerMenu from "./menus/CornerMenu";
import {
  BorderStyle,
  BorderValueMap,
  BorderWeight,
  CornerRadius,
  SelectedEdges,
} from "./logic/types";
import { computeInitialSelection } from "./logic/selectionInit";
import {
  MixedOr,
  computeMixedRadius,
  computeMixedStyle,
  computeMixedWeight,
  interdependencyDisabled,
} from "./logic/mixedState";

export default function BorderControl(props: {
  valueMap: BorderValueMap;
  showInner?: boolean;
  onChange: (next: BorderValueMap) => void;
  initialSelected?: SelectedEdges;
}) {
  const showInner = props.showInner ?? true;
  const [selected, setSelected] = useState<SelectedEdges>(
    () =>
      props.initialSelected ??
      computeInitialSelection(props.valueMap, showInner)
  );

  const weight: MixedOr<BorderWeight> = useMemo(
    () => computeMixedWeight(props.valueMap, selected),
    [props.valueMap, selected]
  );
  const style: MixedOr<BorderStyle> = useMemo(
    () => computeMixedStyle(props.valueMap, selected),
    [props.valueMap, selected]
  );
  const radius: MixedOr<CornerRadius> = useMemo(
    () => computeMixedRadius(props.valueMap, selected),
    [props.valueMap, selected]
  );

  const disabled = interdependencyDisabled(weight, style);

  const apply = (
    change: Partial<{
      weight: BorderWeight;
      style: BorderStyle;
      radius: CornerRadius;
    }>
  ) => {
    const edges = Array.from(selected);
    if (edges.length === 0) return; // nothing to apply
    const next: BorderValueMap = { ...props.valueMap } as BorderValueMap;
    for (const e of edges) {
      next[e] = { ...next[e], ...change } as any;
    }
    props.onChange(next);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <BorderSelector
        valueMap={props.valueMap}
        showInner={showInner}
        selected={selected}
        onChange={setSelected}
        size={140}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <StyleMenu
          value={style as any}
          onChange={(v) => apply({ style: v })}
          disabled={disabled.styleDisabled}
        />
        <WeightMenu
          value={weight as any}
          currentStyle={style as any}
          onChange={(v) => apply({ weight: v })}
          disabled={disabled.weightDisabled}
        />
        <CornerMenu
          value={radius as any}
          onChange={(v) => apply({ radius: v })}
        />
      </div>
    </div>
  );
}
