/**
 * Test-only generators that exercise the engine and the audit harness before real topics exist.
 * Two are written as real generators would be; three are deliberately broken so the tests can
 * prove the audit catches each kind of fault.
 */
import { ratTex, sumTex, termTex } from '../../engine/latex';
import { gcd, Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import { defineGenerator, type AnyGenerator, type Difficulty, type Generator } from '../types';

const lcm = (a: number, b: number) => (a * b) / Number(gcd(BigInt(a), BigInt(b)));

/* ---------- Adding two fractions (number, simplest form) ---------- */

interface FractionSum {
  a: number;
  b: number;
  c: number;
  d: number;
}

function sampleFractions(rng: Rng, difficulty: Difficulty): FractionSum {
  for (;;) {
    const b = rng.int(2, difficulty === 1 ? 6 : 12);
    const d = difficulty === 1 ? b * rng.int(1, 3) : rng.int(2, 12);
    const a = difficulty === 3 ? rng.nonZero(1, 11) : rng.int(1, b - 1);
    const c = difficulty === 3 ? rng.nonZero(1, 11) : rng.int(1, d - 1);
    const sum = Q.of(a, b).add(Q.of(c, d));
    // No zero sums, and no fractions that are secretly whole numbers in the question.
    if (!sum.isZero && a % b !== 0 && c % d !== 0) return { a, b, c, d };
  }
}

const frac = (n: number, d: number) => (n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`);

const addFractionsGenerator: Generator<FractionSum> = {
  id: 'fixture/add-fractions',
  version: 1,
  topicId: 's1-add-subtract-fractions',
  title: 'Add two fractions',
  sample: sampleFractions,
  build: ({ a, b, c, d }) => {
    const L = lcm(b, d);
    const A = a * (L / b);
    const C = c * (L / d);
    const sum = Q.of(A + C, L);
    const steps = [
      {
        math: `\\text{LCM}(${b}, ${d}) = ${L}`,
        reason: 'Find a common denominator: the lowest common multiple.',
      },
      {
        math: `${frac(a, b)} + ${frac(c, d)} = ${frac(A, L)} + ${frac(C, L)}`,
        reason: 'Rewrite each fraction with that denominator.',
      },
      {
        math: `= ${frac(A + C, L)}`,
        reason: 'Add the numerators; the denominator stays the same.',
      },
    ];
    if (!Q.of(A + C, L).eq(Q.of(A + C)) && gcd(BigInt(A + C), BigInt(L)) !== 1n) {
      steps.push({
        math: `= ${sum.toLatex()}`,
        reason: 'Divide top and bottom by their highest common factor.',
      });
    }
    return {
      prompt: [
        { t: 'text', v: 'Work out ' },
        { t: 'math', v: `${frac(a, b)} + ${frac(c, d)}` },
        { t: 'text', v: '. Give your answer as a fraction in its simplest form.' },
      ],
      answer: { kind: 'number', canonical: sum.toLatex(), form: ['simplified-fraction'] },
      steps,
      hints: [
        {
          level: 'nudge',
          body: [{ t: 'text', v: 'The pieces must be the same size before you can add them.' }],
        },
        {
          level: 'method',
          body: [{ t: 'text', v: 'Rewrite both fractions over a common denominator.' }],
        },
        { level: 'first-step', body: [{ t: 'math', v: `\\text{LCM}(${b}, ${d}) = ${L}` }] },
      ],
    };
  },
  solveDirectly: ({ a, b, c, d }) => Q.of(a * d + c * b, b * d).toLatex(),
  misconceptions: [
    {
      id: 'add-numerators-and-denominators',
      produce: ({ a, b, c, d }) => {
        const wrong = Q.of(a + c, b + d);
        return wrong.eq(Q.of(a, b).add(Q.of(c, d))) ? null : frac(a + c, b + d);
      },
    },
  ],
  equivalents: ({ a, b, c, d }) => {
    const sum = Q.of(a, b).add(Q.of(c, d));
    if (sum.isInteger || sum.n <= sum.d) return [];
    const whole = sum.n / sum.d;
    return sum.n > 0n ? [`${whole}\\frac{${sum.n % sum.d}}{${sum.d}}`] : [];
  },
  nearMisses: ({ a, b, c, d }) => {
    const sum = Q.of(a, b).add(Q.of(c, d));
    return [sum.add(Q.of(1, sum.d)).toLatex(), sum.neg().toLatex()];
  },
};

/* ---------- Expanding double brackets (expression, expanded form) ---------- */

interface Brackets {
  p: number;
  a: number;
  q: number;
  b: number;
}

const bracketsGenerator: Generator<Brackets> = {
  id: 'fixture/expand-brackets',
  version: 1,
  topicId: 's3-double-brackets',
  title: 'Expand double brackets',
  sample: (rng, difficulty) => ({
    p: difficulty === 3 ? rng.int(2, 5) : 1,
    a: rng.nonZero(1, difficulty === 1 ? 6 : 9),
    q: difficulty === 3 ? rng.int(1, 4) : 1,
    b: rng.nonZero(1, difficulty === 1 ? 6 : 9),
  }),
  build: ({ p, a, q, b }) => {
    const left = sumTex([termTex(p, 'x'), ratTex(a)]);
    const right = sumTex([termTex(q, 'x'), ratTex(b)]);
    const expanded = sumTex([termTex(p * q, 'x^{2}'), termTex(p * b + a * q, 'x'), ratTex(a * b)]);
    return {
      prompt: [
        { t: 'text', v: 'Expand and simplify ' },
        { t: 'math', v: `(${left})(${right})` },
        { t: 'text', v: '.' },
      ],
      answer: { kind: 'expression', canonical: expanded, form: ['expanded'] },
      steps: [
        {
          math: sumTex([
            termTex(p * q, 'x^{2}'),
            termTex(p * b, 'x'),
            termTex(a * q, 'x'),
            ratTex(a * b),
          ]),
          reason: 'Multiply each term in the first bracket by each term in the second.',
        },
        { math: `= ${expanded}`, reason: 'Collect the like terms in x.' },
      ],
      hints: [
        { level: 'nudge', body: [{ t: 'text', v: 'Every term must meet every other term once.' }] },
        {
          level: 'method',
          body: [{ t: 'text', v: 'Multiply out to four terms, then collect like terms.' }],
        },
        {
          level: 'first-step',
          body: [
            {
              t: 'math',
              v: `${termTex(p, 'x')} \\times ${termTex(q, 'x')} = ${termTex(p * q, 'x^{2}')}`,
            },
          ],
        },
      ],
    };
  },
  solveDirectly: ({ p, a, q, b }) => `(${p}x + (${a}))(${q}x + (${b}))`,
  misconceptions: [
    {
      id: 'distribute-power-over-sum',
      produce: ({ p, a, q, b }) =>
        p === q && a === b && p * b + a * q !== 0
          ? sumTex([termTex(p * q, 'x^{2}'), ratTex(a * b)])
          : null,
    },
  ],
  equivalents: ({ p, a, q, b }) => [
    sumTex([ratTex(a * b), termTex(p * b + a * q, 'x'), termTex(p * q, 'x^{2}')]),
  ],
  nearMisses: ({ p, a, q, b }) => [
    sumTex([termTex(p * q, 'x^{2}'), termTex(p * b + a * q, 'x'), ratTex(-a * b)]),
    sumTex([termTex(p * q, 'x^{2}'), termTex(p * b + a * q + 1, 'x'), ratTex(a * b)]),
  ],
};

export const workingFixtures: readonly AnyGenerator[] = [
  defineGenerator(addFractionsGenerator),
  defineGenerator(bracketsGenerator),
];

/* ---------- Deliberately broken ---------- */

/** Its "independent" answer is wrong whenever a + c is even. */
export const wrongDirectAnswer = defineGenerator<FractionSum>({
  ...addFractionsGenerator,
  id: 'fixture/broken-direct',
  solveDirectly: (params) =>
    (params.a + params.c) % 2 === 0
      ? '\\frac{1}{1000}'
      : addFractionsGenerator.solveDirectly(params),
});

/** A "misconception" that is actually the right answer. */
export const misconceptionIsCorrect = defineGenerator<FractionSum>({
  ...addFractionsGenerator,
  id: 'fixture/broken-misconception',
  misconceptions: [
    {
      id: 'add-numerators-and-denominators',
      produce: ({ a, b, c, d }) => Q.of(a, b).add(Q.of(c, d)).toLatex(),
    },
  ],
});

/** Too few distinct problems to fill a set of 20. */
export const tooFewProblems = defineGenerator<FractionSum>({
  ...addFractionsGenerator,
  id: 'fixture/broken-variety',
  sample: (rng) => ({ a: 1, b: 2, c: rng.int(1, 2), d: 3 }),
});
