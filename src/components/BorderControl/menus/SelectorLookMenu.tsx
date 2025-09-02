import { BorderMenu } from "../BorderMenu";
import { SelectorLook } from "../logic/types";

const options: { value: SelectorLook; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "gradients", label: "Gradients" },
  { value: "bevel", label: "Bevel" },
  { value: "rounded", label: "Rounded" },
  { value: "card", label: "Card" },
];

export default function SelectorLookMenu(props: {
  value: SelectorLook;
  onChange: (v: SelectorLook) => void;
}) {
  return (
    <BorderMenu
      label="Selector Look"
      value={props.value}
      options={options.map((o) => ({ value: o.value, label: o.label }))}
      onChange={props.onChange as any}
      renderButtonImage={() => <span style={{ fontSize: 12 }}>Look</span>}
    />
  );
}
