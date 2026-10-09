import { Icon } from './Icon';

/** A visible "not true" label for faulty rules (an icon alone could be misread as maths). */
export function NotTrue() {
  return (
    <span className="label-mono inline-flex items-center gap-1 rounded-full border border-line-strong px-2 py-0.5">
      <Icon name="cross" />
      Not true
    </span>
  );
}
