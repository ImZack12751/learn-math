import { useState, type ReactNode } from 'react';
import { misconceptions } from '../../content/misconceptions';
import { getGenerator } from '../../generators/registry';
import { fromParams } from '../../generators/harness';
import { RichTextView } from '../math/RichTextView';
import { Tex } from '../math/Tex';
import { AnswerBox } from '../practice/AnswerBox';
import { StepList } from '../practice/StepList';
import { Button } from '../primitives/Button';
import { Eyebrow } from '../primitives/Eyebrow';
import { Icon } from '../primitives/Icon';
import { Panel } from '../primitives/Panel';
import { useTopic } from './TopicContext';

export function WorkedExamples({ children }: { children: ReactNode }) {
  return (
    <section id="examples" aria-labelledby="examples-title" className="scroll-mt-28">
      <Eyebrow>Worked examples</Eyebrow>
      <h2 id="examples-title" className="mt-4 mb-6 text-[clamp(2rem,4vw,2.8rem)] text-fg">
        <span className="scrim">Step by step, then on your own</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const FADE_LABEL = {
  full: 'Fully worked',
  'last-1': 'Finish the last step',
  'last-2': 'Finish the last steps',
  learner: 'Your turn',
} as const;

/**
 * A worked example built from authored parameters by the generator's own `build`, so every
 * number is computed and checked. Fading: fully worked, last steps hidden, or solved by you with
 * hints. With `misconception` set, it shows the faulty working first, then the correct working.
 */
export function WorkedExample({ id, title }: { id: string; title?: string }) {
  const { topic, examples } = useTopic();
  const [revealed, setRevealed] = useState(0);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(false);
  const spec = examples[id];
  const generator = spec ? getGenerator(spec.generatorId) : undefined;
  if (!spec || !generator) throw new Error(`Unknown worked example ${id}`);
  const problem = fromParams(generator, spec.params, spec.difficulty, 0);
  const hidden =
    spec.fade === 'last-1'
      ? 1
      : spec.fade === 'last-2'
        ? 2
        : spec.fade === 'learner'
          ? problem.steps.length
          : 0;
  const shown = Math.min(
    problem.steps.length,
    problem.steps.length - hidden + revealed + (solved ? hidden : 0),
  );

  const rule = spec.misconception
    ? generator.misconceptions.find((m) => m.id === spec.misconception)
    : undefined;
  const wrongSteps = rule?.wrongSteps?.(spec.params);
  const mis = spec.misconception ? misconceptions[spec.misconception] : undefined;

  return (
    <Panel className="p-6 sm:p-8">
      <p className="label-mono flex items-center gap-2">
        {mis ? (
          <>
            <Icon name="alert" /> A common mistake
          </>
        ) : (
          <>{FADE_LABEL[spec.fade]}</>
        )}
      </p>
      {title && <h3 className="mt-2 text-2xl text-fg">{title}</h3>}
      <p className="prompt mt-3 text-xl text-fg">
        <RichTextView value={problem.prompt} />
      </p>

      {mis && wrongSteps && (
        <div className="mt-5">
          <p className="mb-3 flex items-center gap-2 font-medium text-fg">
            <Icon name="cross" /> The faulty working
          </p>
          <StepList steps={wrongSteps} wrong />
          <p className="mt-3 text-fg-muted">
            <span className="text-fg">{mis.name}.</span> {mis.why}
          </p>
          <p className="mt-5 mb-3 flex items-center gap-2 font-medium text-fg">
            <Icon name="check" /> The correct working
          </p>
        </div>
      )}

      <div className="mt-5">
        <StepList steps={problem.steps} visible={shown} />
      </div>

      {hidden > 0 && !solved && (
        <div className="mt-6 space-y-4">
          {hints > 0 && (
            <ol className="space-y-2" aria-label="Hints">
              {problem.hints.slice(0, hints).map((hint) => (
                <li key={hint.level} className="flex gap-2 text-fg-muted">
                  <Icon name="hint" className="mt-1 shrink-0" />
                  <RichTextView value={hint.body} />
                </li>
              ))}
            </ol>
          )}
          <AnswerBox
            spec={problem.answer}
            misconceptionAnswers={problem.misconceptionAnswers}
            pageTopic={topic.id}
            resetKey={`example-${id}`}
            label={`Your answer to the worked example`}
            onResult={(r) => {
              if (r.verdict === 'correct') setSolved(true);
            }}
          />
          <div className="flex flex-wrap gap-2">
            {spec.fade === 'learner' && hints < 3 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setHints((h) => h + 1);
                }}
              >
                <Icon name="hint" /> {hints === 0 ? 'Hint' : 'Another hint'}
              </Button>
            )}
            {shown < problem.steps.length && (
              <Button
                variant="ghost"
                onClick={() => {
                  setRevealed((r) => r + 1);
                }}
              >
                Show the next step
              </Button>
            )}
          </div>
        </div>
      )}
      {solved && (
        <p className="mt-4 flex items-center gap-2 text-fg">
          <Icon name="check" /> Solved. The full working is above.
        </p>
      )}
      {!hidden && !mis && (
        <p className="mt-4 flex items-center gap-2 text-sm text-fg-faint">
          Answer: <Tex tex={problem.answer.canonical} />
        </p>
      )}
    </Panel>
  );
}
