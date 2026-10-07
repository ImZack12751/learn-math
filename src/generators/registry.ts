/**
 * Every generator, discovered from the topic files: `src/generators/stageN/<topic-id>.ts` exports
 * `generators`. Adding a topic file is all it takes to register its generators.
 */
import type { AnyGenerator } from './types';

const modules = import.meta.glob<readonly AnyGenerator[]>('./stage*/*.ts', {
  eager: true,
  import: 'generators',
});

/** Generators with the file each came from, for the consistency test. */
export const registered: readonly { file: string; generator: AnyGenerator }[] = Object.entries(
  modules,
)
  .filter(([file]) => !file.endsWith('.test.ts'))
  .flatMap(([file, generators]) => generators.map((generator) => ({ file, generator })));

export const generators: readonly AnyGenerator[] = registered.map((r) => r.generator);

const byId = new Map(generators.map((g) => [g.id, g]));

export function getGenerator(id: string): AnyGenerator | undefined {
  return byId.get(id);
}

export function generatorsForTopic(topicId: string): AnyGenerator[] {
  return generators.filter((g) => g.topicId === topicId);
}
