import { useState } from 'react';
import { Link } from 'react-router';
import { check } from '../../engine/check';
import type { AnswerSpec, CheckResult, MisconceptionAnswer } from '../../engine/types';
import { misconceptions, type MisconceptionId } from '../../content/misconceptions';
import { useFractal } from '../fractal/FractalProvider';
import { MathInput } from '../math/MathInput';
import { Tex } from '../math/Tex';
import { Button } from '../primitives/Button';
import { NotTrue } from '../primitives/NotTrue';
import { Icon } from '../primitives/Icon';

interface AnswerBoxProps {
  spec: AnswerSpec;
  misconceptionAnswers: readonly MisconceptionAnswer[];
  /** Topic of the page this box is on, so misconception links stay on the page when they can. */
  pageTopic: string;
  resetKey: string;
  onResult?: (result: CheckResult) => void;
  label?: string;
}

/** Answer field, check button and feedback. Feedback always pairs an icon with text. */
export function AnswerBox({
  spec,
  misconceptionAnswers,
  pageTopic,
  resetKey,
  onResult,
  label = 'Your answer',
}: AnswerBoxProps) {
  const [latex, setLatex] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [lastKey, setLastKey] = useState(resetKey);
  const { pulse } = useFractal();

  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setLatex(null);
    setResult(null);
  }

  const submit = () => {
    if (latex === null) {
      setResult({
        verdict: 'unparseable',
        formIssues: [],
        feedback: 'Type an answer first. If it is plain text, check the preview reads correctly.',
      });
      return;
    }
    const r = check(latex, spec, misconceptionAnswers);
    setResult(r);
    if (r.verdict === 'correct') pulse('correct');
    else if (r.verdict === 'incorrect') pulse('wrong');
    onResult?.(r);
  };

  return (
    <div className="space-y-3">
      <MathInput
        label={label}
        resetKey={resetKey}
        onChange={(value) => {
          setLatex(value);
        }}
        onSubmit={submit}
      />
      <Button onClick={submit}>Check</Button>
      <div aria-live="polite">{result && <Feedback result={result} pageTopic={pageTopic} />}</div>
    </div>
  );
}

function Feedback({ result, pageTopic }: { result: CheckResult; pageTopic: string }) {
  const mis = result.misconceptionId
    ? misconceptions[result.misconceptionId as MisconceptionId]
    : undefined;
  const view = {
    correct: { icon: 'check', title: 'Correct.', tone: 'border-fg' },
    'right-value-wrong-form': {
      icon: 'approx',
      title: 'Right value, not in the form asked for.',
      tone: 'border-line-strong',
    },
    incorrect: { icon: 'cross', title: 'Not quite.', tone: 'border-line-strong' },
    unparseable: { icon: 'info', title: 'I couldn’t read that answer.', tone: 'border-line' },
  } as const;
  const v = view[result.verdict];
  return (
    <div
      className={`rounded-xl border-l-2 bg-[color-mix(in_srgb,var(--c-fg)_5%,transparent)] px-4 py-3 ${v.tone}`}
    >
      <p className="flex items-center gap-2 font-medium text-fg">
        <Icon name={v.icon} className="shrink-0 text-lg" />
        {v.title}
      </p>
      {result.verdict === 'right-value-wrong-form' && (
        <ul className="mt-1 list-disc pl-6 text-sm text-fg-muted">
          {result.formIssues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      {result.verdict !== 'correct' && result.verdict !== 'right-value-wrong-form' && !mis && (
        <p className="mt-1 text-sm text-fg-muted">
          {result.feedback === 'Not quite.' ? 'Try again, or take a hint.' : result.feedback}
        </p>
      )}
      {mis && (
        <div className="mt-2 text-sm text-fg-muted">
          <p>
            This looks like a common mistake:{' '}
            <strong className="font-medium text-fg">{mis.name}</strong>.
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <NotTrue />
            <Tex tex={mis.faultyRule} />
          </p>
          <p className="mt-1">{mis.why}</p>
          {mis.topic === pageTopic ? (
            <a
              href={`#${mis.section}`}
              className="mt-1 inline-block text-fg underline underline-offset-4"
            >
              Read the explanation again
            </a>
          ) : (
            <Link
              to={`/topic/${mis.topic}#${mis.section}`}
              className="mt-1 inline-block text-fg underline underline-offset-4"
            >
              Revise this in its topic
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
