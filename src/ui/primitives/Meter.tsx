import { motion } from 'motion/react';
import { useReducedMotion } from '../theme/useMotion';

interface MeterProps {
  /** 0..1 */
  value: number;
  label: string;
  /** Text shown beside the bar (for example "0 %"). */
  valueText: string;
}

/** Linear mastery meter with a visible value, exposed to assistive tech as a meter. */
export function Meter({ value, label, valueText }: MeterProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const reduced = useReducedMotion();
  return (
    <div className="flex items-center gap-3">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped * 100)}
        aria-valuetext={valueText}
        className="relative h-1.5 w-40 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--c-line-strong)_45%,transparent)]"
      >
        <motion.div
          className="absolute inset-0 origin-left rounded-full bg-accent"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: clamped }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="font-mono text-xs text-fg-muted tabular-nums">{valueText}</span>
    </div>
  );
}
