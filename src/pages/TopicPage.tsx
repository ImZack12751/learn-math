import { Link, useParams } from 'react-router';
import { getStage, getTopic } from '../content/curriculum';
import { useProgressSummary } from '../data/progress';
import { Thumbnail } from '../ui/fractal/Thumbnail';
import { Eyebrow } from '../ui/primitives/Eyebrow';
import { Icon } from '../ui/primitives/Icon';
import { Meter } from '../ui/primitives/Meter';
import { Panel } from '../ui/primitives/Panel';
import { NotFound } from './NotFound';

/**
 * Topic page. Checkpoint (a) builds the header (section 6, item 1 of the brief); the lesson
 * sections arrive with each topic's content.
 */
export function TopicPage() {
  const { id = '' } = useParams();
  const topic = getTopic(id);
  const progress = useProgressSummary();
  if (!topic) return <NotFound />;
  const stage = getStage(topic.stage);
  const mastery = progress.mastery.get(topic.id) ?? 0;

  return (
    <article className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-8">
      <header className="grid items-center gap-8 pt-6 md:grid-cols-[minmax(0,1fr)_17rem]">
        <div>
          <Eyebrow>
            Stage {stage.id} · {stage.title} · Topic {topic.order} of {stage.topics.length}
          </Eyebrow>
          <div className="scrim mt-5">
            <h1 className=" text-[clamp(2.6rem,6vw,4.4rem)] text-fg">{topic.title}</h1>
            {topic.summary && (
              <p className="mt-4 max-w-[34ch] font-display text-[1.6rem] leading-snug text-fg-muted">
                {topic.summary}
              </p>
            )}
          </div>
        </div>
        <Thumbnail
          topicId={topic.id}
          size={512}
          lit={Math.max(mastery, 0.35)}
          className="aspect-square w-full max-w-[17rem] rounded-3xl border border-line"
        />
      </header>

      <Panel className="mt-10 grid gap-6 p-6 sm:grid-cols-3">
        <div>
          <p className="label-mono">Estimated time</p>
          <p className="mt-1 flex items-center gap-2 text-fg">
            <Icon name="clock" />
            {topic.minutes ? `${topic.minutes} minutes` : 'To be set'}
          </p>
        </div>
        <div>
          <p className="label-mono">Mastery</p>
          <div className="mt-2">
            <Meter
              value={mastery}
              label={`Mastery of ${topic.title}`}
              valueText={`${Math.round(mastery * 100)} %`}
            />
          </div>
        </div>
        <div>
          <p className="label-mono">Builds on</p>
          {topic.prerequisites.length === 0 ? (
            <p className="mt-1 text-fg-muted">Nothing: this is a starting point.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {topic.prerequisites.map((pid) => (
                <li key={pid}>
                  <Link
                    to={`/topic/${pid}`}
                    className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
                  >
                    {getTopic(pid)?.title ?? pid}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel className="mt-3 p-6">
        <p className="label-mono">Lesson</p>
        <p className="measure mt-2 text-fg-muted">
          This lesson is being written. Each lesson goes through the engine's verification before it
          appears here, so every example and answer is checked by code.
        </p>
      </Panel>
    </article>
  );
}
