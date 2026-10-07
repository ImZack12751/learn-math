import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { check } from '../engine/check';
import {
  misconceptionIsCorrect,
  tooFewProblems,
  workingFixtures,
  wrongDirectAnswer,
} from './__fixtures__/fixtures';
import { auditGenerator, buildSet, instantiate } from './harness';

const validateLatex = (tex: string) => {
  katex.renderToString(tex, { throwOnError: true, strict: 'error' });
};

describe('audit harness on working generators', () => {
  it.each(workingFixtures.map((g) => [g.id, g] as const))(
    '%s passes 1,000 seeds per difficulty',
    (_id, gen) => {
      expect(auditGenerator(gen, { seeds: 1000, validateLatex })).toEqual([]);
    },
  );

  it('reproduces a problem exactly from its seed', () => {
    const gen = workingFixtures[0];
    if (!gen) throw new Error('missing fixture');
    expect(instantiate(gen, 77, 2)).toEqual(instantiate(gen, 77, 2));
    expect(instantiate(gen, 77, 2).key).toBe('fixture/add-fractions@v1:2:77');
    expect(instantiate(gen, 78, 2).prompt).not.toEqual(instantiate(gen, 77, 2).prompt);
  });

  it('builds sets without repeats', () => {
    const gen = workingFixtures[1];
    if (!gen) throw new Error('missing fixture');
    const set = buildSet(gen, 5, 1, 20);
    expect(new Set(set.map((p) => JSON.stringify(p.prompt))).size).toBe(20);
  });

  it('feeds misconception answers to the checker for feedback', () => {
    const gen = workingFixtures[0];
    if (!gen) throw new Error('missing fixture');
    const problem = instantiate(gen, 3, 2);
    const wrong = problem.misconceptionAnswers[0];
    if (!wrong) throw new Error('expected a misconception answer');
    expect(check(wrong.answer, problem.answer, problem.misconceptionAnswers).misconceptionId).toBe(
      'add-numerators-and-denominators',
    );
  });
});

describe('audit harness catches broken generators', () => {
  it('flags an answer that does not match the independent computation', () => {
    const failures = auditGenerator(wrongDirectAnswer, { seeds: 50 });
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.problem).toMatch(/direct computation/);
  });

  it('flags a misconception that produces the right answer', () => {
    const failures = auditGenerator(misconceptionIsCorrect, { seeds: 20 });
    expect(failures[0]?.problem).toMatch(/gives a right value/);
  });

  it('flags a generator that cannot fill a set without repeats', () => {
    const failures = auditGenerator(tooFewProblems, { seeds: 40 });
    expect(failures.some((f) => /distinct problems/.test(f.problem))).toBe(true);
  });
});
