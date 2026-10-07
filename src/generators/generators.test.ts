/**
 * The mandatory generator suite (brief section 7): every registered generator, 1,000 seeds at
 * each difficulty. Runs in `npm run verify:content` and therefore in CI.
 */
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { getTopic } from '../content/curriculum';
import { misconceptions } from '../content/misconceptions';
import { auditGenerator } from './harness';
import { generators, registered } from './registry';

const SEEDS = 1000;

const validateLatex = (tex: string) => {
  katex.renderToString(tex, { throwOnError: true, strict: 'error' });
};

describe('generator registry', () => {
  it('has unique ids, each prefixed by its topic and living in that topic’s file', () => {
    const ids = generators.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { file, generator } of registered) {
      const topic = getTopic(generator.topicId);
      expect(topic, `${generator.id}: unknown topic ${generator.topicId}`).toBeDefined();
      expect(file).toBe(`./stage${topic?.stage ?? '?'}/${generator.topicId}.ts`);
      expect(generator.id.startsWith(`${generator.topicId}/`), generator.id).toBe(true);
    }
  });

  it('only names misconceptions that are in the catalogue', () => {
    for (const g of generators) {
      for (const m of g.misconceptions)
        expect(misconceptions, `${g.id}: ${m.id}`).toHaveProperty(m.id);
    }
  });
});

describe.each(generators.map((g) => [g.id, g] as const))('generator %s', (_id, gen) => {
  it(`passes the audit for ${SEEDS} seeds at every difficulty`, () => {
    expect(auditGenerator(gen, { seeds: SEEDS, validateLatex })).toEqual([]);
  });
});
