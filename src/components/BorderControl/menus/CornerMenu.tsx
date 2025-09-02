import { BorderMenu } from "../BorderMenu";
import { CornerSampleImage } from "../icons/cornerSampleImage";
import { CornerRadius } from "../logic/types";

const options: { value: CornerRadius; label: string }[] = [
  { value: 0, label: "0" },
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
        icon: () => <CornerSampleImage value={o.value} color="#1f3a40" />,
      }))}
      onChange={props.onChange}
      disabled={props.disabled}
      renderButtonImage={(v) => <CornerSampleImage value={v as any} />}
      hideLabels
    />
  );
}
