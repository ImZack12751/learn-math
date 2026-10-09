import { useMemo, useState } from 'react';
import { deriveSeed } from '../../engine/rng';
import { generatorsForTopic } from '../../generators/registry';
import { instantiate } from '../../generators/harness';
import type { Difficulty } from '../../generators/types';
import { ProblemCard } from '../practice/ProblemCard';
import { Button } from '../primitives/Button';
import { Eyebrow } from '../primitives/Eyebrow';
import { Icon } from '../primitives/Icon';
import { Panel } from '../primitives/Panel';
import { randomSeed } from './Practice';
import { useTopic } from './TopicContext';

const PLAN: readonly Difficulty[] = [1, 2, 2, 3, 3];

/**
 * A short mixed set: this topic's skills across difficulties, interleaved with problems from its
 * prerequisites (whichever of them have generators yet).
 */
export function CheckYourself() {
  const { topic, generators } = useTopic();
  const [seed, setSeed] = useState(randomSeed);
  const [at, setAt] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  const set = useMemo(() => {
    const earlier = topic.prerequisites.flatMap(generatorsForTopic);
    return PLAN.map((difficulty, i) => {
      const fromEarlier = earlier.length > 0 && i % 2 === 1;
      const pool = fromEarlier ? earlier : generators;
      const s = deriveSeed(seed, i);
      const gen = pool[s % pool.length];
      if (!gen) throw new Error('No generators for the check set');
      return instantiate(gen, s, fromEarlier ? 2 : difficulty);
    });
  }, [seed, generators, topic.prerequisites]);

  const problem = set[at];
  const done = at >= set.length;
  const score = results.filter(Boolean).length;

  return (
    <section id="check" aria-labelledby="check-title" className="scroll-mt-28">
      <Eyebrow>Check yourself</Eyebrow>
      <h2 id="check-title" className="mt-4 mb-6 text-[clamp(2rem,4vw,2.8rem)] text-fg">
        <span className="scrim">Five questions, mixed</span>
      </h2>
      <Panel className="p-6 sm:p-8">
        <p className="label-mono" aria-live="polite">
          {done ? 'Finished' : `Question ${at + 1} of ${set.length}`}
        </p>
        {problem && !done && (
          <div className="mt-4">
            <ProblemCard
              problem={problem}
              pageTopic={topic.id}
              onResult={({ result, solutionViewed }) => {
                if (results.length > at) return;
                setResults((r) => [...r, result.verdict === 'correct' && !solutionViewed]);
              }}
            />
            <div className="mt-6">
              <Button
                onClick={() => {
                  if (results.length <= at) setResults((r) => [...r, false]);
                  setAt((a) => a + 1);
                }}
              >
                {at + 1 < set.length ? 'Next question' : 'Finish'} <Icon name="arrowRight" />
              </Button>
            </div>
          </div>
        )}
        {done && (
          <div className="mt-4 space-y-4">
            <p className="font-display text-3xl text-fg">
              {score} of {set.length} correct first time
            </p>
            <p className="text-fg-muted">
              {score === set.length
                ? 'All correct. This topic is holding up well.'
                : 'Look back at the explanation for the ones that slipped, then try a new set.'}
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setSeed(randomSeed());
                setAt(0);
                setResults([]);
              }}
            >
              Try a new set
            </Button>
          </div>
        )}
      </Panel>
    </section>
  );
}
