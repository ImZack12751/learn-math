import { motion } from 'motion/react';
import { useReducedMotion } from '../theme/useMotion';

interface ProgressArcProps {
  /** 0..1 */
  value: number;
  size?: number;
  label: string;
  className?: string;
}

/** A thin circular meter that draws itself in. Luminance only; the label carries the meaning. */
export function ProgressArc({ value, size = 56, label, className }: ProgressArcProps) {
  const stroke = 2;
  const r = size / 2 - stroke * 2;
  const clamped = Math.min(1, Math.max(0, value));
  const reduced = useReducedMotion();
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className={className}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--c-line-strong)"
        strokeOpacity={0.45}
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--c-accent)"
        strokeWidth={stroke + 0.5}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ pathLength: reduced ? clamped : 0 }}
        whileInView={{ pathLength: clamped }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ opacity: clamped > 0 ? 1 : 0 }}
      />
      <circle cx={size / 2} cy={size / 2} r={1.5} fill="var(--c-fg-faint)" />
    </svg>
  );
}
