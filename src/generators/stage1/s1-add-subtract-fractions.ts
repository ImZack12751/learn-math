/**
 * Adding and subtracting fractions: same denominators, then a common denominator found from the
 * lowest common multiple. Every number comes from the parameters below.
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

const TOPIC = 's1-add-subtract-fractions';

const frac = (n: number | string, d: number | string) => `\\frac{${n}}{${d}}`;

export interface FractionSumParams {
  a: [number, number];
  b: [number, number];
  op: '+' | '-';
}

const value = (p: FractionSumParams) => {
  const a = Q.of(...p.a);
  const b = Q.of(...p.b);
  return p.op === '+' ? a.add(b) : a.sub(b);
};

function lowest(rng: Rng, maxDen: number, den?: number): [number, number] {
  for (;;) {
    const d = den ?? rng.int(2, maxDen);
    const n = rng.int(1, d - 1);
    if (gcdInt(n, d) === 1) return [n, d];
  }
}

function sample(op: '+' | '-') {
  return (rng: Rng, difficulty: Difficulty): FractionSumParams => {
    for (;;) {
      let a: [number, number];
      let b: [number, number];
      if (difficulty === 1) {
        const d = rng.int(3, 12);
        a = lowest(rng, d, d);
        b = lowest(rng, d, d);
      } else if (difficulty === 2) {
        a = lowest(rng, 6);
        const k = rng.int(2, 4);
        b = lowest(rng, a[1] * k, a[1] * k);
        if (gcdInt(...b) !== 1) continue;
        if (rng.bool()) [a, b] = [b, a];
      } else {
        a = lowest(rng, 10);
        b = lowest(rng, 10);
        if (a[1] === b[1] || a[1] % b[1] === 0 || b[1] % a[1] === 0) continue;
      }
      const p: FractionSumParams = { a, b, op };
      const v = value(p);
      if (v.n <= 0n) continue;
      if (difficulty === 1 && a[0] === b[0]) continue;
      return p;
    }
  };
}

const OP_WORD = { '+': 'Add', '-': 'Subtract' } as const;

function build(p: FractionSumParams): BuiltProblem {
  const [an, ad] = p.a;
  const [bn, bd] = p.b;
  const question = `${frac(an, ad)} ${p.op} ${frac(bn, bd)}`;
  const common = lcmInt(ad, bd);
  const steps: SolutionStep[] = [];
  const top =
    p.op === '+'
      ? an * (common / ad) + bn * (common / bd)
      : an * (common / ad) - bn * (common / bd);
  if (ad !== bd) {
    const scaled = (n: number, d: number) => frac(n * (common / d), common);
    steps.push({
      math: `${question} = ${scaled(an, ad)} ${p.op} ${scaled(bn, bd)}`,
      reason: `The denominators are different, so the pieces are different sizes. Rewrite both with the common denominator ${common}, the lowest common multiple of ${ad} and ${bd}.`,
    });
  }
  const x = an * (common / ad);
  const y = bn * (common / bd);
  steps.push({
    math: `${steps.length === 0 ? `${question} ` : ''}= ${frac(`${x} ${p.op} ${y}`, common)}`,
    reason: `${ad === bd ? 'The denominators match, so every' : 'Now every'} piece is the same size, 1/${common} of the whole. ${OP_WORD[p.op]} the numerators and keep the denominator.`,
  });
  steps.push({
    math: `= ${frac(top, common)}`,
    reason: `${x} ${p.op === '+' ? '+' : '−'} ${y} = ${top}.`,
  });
  const v = value(p);
  if (v.d !== BigInt(common)) {
    const g = gcdInt(top, common);
    steps.push({
      math: `= ${v.toLatex()}`,
      reason: `Simplify: divide the top and the bottom by ${g}, their highest common factor.`,
    });
  }
  return {
    prompt: [
      text('Calculate '),
      math(question),
      text('. Give your answer as a fraction in its simplest form.'),
    ],
    answer: { kind: 'number', canonical: v.toLatex(), form: ['simplified-fraction'] },
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text(
            ad === bd
              ? 'The pieces are the same size already. How many pieces are there altogether?'
              : 'You can only add or subtract pieces of the same size. What denominator could both fractions use?',
          ),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            'Rewrite both fractions with a common denominator (the LCM of the denominators), then add or subtract the numerators only. Simplify at the end.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

const misconceptions = [
  {
    id: 'add-numerators-and-denominators' as const,
    produce: (p: FractionSumParams) => {
      const n = p.op === '+' ? p.a[0] + p.b[0] : p.a[0] - p.b[0];
      const d = p.op === '+' ? p.a[1] + p.b[1] : p.a[1] - p.b[1];
      if (d <= 0 || n < 0) return null;
      const wrong = Q.of(n, d);
      return wrong.eq(value(p)) ? null : wrong.toLatex();
    },
    wrongSteps: (p: FractionSumParams) => {
      const n = p.op === '+' ? p.a[0] + p.b[0] : p.a[0] - p.b[0];
      const d = p.op === '+' ? p.a[1] + p.b[1] : p.a[1] - p.b[1];
      return [
        {
          math: `${frac(p.a[0], p.a[1])} ${p.op} ${frac(p.b[0], p.b[1])} = ${frac(`${p.a[0]} ${p.op} ${p.b[0]}`, `${p.a[1]} ${p.op} ${p.b[1]}`)}`,
          reason: `${OP_WORD[p.op]} the tops, and ${p.op === '+' ? 'add' : 'subtract'} the bottoms.`,
        },
        { math: `= ${Q.of(n, d).toLatex()}`, reason: 'Work it out and simplify.' },
      ];
    },
  },
  {
    id: 'change-denominator-only' as const,
    produce: (p: FractionSumParams) => {
      if (p.a[1] === p.b[1]) return null;
      const common = lcmInt(p.a[1], p.b[1]);
      const n = p.op === '+' ? p.a[0] + p.b[0] : p.a[0] - p.b[0];
      if (n <= 0) return null;
      const wrong = Q.of(n, common);
      return wrong.eq(value(p)) ? null : wrong.toLatex();
    },
  },
];

const shared = {
  version: 1,
  topicId: TOPIC,
  build,
  // Independent route: cross-multiplying over the product of the denominators.
  solveDirectly: (p: FractionSumParams) => {
    const [an, ad] = p.a;
    const [bn, bd] = p.b;
    const top = p.op === '+' ? an * bd + bn * ad : an * bd - bn * ad;
    return Q.of(top, ad * bd).toLatex();
  },
  misconceptions,
  equivalents: (p: FractionSumParams) => {
    const v = value(p);
    return v.n > v.d && v.d > 1n ? [`${v.n / v.d}\\frac{${v.n % v.d}}{${v.d}}`] : [];
  },
  nearMisses: (p: FractionSumParams) => {
    const v = value(p);
    return [frac(String(v.n + 1n), String(v.d)), frac(String(v.n), String(v.d + 1n))];
  },
};

export const add: Generator<FractionSumParams> = {
  ...shared,
  id: `${TOPIC}/add`,
  title: 'Add fractions',
  sample: sample('+'),
};

export const subtract: Generator<FractionSumParams> = {
  ...shared,
  id: `${TOPIC}/subtract`,
  title: 'Subtract fractions',
  sample: sample('-'),
};

export const generators = [defineGenerator(add), defineGenerator(subtract)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'asf-same': defineExample<FractionSumParams>(add, {
    difficulty: 1,
    params: { a: [2, 9], b: [4, 9], op: '+' },
    fade: 'full',
  }),
  'asf-different': defineExample<FractionSumParams>(add, {
    difficulty: 3,
    params: { a: [1, 4], b: [1, 6], op: '+' },
    fade: 'full',
  }),
  'asf-wrong': defineExample<FractionSumParams>(add, {
    difficulty: 3,
    params: { a: [1, 4], b: [1, 6], op: '+' },
    fade: 'full',
    misconception: 'add-numerators-and-denominators',
  }),
  'asf-subtract': defineExample<FractionSumParams>(subtract, {
    difficulty: 2,
    params: { a: [5, 6], b: [1, 3], op: '-' },
    fade: 'last-2',
  }),
  'asf-own': defineExample<FractionSumParams>(subtract, {
    difficulty: 3,
    params: { a: [3, 4], b: [2, 5], op: '-' },
    fade: 'learner',
  }),
};
