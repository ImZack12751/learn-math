import { useMemo, useState } from 'react';
import { deriveSeed } from '../../engine/rng';
import { generatorsForTopic } from '../../generators/registry';
import { instantiate } from '../../generators/harness';
import {
  DIFFICULTIES,
  type AnyGenerator,
  type Difficulty,
  type ProblemInstance,
} from '../../generators/types';
import { ProblemCard, type ProblemOutcome } from '../practice/ProblemCard';
import { TreeGlyph } from '../practice/TreeGlyph';
import { Button } from '../primitives/Button';
import { ChipGroup } from '../primitives/ChipGroup';
import { Eyebrow } from '../primitives/Eyebrow';
import { Icon } from '../primitives/Icon';
import { Panel } from '../primitives/Panel';
import { useTopic } from './TopicContext';

/** A fresh 32-bit seed for each session (problems are reproducible from it). */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] ?? 1;
}

const LEVELS: { value: Difficulty | 'mixed'; label: string }[] = [
  { value: 1, label: 'Foundation' },
  { value: 2, label: 'Standard' },
  { value: 3, label: 'Harder' },
  { value: 'mixed', label: 'Mixed' },
];

interface Pick {
  generator: AnyGenerator;
  difficulty: Difficulty;
}

function choose(
  pool: readonly AnyGenerator[],
  level: Difficulty | 'mixed',
  seed: number,
  index: number,
): Pick {
  const s = deriveSeed(seed, index);
  const generator = pool[s % pool.length] as AnyGenerator;
  const difficulty = level === 'mixed' ? (DIFFICULTIES[(s >>> 8) % 3] as Difficulty) : level;
  return { generator, difficulty };
}

/** Practice with answer checking: fresh problems every time, by skill and difficulty. */
export function Practice() {
  const { topic, generators } = useTopic();
  const [skill, setSkill] = useState<string>('all');
  const [level, setLevel] = useState<Difficulty | 'mixed'>(1);
  const [seed] = useState(randomSeed);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState({ correct: 0, answered: 0 });
  const [answered, setAnswered] = useState<string | null>(null);

  const pool = skill === 'all' ? generators : generators.filter((g) => g.id === skill);
  const problem: ProblemInstance = useMemo(() => {
    const { generator, difficulty } = choose(pool, level, seed, index);
    return instantiate(generator, deriveSeed(seed, index + 7919), difficulty);
  }, [pool, level, seed, index]);

  const record = (outcome: ProblemOutcome) => {
    if (answered === problem.key) return; // first answer per problem counts
    setAnswered(problem.key);
    setTally((t) => ({
      correct: t.correct + (outcome.result.verdict === 'correct' ? 1 : 0),
      answered: t.answered + 1,
    }));
  };

  return (
    <section id="practice" aria-labelledby="practice-title" className="scroll-mt-28">
      <Eyebrow>Practice</Eyebrow>
      <h2 id="practice-title" className="mt-4 mb-6 text-[clamp(2rem,4vw,2.8rem)] text-fg">
        <span className="scrim">Fresh problems, every time</span>
      </h2>
      <Panel className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <ChipGroup
              legend="Skill"
              value={skill}
              options={[
                { value: 'all', label: 'All skills' },
                ...generatorsForTopic(topic.id).map((g) => ({ value: g.id, label: g.title })),
              ]}
              onChange={(v) => {
                setSkill(v);
                setIndex((i) => i + 1);
              }}
            />
            <ChipGroup
              legend="Difficulty"
              value={String(level)}
              options={LEVELS.map((l) => ({ value: String(l.value), label: l.label }))}
              onChange={(v) => {
                setLevel(v === 'mixed' ? 'mixed' : (Number(v) as Difficulty));
                setIndex((i) => i + 1);
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <TreeGlyph correct={tally.correct} />
            <p className="font-mono text-sm text-fg-muted tabular-nums">
              {tally.correct} of {tally.answered} correct
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-line pt-8">
          <ProblemCard problem={problem} pageTopic={topic.id} onResult={record} />
          <div className="mt-6">
            <Button
              onClick={() => {
                setIndex((i) => i + 1);
              }}
            >
              New problem <Icon name="arrowRight" />
            </Button>
          </div>
        </div>
      </Panel>
    </section>
  );
}
