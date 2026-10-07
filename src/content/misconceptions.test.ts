import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { getTopic } from './curriculum';
import { misconceptions } from './misconceptions';

describe('misconception catalogue', () => {
  it.each(Object.entries(misconceptions))('%s points to a real topic and renders', (_id, m) => {
    expect(getTopic(m.topic), m.topic).toBeDefined();
    expect(m.section).toMatch(/^[a-z0-9-]+$/);
    expect(() =>
      katex.renderToString(m.faultyRule, { throwOnError: true, strict: 'error' }),
    ).not.toThrow();
    expect(m.why.length).toBeGreaterThan(20);
  });
});
