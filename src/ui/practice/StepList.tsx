import { motion } from 'motion/react';
import type { SolutionStep } from '../../engine/types';
import { Tex } from '../math/Tex';
import { Icon } from '../primitives/Icon';

interface StepListProps {
  steps: readonly SolutionStep[];
  /** How many steps to show (the rest stay hidden). Defaults to all. */
  visible?: number;
  /** Marks every line as wrong working (the example that fails on purpose). */
  wrong?: boolean;
}

/** Working, one line per step, with its reason beside it. */
export function StepList({ steps, visible = steps.length, wrong = false }: StepListProps) {
  return (
    <ol className="space-y-3">
      {steps.slice(0, visible).map((step, i) => (
        <motion.li
          key={`${i}-${step.math}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-x-6 gap-y-1 border-b border-line pb-3 last:border-none md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <div className="flex items-start gap-2 overflow-x-auto text-fg">
            {wrong && <Icon name="cross" label="Faulty step:" className="mt-1 shrink-0" />}
            <Tex tex={step.math} />
          </div>
          <p className="text-sm text-fg-muted">{step.reason}</p>
        </motion.li>
      ))}
    </ol>
  );
}
