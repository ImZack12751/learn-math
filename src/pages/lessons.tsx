import { createElement, lazy, type ComponentType, type LazyExoticComponent } from 'react';

type LessonComponent = ComponentType<{ components?: Record<string, unknown> }>;

/** Topic lessons, discovered from `src/content/topics/stageN/<topic-id>.mdx`. */
const loaders = import.meta.glob<{ default: LessonComponent }>('../content/topics/stage*/*.mdx');

/** One lazily loaded component per written lesson, created once at start-up. */
const lessons = new Map<string, LazyExoticComponent<LessonComponent>>(
  Object.entries(loaders).map(([file, load]) => [
    file.replace(/^.*\/(.+)\.mdx$/, '$1'),
    lazy(load),
  ]),
);

/** Topics whose lesson is written. A topic is available exactly when its MDX file exists. */
export const availableTopics: ReadonlySet<string> = new Set(lessons.keys());

/** Renders a topic's lesson (loaded on demand); nothing if it is not written yet. */
export function LessonView({
  topicId,
  components,
}: {
  topicId: string;
  components: Record<string, unknown>;
}) {
  const lesson = lessons.get(topicId);
  return lesson ? createElement(lesson, { components }) : null;
}
