import { motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { stages, topics, type StageEntry } from '../content/curriculum';
import { useProgressSummary } from '../data/progress';
import { depthToZoom } from '../fractal/math';
import { overallDepth } from '../learning/depth';
import { useFractal } from '../ui/fractal/FractalProvider';
import { availableTopics } from './lessons';
import { Thumbnail } from '../ui/fractal/Thumbnail';
import { ButtonLink, buttonClass } from '../ui/primitives/Button';
import { CountUp } from '../ui/primitives/CountUp';
import { Eyebrow } from '../ui/primitives/Eyebrow';
import { Icon, type IconName } from '../ui/primitives/Icon';
import { Panel } from '../ui/primitives/Panel';
import { ProgressArc } from '../ui/primitives/ProgressArc';

const BUILD_SCOPE = 3;

export function Landing() {
  const progress = useProgressSummary();
  const { setMode, setProgressDepth } = useFractal();
  const depth = overallDepth(progress.mastery, topics.length);
  const mastered = [...progress.mastery.values()].filter((m) => m >= 0.9).length;
  const firstTopic = topics[0];
  const continueId = progress.continueTopic ?? firstTopic?.id;

  useEffect(() => {
    setMode('hero');
    setProgressDepth(depth);
    return () => {
      setMode('ambient');
    };
  }, [setMode, setProgressDepth, depth]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
      <section
        aria-labelledby="hero-title"
        className="flex min-h-[calc(100dvh-7rem)] flex-col items-start justify-center pb-16"
      >
        <Eyebrow>Mathematics from first principles</Eyebrow>
        <div className="scrim mt-8">
          <h1
            id="hero-title"
            className="font-display text-[clamp(4.5rem,15vw,11.5rem)] leading-[0.86] tracking-[-0.03em] text-fg italic"
          >
            Iterate
          </h1>
          <p className="mt-6 max-w-[26ch] font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-snug text-fg-muted">
            Arithmetic to calculus, one careful step at a time.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          {continueId && (
            <ButtonLink to={`/topic/${continueId}`}>
              {progress.continueTopic ? 'Continue where you left off' : 'Begin with Stage 1'}
              <Icon name="arrowRight" />
            </ButtonLink>
          )}
          <a href="#stages" className={buttonClass('ghost', 'glass')}>
            See all nine stages
          </a>
        </div>
      </section>

      <section aria-label="Your progress" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon="repeat"
          label="Reviews today"
          value={progress.reviewsDue}
          note={progress.reviewsDue === 0 ? 'Nothing due' : 'Ready when you are'}
        />
        <Stat
          icon="streak"
          label="Streak"
          value={progress.streakDays}
          unit={progress.streakDays === 1 ? 'day' : 'days'}
          note={progress.streakDays === 0 ? 'Starts with your first session' : 'Keep it going'}
        />
        <Stat
          icon="layers"
          label="Topics mastered"
          value={mastered}
          unit={`of ${topics.length}`}
          note="Mastery is 90 % on a mixed set"
        />
        <Panel className="flex items-center gap-4 p-5">
          <ProgressArc value={depth} label={`Depth ${depthToZoom(depth).toFixed(1)} times`} />
          <div>
            <p className="label-mono">Depth</p>
            <p className="font-display text-3xl text-fg">
              <CountUp value={depthToZoom(depth)} format={(n) => `${n.toFixed(1)}×`} />
            </p>
            <p className="text-xs text-fg-faint">The fractal zooms deeper as you learn</p>
          </div>
        </Panel>
      </section>

      <section id="stages" aria-labelledby="stages-title" className="scroll-mt-28 py-24">
        <Eyebrow>The route</Eyebrow>
        <div className="scrim mt-4 max-w-2xl">
          <h2 id="stages-title" className="text-[clamp(2.4rem,5vw,3.6rem)] text-fg">
            Nine stages, each built on the last
          </h2>
        </div>
        <ol className="mt-10 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage, i) => (
            <StageCard key={stage.id} stage={stage} index={i} mastery={progress.mastery} />
          ))}
        </ol>
      </section>
    </div>
  );
}

interface StatProps {
  icon: IconName;
  label: string;
  value: number;
  unit?: string;
  note: string;
}

function Stat({ icon, label, value, unit, note }: StatProps) {
  return (
    <Panel className="p-5">
      <p className="label-mono flex items-center gap-2">
        <Icon name={icon} className="text-sm" />
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-fg">
        <CountUp value={value} />
        {unit && <span className="ml-1.5 font-sans text-sm text-fg-muted">{unit}</span>}
      </p>
      <p className="text-xs text-fg-faint">{note}</p>
    </Panel>
  );
}

interface StageCardProps {
  stage: StageEntry;
  index: number;
  mastery: ReadonlyMap<string, number>;
}

function StageCard({ stage, index, mastery }: StageCardProps) {
  // The stages being built show their topics straight away; later stages open on request.
  const [open, setOpen] = useState(stage.id <= BUILD_SCOPE);
  const listId = useId();
  const total = stage.topics.length;
  const done = stage.topics.filter((t) => (mastery.get(t.id) ?? 0) >= 0.9).length;
  const status =
    stage.id <= BUILD_SCOPE ? 'In progress' : stage.optional ? 'Optional · planned' : 'Planned';
  const lead = stage.topics[0];

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Panel className="group h-full overflow-hidden">
        <div className="flex gap-4 p-5">
          {lead && (
            <Thumbnail
              topicId={lead.id}
              size={256}
              lit={stage.id <= BUILD_SCOPE ? 0.55 : 0.2}
              className="size-20 shrink-0 rounded-xl"
            />
          )}
          <div className="min-w-0">
            <p className="label-mono">
              Stage {stage.id} · {status}
            </p>
            <h3 className="mt-1 text-2xl text-fg">{stage.title}</h3>
            <p className="mt-1 text-sm text-fg-muted">{stage.tagline}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <span className="font-mono text-xs text-fg-faint tabular-nums">
            {done}/{total} mastered
            {stage.prerequisiteStages.length > 0 &&
              ` · after stage ${stage.prerequisiteStages.join(' and ')}`}
          </span>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => {
              setOpen((o) => !o);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-fg-muted hover:text-fg"
          >
            {open ? 'Hide topics' : 'Topics'}
            <Icon
              name="chevronDown"
              className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        {open && (
          <ol id={listId} className="border-t border-line px-2 py-2">
            {stage.topics.map((topic, i) => (
              <li key={topic.id}>
                <Link
                  to={`/topic/${topic.id}`}
                  className="group flex min-h-11 items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
                >
                  <span className="w-6 font-mono text-xs text-fg-faint tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Thumbnail
                    topicId={topic.id}
                    size={256}
                    lit={mastery.get(topic.id) ?? 0}
                    className="size-7 rounded-md"
                  />
                  {topic.title}
                  {availableTopics.has(topic.id) && (
                    <span className="label-mono ml-auto rounded-full border border-line-strong px-2 py-0.5 text-fg">
                      Ready
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </motion.li>
  );
}
