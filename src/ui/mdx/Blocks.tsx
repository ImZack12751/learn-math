/**
 * Lesson building blocks used in topic MDX. The lesson's sections must appear in the order of
 * CONTENT_GUIDE section 3; the content tests check it.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { getTopic, topics } from '../../content/curriculum';
import { glossary, type TermId } from '../../content/glossary';
import { misconceptions, type MisconceptionId } from '../../content/misconceptions';
import { Tex } from '../math/Tex';
import { Eyebrow } from '../primitives/Eyebrow';
import { Icon, type IconName } from '../primitives/Icon';
import { NotTrue } from '../primitives/NotTrue';
import { Panel } from '../primitives/Panel';
import { useTopic } from './TopicContext';

function LessonPart({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <Eyebrow>{label}</Eyebrow>
      <h2 id={`${id}-title`} className="mt-4 mb-6 text-[clamp(2rem,4vw,2.8rem)] text-fg">
        <span className="scrim">{title}</span>
      </h2>
      {children}
    </section>
  );
}

/** Long-form reading text on a panel, at a comfortable measure. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <Panel className="lesson-prose p-6 sm:p-8">
      <div className="measure">{children}</div>
    </Panel>
  );
}

export function WhyItMatters({ children }: { children: ReactNode }) {
  return (
    <LessonPart id="why" label="Why this matters" title="Where this leads">
      <Prose>{children}</Prose>
    </LessonPart>
  );
}

export function Explanation({ children }: { children: ReactNode }) {
  return (
    <LessonPart id="explanation" label="Explanation" title="From first principles">
      <div className="space-y-4">{children}</div>
    </LessonPart>
  );
}

/** A part of the explanation, with an anchor misconceptions and feedback can link to. */
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
      <Panel className="lesson-prose p-6 sm:p-8">
        <div className="measure">
          <h3 id={`${id}-heading`} className="mb-4 text-3xl text-fg">
            {title}
          </h3>
          {children}
        </div>
      </Panel>
    </section>
  );
}

const CALLOUT: Record<'idea' | 'note' | 'warning', { icon: IconName; label: string }> = {
  idea: { icon: 'hint', label: 'Key idea' },
  note: { icon: 'info', label: 'Note' },
  warning: { icon: 'alert', label: 'Watch out' },
};

export function Callout({
  kind = 'idea',
  children,
}: {
  kind?: 'idea' | 'note' | 'warning';
  children: ReactNode;
}) {
  const c = CALLOUT[kind];
  return (
    <aside className="my-5 rounded-xl border-l-2 border-fg bg-[color-mix(in_srgb,var(--c-fg)_5%,transparent)] px-5 py-4">
      <p className="label-mono mb-1 flex items-center gap-2">
        <Icon name={c.icon} />
        {c.label}
      </p>
      <div className="text-fg">{children}</div>
    </aside>
  );
}

/**
 * A glossary term with a hover and focus card. The card stays while hovered, closes with Escape,
 * and is announced to screen readers through aria-describedby (WCAG 1.4.13).
 */
export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const entry = glossary[id];
  const [open, setOpen] = useState(false);
  const cardId = useId();
  const closeTimer = useRef(0);
  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
    },
    [],
  );
  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
    }, 120);
  };
  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        aria-describedby={cardId}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        className="cursor-help text-fg underline decoration-line-strong decoration-dotted underline-offset-4 hover:decoration-fg"
      >
        {children ?? entry.term}
      </button>
      <span
        id={cardId}
        role="tooltip"
        className={`glass absolute top-full left-0 z-30 mt-2 w-72 rounded-xl p-4 text-left text-sm leading-relaxed shadow-xl ${open ? 'block' : 'sr-only'}`}
      >
        <span className="block font-medium text-fg">{entry.term}</span>
        <span className="mt-1 block text-fg-muted">{entry.definition}</span>
        {'example' in entry && (
          <span className="mt-2 block text-fg">
            <Tex tex={entry.example} />
          </span>
        )}
      </span>
    </span>
  );
}

/** A link back to a prerequisite topic. */
export function Prereq({ id, children }: { id: string; children?: ReactNode }) {
  const topic = getTopic(id);
  return (
    <Link
      to={`/topic/${id}`}
      className="inline-flex items-baseline gap-1 text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
    >
      <Icon name="book" className="self-center text-sm" />
      {children ?? topic?.title ?? id}
    </Link>
  );
}

/** A mathematical statement that the content tests verify with the engine. */
export function Claim({ tex, display = false }: { tex: string; display?: boolean }) {
  return (
    <Tex
      tex={tex}
      display={display}
      className={display ? 'my-4 overflow-x-auto text-fg' : 'text-fg'}
    />
  );
}

/** A catalogued misconception, explained where it is most likely to happen. */
export function Misconception({ id }: { id: MisconceptionId }) {
  const m = misconceptions[id];
  return (
    <aside className="my-5 rounded-xl border border-line-strong px-5 py-4">
      <p className="label-mono flex items-center gap-2">
        <Icon name="alert" /> Common mistake
      </p>
      <p className="mt-2 font-medium text-fg">{m.name}</p>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-fg">
        <NotTrue />
        <Tex tex={m.faultyRule} />
      </p>
      <p className="mt-2 text-fg-muted">{m.why}</p>
    </aside>
  );
}

export function Takeaways({ children }: { children: ReactNode }) {
  return (
    <LessonPart id="takeaways" label="Takeaways" title="Remember">
      <Prose>{children}</Prose>
    </LessonPart>
  );
}

/** The next topic in study order. */
export function NextUp() {
  const { topic } = useTopic();
  const at = topics.findIndex((t) => t.id === topic.id);
  const next = topics[at + 1];
  if (!next) return null;
  return (
    <Panel className="flex flex-wrap items-center justify-between gap-4 p-6">
      <div>
        <p className="label-mono">Next topic</p>
        <p className="mt-1 font-display text-2xl text-fg">{next.title}</p>
      </div>
      <Link
        to={`/topic/${next.id}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-fg hover:border-fg"
      >
        Go to the next topic <Icon name="arrowRight" />
      </Link>
    </Panel>
  );
}
