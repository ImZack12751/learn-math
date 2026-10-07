import { animate, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../theme/useMotion';

interface CountUpProps {
  value: number;
  /** Formats the displayed number; also used for the accessible final value. */
  format?: (n: number) => string;
  className?: string;
}

/** A number that counts up from zero when it first scrolls into view. */
export function CountUp({ value, format = (n) => String(Math.round(n)), className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setShown,
    });
    return () => {
      controls.stop();
    };
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{format(reduced ? value : shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
