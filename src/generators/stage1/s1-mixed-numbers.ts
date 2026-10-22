/**
 * Mixed numbers and improper fractions: converting both ways, and calculating with mixed numbers
 * by converting to improper fractions first. Every number comes from the parameters below.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { SolutionStep } from '../../engine/types';
import { gcdInt, lcmInt, math, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-mixed-numbers';

const frac = (n: number | bigint | string, d: number | bigint | string) => `\\frac{${n}}{${d}}`;

/** A positive rational as a mixed number when it is more than 1: `2\frac{3}{4}`, `\frac{3}{4}`, `5`. */
export function mixedTex(q: Q): string {
  if (q.isInteger || q.n < q.d) return q.toLatex();
  return `${q.n / q.d}${frac(q.n % q.d, q.d)}`;
}

/** A mixed number w a/b, with a/b proper and in lowest terms. */
export interface Mixed {
  w: number;
  a: number;
  b: number;
}

const mixedQ = (m: Mixed) => Q.of(m.w * m.b + m.a, m.b);
const mTex = (m: Mixed) => `${m.w}${frac(m.a, m.b)}`;

function sampleMixed(rng: Rng, maxWhole: number, maxDen: number): Mixed {
  for (;;) {
    const b = rng.int(2, maxDen);
    const a = rng.int(1, b - 1);
    if (gcdInt(a, b) === 1) return { w: rng.int(1, maxWhole), a, b };
  }
}

function toImproperSteps(m: Mixed, lead: boolean): SolutionStep[] {
  const top = m.w * m.b + m.a;
  return [
    {
      math: `${lead ? `${mTex(m)} ` : ''}= ${frac(`${m.w} \\times ${m.b} + ${m.a}`, m.b)}`,
      reason: `Each whole is ${m.b} ${m.b === 2 ? 'halves' : `pieces of size 1/${m.b}`}, so ${m.w} wholes are ${m.w} × ${m.b} pieces. Add the ${m.a} extra.`,
    },
    { math: `= ${frac(top, m.b)}`, reason: `${m.w} × ${m.b} + ${m.a} = ${top}.` },
  ];
}

/* ---------- Skill 1: mixed number to improper fraction ---------- */

export interface ToImproperParams {
  m: Mixed;
}

export const toImproper: Generator<ToImproperParams> = {
  id: `${TOPIC}/to-improper`,
  version: 1,
  topicId: TOPIC,
  title: 'Mixed number to improper fraction',
  sample: (rng, d) => ({ m: sampleMixed(rng, d === 1 ? 4 : d === 2 ? 9 : 15, d === 1 ? 5 : 12) }),
  build: (p) => {
    const steps = toImproperSteps(p.m, true);
    return {
      prompt: [text('Write '), math(mTex(p.m)), text(' as an improper fraction.')],
      answer: { kind: 'number', canonical: mixedQ(p.m).toLatex(), form: ['improper-fraction'] },
      steps,
      hints: [
        {
          level: 'nudge',
          body: [text('How many pieces of the size given by the denominator are in each whole?')],
        },
        {
          level: 'method',
          body: [
            text(
              'Multiply the whole number by the denominator, then add the numerator. Keep the same denominator.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: whole number plus fraction, added exactly.
  solveDirectly: (p) => Q.of(p.m.w).add(Q.of(p.m.a, p.m.b)).toLatex(),
  misconceptions: [
    {
      id: 'mixed-to-improper-add',
      produce: (p) => frac(p.m.w + p.m.a, p.m.b),
      wrongSteps: (p) => [
        {
          math: `${mTex(p.m)} = ${frac(`${p.m.w} + ${p.m.a}`, p.m.b)}`,
          reason: 'Add the whole number to the numerator.',
        },
        { math: `= ${frac(p.m.w + p.m.a, p.m.b)}`, reason: 'Add.' },
      ],
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => [frac(p.m.w * p.m.b + p.m.a + 1, p.m.b), frac(p.m.w * p.m.b - p.m.a, p.m.b)],
};

/* ---------- Skill 2: improper fraction to mixed number ---------- */

export interface ToMixedParams {
  n: number;
  d: number;
}

export const toMixed: Generator<ToMixedParams> = {
  id: `${TOPIC}/to-mixed`,
  version: 1,
  topicId: TOPIC,
  title: 'Improper fraction to mixed number',
  sample: (rng, difficulty) => {
    const m = sampleMixed(
      rng,
      difficulty === 1 ? 4 : difficulty === 2 ? 9 : 15,
      difficulty === 1 ? 5 : 12,
    );
    return { n: m.w * m.b + m.a, d: m.b };
  },
  build: (p) => {
    const w = Math.floor(p.n / p.d);
    const r = p.n % p.d;
    const steps: SolutionStep[] = [
      {
        math: `${p.n} = ${w} \\times ${p.d} + ${r}`,
        reason: `Divide ${p.n} by ${p.d}: ${p.d} goes into ${p.n} ${w} times (${w} × ${p.d} = ${w * p.d}), with ${r} left over.`,
      },
      {
        math: `${frac(p.n, p.d)} = ${w}${frac(r, p.d)}`,
        reason: `The ${w} groups of ${p.d} make ${w} wholes, and the remainder ${r} is ${r} pieces over.`,
      },
    ];
    return {
      prompt: [text('Write '), math(frac(p.n, p.d)), text(' as a mixed number.')],
      answer: { kind: 'number', canonical: `${w}${frac(r, p.d)}`, form: ['mixed-number'] },
      steps,
      hints: [
        {
          level: 'nudge',
          body: [text('How many whole lots of the denominator fit into the numerator?')],
        },
        {
          level: 'method',
          body: [
            text(
              'Divide the numerator by the denominator. The quotient is the whole number; the remainder is the new numerator.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  solveDirectly: (p) => frac(p.n, p.d),
  misconceptions: [],
  equivalents: () => [],
  nearMisses: (p) => {
    const w = Math.floor(p.n / p.d);
    const r = p.n % p.d;
    return [`${w + 1}${frac(r, p.d)}`, `${w}${frac(r, p.n)}`].filter(
      (x) => x !== `${w}${frac(r, p.d)}`,
    );
  },
};

/* ---------- Skill 3: calculating with mixed numbers ---------- */

export interface CalcParams {
  x: Mixed;
  y: Mixed;
  op: '+' | '-' | '*' | '/';
}

const OP_TEX = { '+': '+', '-': '-', '*': '\\times', '/': '\\div' } as const;

const calcValue = (p: CalcParams) => {
  const [a, b] = [mixedQ(p.x), mixedQ(p.y)];
  return p.op === '+' ? a.add(b) : p.op === '-' ? a.sub(b) : p.op === '*' ? a.mul(b) : a.div(b);
};

function sampleCalc(rng: Rng, difficulty: Difficulty): CalcParams {
  for (;;) {
    const op: CalcParams['op'] =
      difficulty === 1 ? '+' : difficulty === 2 ? '-' : rng.pick(['*', '/'] as const);
    const x = sampleMixed(rng, difficulty === 3 ? 3 : 6, difficulty === 3 ? 5 : 8);
    const y = sampleMixed(rng, difficulty === 3 ? 3 : 4, difficulty === 3 ? 5 : 8);
    const p = { x, y, op };
    const v = calcValue(p);
    if (v.n <= 0n || v.isInteger || mixedQ(x).eq(mixedQ(y))) continue;
    if (op === '+' || op === '-') {
      if (lcmInt(x.b, y.b) > 24) continue;
    }
    return p;
  }
}

function buildCalc(p: CalcParams): BuiltProblem {
  const question = `${mTex(p.x)} ${OP_TEX[p.op]} ${mTex(p.y)}`;
  const xi = mixedQ(p.x);
  const yi = mixedQ(p.y);
  const xTex = frac(xi.n, xi.d);
  const yTex = frac(yi.n, yi.d);
  const steps: SolutionStep[] = [
    {
      math: `${question} = ${xTex} ${OP_TEX[p.op]} ${yTex}`,
      reason: `Write both mixed numbers as improper fractions: ${p.x.w} × ${p.x.b} + ${p.x.a} = ${xi.n} and ${p.y.w} × ${p.y.b} + ${p.y.a} = ${yi.n}.`,
    },
  ];
  const v = calcValue(p);
  if (p.op === '+' || p.op === '-') {
    const common = lcmInt(p.x.b, p.y.b);
    const xn = Number(xi.n) * (common / p.x.b);
    const yn = Number(yi.n) * (common / p.y.b);
    if (p.x.b !== p.y.b) {
      steps.push({
        math: `= ${frac(xn, common)} ${p.op} ${frac(yn, common)}`,
        reason: `Use the common denominator ${common}, the lowest common multiple of ${p.x.b} and ${p.y.b}.`,
      });
    }
    const top = p.op === '+' ? xn + yn : xn - yn;
    steps.push({
      math: `= ${frac(top, common)}`,
      reason: `${p.op === '+' ? 'Add' : 'Subtract'} the numerators: ${xn} ${p.op === '+' ? '+' : '−'} ${yn} = ${top}.`,
    });
    if (v.d !== BigInt(common)) {
      steps.push({
        math: `= ${v.toLatex()}`,
        reason: `Simplify: divide the top and the bottom by ${gcdInt(top, common)}.`,
      });
    }
  } else {
    const second = p.op === '/' ? Q.of(1).div(yi) : yi;
    if (p.op === '/') {
      steps.push({
        math: `= ${xTex} \\times ${frac(second.n, second.d)}`,
        reason:
          'Dividing by a fraction is multiplying by its reciprocal: turn the second fraction upside down.',
      });
    }
    const top = xi.n * second.n;
    const bottom = xi.d * second.d;
    steps.push({
      math: `= ${frac(top, bottom)}`,
      reason: `Multiply the tops (${xi.n} × ${second.n} = ${top}) and the bottoms (${xi.d} × ${second.d} = ${bottom}).`,
    });
    if (v.d !== bottom) {
      steps.push({
        math: `= ${v.toLatex()}`,
        reason: `Simplify: divide the top and the bottom by ${gcdInt(Number(top), Number(bottom))}.`,
      });
    }
  }
  if (v.n > v.d) {
    steps.push({
      math: `= ${mixedTex(v)}`,
      reason: `Write the answer as a mixed number: ${v.n} ÷ ${v.d} is ${v.n / v.d} with remainder ${v.n % v.d}.`,
    });
  }
  return {
    prompt: [
      text('Calculate '),
      math(question),
      text('. Give your answer as a mixed number in its simplest form.'),
    ],
    answer: { kind: 'number', canonical: mixedTex(v), form: ['mixed-number'] },
    steps,
    hints: [
      {
        level: 'nudge',
        body: [text('Mixed numbers are easier to calculate with as improper fractions.')],
      },
      {
        level: 'method',
        body: [
          text(
            p.op === '+' || p.op === '-'
              ? 'Change both to improper fractions, use a common denominator, then add or subtract the numerators. Change back to a mixed number at the end.'
              : 'Change both to improper fractions, then multiply (or multiply by the reciprocal to divide). Change back to a mixed number at the end.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const calculate: Generator<CalcParams> = {
  id: `${TOPIC}/calculate`,
  version: 1,
  topicId: TOPIC,
  title: 'Calculate with mixed numbers',
  sample: sampleCalc,
  build: buildCalc,
  // Independent route: for + and −, whole parts and fraction parts separately; × and ÷ exactly.
  solveDirectly: (p) => {
    if (p.op === '+' || p.op === '-') {
      const wholes = p.op === '+' ? p.x.w + p.y.w : p.x.w - p.y.w;
      const parts =
        p.op === '+'
          ? Q.of(p.x.a, p.x.b).add(Q.of(p.y.a, p.y.b))
          : Q.of(p.x.a, p.x.b).sub(Q.of(p.y.a, p.y.b));
      return Q.of(wholes).add(parts).toLatex();
    }
    return calcValue(p).toLatex();
  },
  misconceptions: [
    {
      id: 'multiply-mixed-parts-separately',
      produce: (p) => {
        if (p.op !== '*') return null;
        const wrong = Q.of(p.x.w * p.y.w).add(Q.of(p.x.a * p.y.a, p.x.b * p.y.b));
        return wrong.eq(calcValue(p)) ? null : mixedTex(wrong);
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const v = calcValue(p);
    return [mixedTex(v.add(Q.of(1))), mixedTex(v.add(Q.of(1, v.d)))];
  },
};

export const generators = [
  defineGenerator(toImproper),
  defineGenerator(toMixed),
  defineGenerator(calculate),
];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'mn-improper': defineExample(toImproper, {
    difficulty: 1,
    params: { m: { w: 2, a: 3, b: 4 } },
    fade: 'full',
  }),
  'mn-improper-wrong': defineExample(toImproper, {
    difficulty: 1,
    params: { m: { w: 2, a: 3, b: 4 } },
    fade: 'full',
    misconception: 'mixed-to-improper-add',
  }),
  'mn-mixed': defineExample(toMixed, { difficulty: 2, params: { n: 23, d: 5 }, fade: 'last-1' }),
  'mn-add': defineExample<CalcParams>(calculate, {
    difficulty: 1,
    params: { x: { w: 1, a: 1, b: 2 }, y: { w: 2, a: 2, b: 3 }, op: '+' },
    fade: 'full',
  }),
  'mn-multiply': defineExample<CalcParams>(calculate, {
    difficulty: 3,
    params: { x: { w: 1, a: 1, b: 2 }, y: { w: 2, a: 1, b: 3 }, op: '*' },
    fade: 'learner',
  }),
};
