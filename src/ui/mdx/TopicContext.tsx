import { createContext, useContext } from 'react';
import type { Topic } from '../../content/curriculum';
import type { AnyGenerator, ExampleSpec } from '../../generators/types';

export interface TopicContextValue {
  topic: Topic;
  generators: readonly AnyGenerator[];
  examples: Readonly<Record<string, ExampleSpec>>;
}

export const TopicContext = createContext<TopicContextValue | null>(null);

/** The topic whose lesson is being rendered (for components inside its MDX). */
export function useTopic(): TopicContextValue {
  const value = useContext(TopicContext);
  if (!value) throw new Error('Lesson components must be rendered inside a topic page');
  return value;
}
