import { BorderMenu } from "../BorderMenu";
import { StyleIcon } from "../icons/styleIcon";
import { BorderStyle } from "../logic/types";

const options: { value: BorderStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
];

export default function StyleMenu(props: {
  value: BorderStyle | "mixed";
  onChange: (v: BorderStyle) => void;
  disabled?: boolean;
}) {
  return (
    <BorderMenu
      label="Style"
      value={props.value}
      options={options.map((o) => ({
        value: o.value,
        label: o.label,
        icon: () => (
          <div style={{ width: "100%" }}>
            <StyleIcon value={o.value} color="#1f3a40" fullWidth />
          </div>
        ),
      }))}
      onChange={props.onChange}
      disabled={props.disabled}
      renderButtonIcon={(v) => <StyleIcon value={v as any} />}
      hideLabels
    />
  );
}
