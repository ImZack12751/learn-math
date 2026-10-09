import { useState } from 'react';
import type { CheckResult } from '../../engine/types';
import type { ProblemInstance } from '../../generators/types';
import { RichTextView } from '../math/RichTextView';
import { Button } from '../primitives/Button';
import { Icon } from '../primitives/Icon';
import { AnswerBox } from './AnswerBox';
import { StepList } from './StepList';

export interface ProblemOutcome {
  result: CheckResult;
  hintsUsed: number;
  solutionViewed: boolean;
}

interface ProblemCardProps {
  problem: ProblemInstance;
  pageTopic: string;
  onResult?: (outcome: ProblemOutcome) => void;
}

/**
 * One problem: the question, an answer box, three hint levels (nudge, method, first step) and the
 * worked solution revealed one step at a time.
 */
export function ProblemCard({ problem, pageTopic, onResult }: ProblemCardProps) {
  const [hints, setHints] = useState(0);
  const [stepsShown, setStepsShown] = useState(0);
  const [lastKey, setLastKey] = useState(problem.key);
  if (lastKey !== problem.key) {
    setLastKey(problem.key);
    setHints(0);
    setStepsShown(0);
  }
  const total = problem.steps.length;

  return (
    <div className="space-y-5">
      <p className="prompt text-xl text-fg">
        <RichTextView value={problem.prompt} />
      </p>

      <AnswerBox
        spec={problem.answer}
        misconceptionAnswers={problem.misconceptionAnswers}
        pageTopic={pageTopic}
        resetKey={problem.key}
        onResult={(result) =>
          onResult?.({ result, hintsUsed: hints, solutionViewed: stepsShown > 0 })
        }
      />

      {hints > 0 && (
        <ol className="space-y-2" aria-label="Hints">
          {problem.hints.slice(0, hints).map((hint) => (
            <li key={hint.level} className="flex gap-2 text-fg-muted">
              <Icon name="hint" className="mt-1 shrink-0" />
              <span>
                <span className="label-mono mr-2">
                  {hint.level === 'nudge'
                    ? 'Nudge'
                    : hint.level === 'method'
                      ? 'Method'
                      : 'First step'}
                </span>
                <RichTextView value={hint.body} />
              </span>
            </li>
          ))}
        </ol>
      )}

      {stepsShown > 0 && (
        <div>
          <p className="label-mono mb-2">Solution</p>
          <StepList steps={problem.steps} visible={stepsShown} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {hints < 3 && stepsShown === 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setHints((h) => h + 1);
            }}
          >
            <Icon name="hint" /> {hints === 0 ? 'Hint' : 'Another hint'}
          </Button>
        )}
        {stepsShown < total && (
          <Button
            variant="ghost"
            onClick={() => {
              setStepsShown((s) => s + 1);
            }}
          >
            {stepsShown === 0 ? 'Show the solution step by step' : 'Next step'}
          </Button>
        )}
        {stepsShown > 0 && stepsShown < total && (
          <Button
            variant="ghost"
            onClick={() => {
              setStepsShown(total);
            }}
          >
            Show all steps
          </Button>
        )}
      </div>
    </div>
  );
}
