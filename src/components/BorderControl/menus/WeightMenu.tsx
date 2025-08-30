import { BorderMenu } from "../BorderMenu";
import { WeightIcon } from "../icons/weightIcon";
import { BorderStyle, BorderWeight } from "../logic/types";

const options: { value: BorderWeight; label: string }[] = [
  { value: 0, label: "0 (None)" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 4, label: "4" },
];

export default function WeightMenu(props: {
  value: BorderWeight | "mixed";
  currentStyle: BorderStyle | "mixed";
  onChange: (v: BorderWeight) => void;
  disabled?: boolean;
}) {
  return (
    <BorderMenu
      label="Weight"
      value={props.value}
      options={options.map((o) => ({
        value: o.value,
        label: o.label,
        icon: () => (
          <WeightIcon
            value={o.value}
            style={props.currentStyle}
            color="#1f3a40"
          />
        ),
      }))}
      onChange={props.onChange}
      disabled={props.disabled}
      renderButtonIcon={(v) => <WeightIcon value={v as any} style={"solid"} />}
      hideLabels
    />
  );
}
