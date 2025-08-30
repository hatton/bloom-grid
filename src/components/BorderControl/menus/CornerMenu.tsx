import { BorderMenu } from "../BorderMenu";
import { CornerIcon } from "../icons/cornerIcon";
import { CornerRadius } from "../logic/types";

const options: { value: CornerRadius; label: string }[] = [
  { value: 0, label: "0" },
  { value: 2, label: "2" },
  { value: 4, label: "4" },
  { value: 8, label: "8" },
];

export default function CornerMenu(props: {
  value: CornerRadius | "mixed";
  onChange: (v: CornerRadius) => void;
  disabled?: boolean;
}) {
  return (
    <BorderMenu
      label="Corners"
      value={props.value}
      options={options.map((o) => ({
        value: o.value,
        label: o.label,
        icon: () => <CornerIcon value={o.value} color="#1f3a40" />,
      }))}
      onChange={props.onChange}
      disabled={props.disabled}
      renderButtonIcon={(v) => <CornerIcon value={v as any} />}
      hideLabels
    />
  );
}
