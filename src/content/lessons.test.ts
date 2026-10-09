/**
 * Build-time verification of every lesson (ARCHITECTURE section 9.3). Runs in
 * `npm run verify:content`; any failure fails CI.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { variablesOf, type Node } from '../engine/ast';
import { parseLatex } from '../engine/ce-adapter';
import { check } from '../engine/check';
import { sameExpression, sameNumber } from '../engine/equivalence';
import type { AnswerSpec } from '../engine/types';
import { fromParams } from '../generators/harness';
import { examplesForTopic, generatorsForTopic, getGenerator } from '../generators/registry';
import { mdxComponents } from '../ui/mdx/components';
import { getTopic, type Topic } from './curriculum';
import { glossary } from './glossary';
import { misconceptions } from './misconceptions';

const TOPICS_DIR = resolve(import.meta.dirname, 'topics');

const lessons = readdirSync(TOPICS_DIR).flatMap((stageDir) =>
  readdirSync(join(TOPICS_DIR, stageDir))
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({
      stageDir,
      id: f.replace(/\.mdx$/, ''),
      source: readFileSync(join(TOPICS_DIR, stageDir, f), 'utf8'),
    })),
);

const REQUIRED_ORDER = [
  'WhyItMatters',
  'Explanation',
  'WorkedExamples',
  'Practice',
  'Takeaways',
  'NextUp',
  'CheckYourself',
];

const attrValues = (source: string, component: string, attr: string) =>
  [...source.matchAll(new RegExp(`<${component}\\b[^>]*?\\b${attr}="([^"]*)"`, 'g'))].map(
    (m) => m[1] ?? '',
  );

function prerequisiteClosure(topic: Topic): Set<string> {
  const seen = new Set<string>();
  const visit = (id: string) => {
    for (const p of getTopic(id)?.prerequisites ?? []) {
      if (!seen.has(p)) {
        seen.add(p);
        visit(p);
      }
    }
  };
  visit(topic.id);
  return seen;
}

/** a = b = c as [a, b, c]; null if any relation is not "=". */
function equalityChain(node: Node): Node[] | null {
  if (node.k !== 'rel') return [node];
  if (node.op !== '=') return null;
  const left = equalityChain(node.left);
  const right = equalityChain(node.right);
  return left && right ? [...left, ...right] : null;
}

/** True if every side of the claim has the same value (letters stand for positive numbers). */
function claimHolds(tex: string): boolean {
  const chain = equalityChain(parseLatex(tex));
  if (!chain || chain.length < 2) return false;
  const vars = new Set(chain.flatMap((n) => [...variablesOf(n)]));
  const domain = { ranges: Object.fromEntries([...vars].map((v) => [v, [0.2, 6] as const])) };
  return chain.every((side, i) => {
    const next = chain[i + 1];
    if (!next) return true;
    return vars.size === 0 ? sameNumber(side, next) : sameExpression(side, next, domain);
  });
}

/** Prose with maths and tags removed: what the learner reads as plain text. */
function plainProse(source: string): string {
  return source
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$]*\$/g, '')
    .replace(/<[^>]*>/g, '');
}

const valueOnly = (spec: AnswerSpec, canonical: string): AnswerSpec => {
  const plain: AnswerSpec = { ...spec, canonical, form: [] };
  delete plain.accuracy;
  return plain;
};

const lastLineCandidates = (line: string) => {
  const at = line.lastIndexOf('=');
  return at >= 0 ? [line, line.slice(at + 1)] : [line];
};

it('has at least one lesson', () => {
  expect(lessons.length).toBeGreaterThan(0);
});

describe.each(lessons.map((l) => [l.id, l] as const))('lesson %s', (id, lesson) => {
  const topic = getTopic(id);
  const source = lesson.source;
  const before = topic ? prerequisiteClosure(topic) : new Set<string>();
  const allowedTopics = new Set([id, ...before]);

  it('belongs to a topic in the curriculum, in its stage folder, with generators', () => {
    expect(topic, id).toBeDefined();
    expect(lesson.stageDir).toBe(`stage${topic?.stage ?? '?'}`);
    expect(generatorsForTopic(id).length).toBeGreaterThan(0);
  });

  it('has every required section, in order', () => {
    const positions = REQUIRED_ORDER.map((name) => source.search(new RegExp(`<${name}\\b`)));
    for (const [i, name] of REQUIRED_ORDER.entries())
      expect(positions[i], `missing <${name}>`).toBeGreaterThanOrEqual(0);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('uses only lesson components', () => {
    const used = new Set([...source.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1] ?? ''));
    for (const name of used)
      expect(mdxComponents, `<${name}> is not a lesson component`).toHaveProperty(name);
  });

  it('states only true claims', () => {
    const claims = attrValues(source, 'Claim', 'tex');
    expect(claims.length).toBeGreaterThan(0);
    for (const tex of claims) expect(claimHolds(tex), `false claim: ${tex}`).toBe(true);
  });

  it('renders all of its maths', () => {
    const maths = [
      ...attrValues(source, 'Claim', 'tex'),
      ...[...source.matchAll(/\$\$([\s\S]*?)\$\$/g)].map((m) => m[1] ?? ''),
      ...[...source.replace(/\$\$[\s\S]*?\$\$/g, '').matchAll(/\$([^$]+)\$/g)].map(
        (m) => m[1] ?? '',
      ),
    ];
    for (const tex of maths) {
      expect(
        () => katex.renderToString(tex, { throwOnError: true, strict: 'error' }),
        tex,
      ).not.toThrow();
    }
  });

  it('has no caret notation in its prose', () => {
    expect(plainProse(source)).not.toContain('^');
  });

  it('uses only terms taught here or in its prerequisites', () => {
    for (const termId of attrValues(source, 'Term', 'id')) {
      const entry = (glossary as Record<string, { firstTaughtIn: string } | undefined>)[termId];
      expect(entry, `unknown term ${termId}`).toBeDefined();
      expect(
        allowedTopics.has(entry?.firstTaughtIn ?? ''),
        `${termId} is taught later, in ${entry?.firstTaughtIn ?? '?'}`,
      ).toBe(true);
    }
  });

  it('links only to its own prerequisites', () => {
    for (const p of attrValues(source, 'Prereq', 'id'))
      expect(before.has(p), `${p} is not a prerequisite`).toBe(true);
  });

  it('explains every misconception the catalogue assigns to it, at the named section', () => {
    const sections = attrValues(source, 'Section', 'id');
    expect(new Set(sections).size).toBe(sections.length);
    for (const m of attrValues(source, 'Misconception', 'id'))
      expect(misconceptions).toHaveProperty(m);
    for (const [mid, m] of Object.entries(misconceptions)) {
      if (m.topic === id) expect(sections, `${mid} links to #${m.section}`).toContain(m.section);
    }
  });

  it('shows every worked example, with the full set of fades', () => {
    const examples = examplesForTopic(id);
    const used = attrValues(source, 'WorkedExample', 'id');
    expect(new Set(used)).toEqual(new Set(Object.keys(examples)));
    const specs = Object.values(examples);
    expect(specs.some((e) => e.fade === 'full' && !e.misconception)).toBe(true);
    expect(specs.some((e) => e.fade === 'last-1' || e.fade === 'last-2')).toBe(true);
    expect(specs.some((e) => e.fade === 'learner')).toBe(true);
    expect(specs.some((e) => e.misconception)).toBe(true);
  });

  it.each(Object.entries(examplesForTopic(id)))('worked example %s is correct', (_name, spec) => {
    const gen = getGenerator(spec.generatorId);
    expect(gen, spec.generatorId).toBeDefined();
    if (!gen) return;
    const problem = fromParams(gen, spec.params, spec.difficulty, 0);
    const spec0 = problem.answer;
    expect(check(gen.solveDirectly(spec.params), valueOnly(spec0, spec0.canonical)).verdict).toBe(
      'correct',
    );
    const last = problem.steps.at(-1)?.math ?? '';
    expect(
      lastLineCandidates(last).some((c) => check(c, spec0).verdict === 'correct'),
      last,
    ).toBe(true);
    if (spec.misconception) {
      const rule = gen.misconceptions.find((m) => m.id === spec.misconception);
      const wrong = rule?.produce(spec.params);
      const steps = rule?.wrongSteps?.(spec.params);
      expect(wrong, 'the faulty rule must give a wrong answer here').toBeTruthy();
      expect(steps?.length, 'the faulty rule must show its working').toBeGreaterThan(0);
      const lastWrong = steps?.at(-1)?.math ?? '';
      const wrongSpec = valueOnly(spec0, wrong ?? '');
      expect(
        lastLineCandidates(lastWrong).some((c) => check(c, wrongSpec).verdict === 'correct'),
        lastWrong,
      ).toBe(true);
      expect(check(wrong ?? '', spec0).verdict).toBe('incorrect');
    }
  });
});
