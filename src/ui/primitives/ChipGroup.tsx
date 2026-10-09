import { useId } from 'react';

/** A row of radio choices styled as pills. */
interface ChipGroupProps {
  legend: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function ChipGroup({ legend, value, options, onChange }: ChipGroupProps) {
  const name = useId();
  return (
    <fieldset>
      <legend className="label-mono mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-sm text-fg-muted transition-colors has-[:checked]:border-fg has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => {
                onChange(o.value);
              }}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
