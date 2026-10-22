/**
 * Fractions as parts of a whole, and equivalent fractions: finding a missing numerator or
 * denominator, and comparing two fractions. Every number comes from the parameters below.
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

const TOPIC = 's1-fractions-equivalent';

const frac = (n: number | string, d: number | string) => `\\frac{${n}}{${d}}`;

/** A fraction in lowest terms with a numerator smaller than its denominator. */
function properFraction(rng: Rng, maxDen: number): [number, number] {
  for (;;) {
    const d = rng.int(2, maxDen);
    const n = rng.int(1, d - 1);
    if (gcdInt(n, d) === 1) return [n, d];
  }
}

/* ---------- Skill 1: a missing number ---------- */

export interface MissingParams {
  /** The fraction in lowest terms. */
  n: number;
  d: number;
  /** The given fraction is n·left / d·left; the other is n·right / d·right. */
  left: number;
  right: number;
  missing: 'numerator' | 'denominator';
}

function sampleMissing(rng: Rng, difficulty: Difficulty): MissingParams {
  const [n, d] = properFraction(rng, difficulty === 1 ? 6 : 9);
  if (difficulty === 1) return { n, d, left: 1, right: rng.int(2, 6), missing: 'numerator' };
  if (difficulty === 2) {
    const k = rng.int(2, 6);
    const down = rng.bool();
    return {
      n,
      d,
      left: down ? k : 1,
      right: down ? 1 : k,
      missing: rng.bool() ? 'numerator' : 'denominator',
    };
  }
  const left = rng.int(2, 5);
  const right = rng.intExcept(2, 6, [left]);
  return { n, d, left, right, missing: rng.bool() ? 'numerator' : 'denominator' };
}

const missingAnswer = (p: MissingParams) => (p.missing === 'numerator' ? p.n : p.d) * p.right;

const rightTex = (p: MissingParams) =>
  p.missing === 'numerator'
    ? `\\frac{\\square}{${p.d * p.right}}`
    : `\\frac{${p.n * p.right}}{\\square}`;

function buildMissing(p: MissingParams): BuiltProblem {
  const given = frac(p.n * p.left, p.d * p.left);
  const steps: SolutionStep[] = [];
  const knownWord = p.missing === 'numerator' ? 'denominator' : 'numerator';
  const known = (p.missing === 'numerator' ? p.d : p.n) * p.right;
  if (p.left > 1) {
    steps.push({
      math: `${given} = ${frac(`${p.n * p.left} \\div ${p.left}`, `${p.d * p.left} \\div ${p.left}`)} = ${frac(p.n, p.d)}`,
      reason: `${p.left} is a factor of both ${p.n * p.left} and ${p.d * p.left}. Dividing the top and the bottom by the same number gives an equivalent fraction.`,
    });
  }
  const base = frac(p.n, p.d);
  if (p.right > 1) {
    const from = p.missing === 'numerator' ? p.d : p.n;
    steps.push({
      math: `${base} = ${frac(`${p.n} \\times ${p.right}`, `${p.d} \\times ${p.right}`)} = ${frac(p.n * p.right, p.d * p.right)}`,
      reason: `The ${knownWord} ${from} has to become ${known}, which is ${from} × ${p.right}. So multiply the top and the bottom by ${p.right}.`,
    });
  }
  const answer = missingAnswer(p);
  steps.push({
    math: `\\square = ${answer}`,
    reason: `The missing ${p.missing} is ${answer}.`,
  });
  return {
    prompt: [text('Find the missing number: '), math(`${given} = ${rightTex(p)}`)],
    answer: { kind: 'number', canonical: String(answer), form: ['integer'] },
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text('Compare the two numbers you know that are in the same position, top or bottom.'),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            'Whatever the top is multiplied or divided by, the bottom must be multiplied or divided by the same number, and the other way round.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
    ],
  };
}

export const missing: Generator<MissingParams> = {
  id: `${TOPIC}/missing-number`,
  version: 1,
  topicId: TOPIC,
  title: 'Find a missing number',
  sample: sampleMissing,
  build: buildMissing,
  // Independent route: the two fractions must be equal, so cross-multiply and divide.
  solveDirectly: (p) => {
    const value = Q.of(p.n * p.left, p.d * p.left);
    return p.missing === 'numerator'
      ? value.mul(Q.of(p.d * p.right)).toLatex()
      : Q.of(p.n * p.right)
          .div(value)
          .toLatex();
  },
  misconceptions: [
    {
      id: 'add-same-to-top-and-bottom',
      produce: (p) => {
        // Adds (or takes away) the same amount on top and bottom.
        const shift =
          p.missing === 'numerator' ? p.d * p.right - p.d * p.left : p.n * p.right - p.n * p.left;
        const wrong = (p.missing === 'numerator' ? p.n * p.left : p.d * p.left) + shift;
        return wrong <= 0 || wrong === missingAnswer(p) ? null : String(wrong);
      },
      wrongSteps: (p) => {
        const top = p.missing === 'numerator';
        const [from, to] = top ? [p.d * p.left, p.d * p.right] : [p.n * p.left, p.n * p.right];
        const shift = to - from;
        const other = top ? p.n * p.left : p.d * p.left;
        const step = shift >= 0 ? `+ ${shift}` : `- ${-shift}`;
        const shifted = top
          ? frac(`${other} ${step}`, `${from} ${step}`)
          : frac(`${from} ${step}`, `${other} ${step}`);
        return [
          {
            math: `${frac(p.n * p.left, p.d * p.left)} = ${shifted}`,
            reason: `The ${top ? 'denominator' : 'numerator'} changes by ${Math.abs(shift)}, from ${from} to ${to}, so change the ${top ? 'numerator' : 'denominator'} by the same amount.`,
          },
          { math: `\\square = ${other + shift}`, reason: 'Work it out.' },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => [String(missingAnswer(p) + 1), String(missingAnswer(p) - 1)],
};

/* ---------- Skill 2: compare two fractions ---------- */

export interface CompareParams {
  a: [number, number];
  b: [number, number];
}

function sampleCompare(rng: Rng, difficulty: Difficulty): CompareParams {
  for (;;) {
    let a: [number, number];
    let b: [number, number];
    if (difficulty === 1) {
      if (rng.bool()) {
        const d = rng.int(5, 12);
        a = [rng.int(1, d - 1), d];
        b = [rng.int(1, d - 1), d];
      } else {
        const n = rng.int(1, 3);
        a = [n, rng.int(n + 1, 10)];
        b = [n, rng.int(n + 1, 10)];
      }
    } else if (difficulty === 2) {
      a = properFraction(rng, 6);
      const k = rng.int(2, 4);
      b = [rng.int(1, a[1] * k - 1), a[1] * k];
    } else {
      a = properFraction(rng, 9);
      b = properFraction(rng, 9);
      if (a[1] % b[1] === 0 || b[1] % a[1] === 0) continue;
    }
    if (gcdInt(...a) !== 1 || gcdInt(...b) !== 1) continue;
    if (Q.of(...a).eq(Q.of(...b))) continue;
    return rng.bool() ? { a, b } : { a: b, b: a };
  }
}

const larger = (p: CompareParams) => (Q.of(...p.a).cmp(Q.of(...p.b)) > 0 ? p.a : p.b);
const smaller = (p: CompareParams) => (larger(p) === p.a ? p.b : p.a);

function buildCompare(p: CompareParams): BuiltProblem {
  const [an, ad] = p.a;
  const [bn, bd] = p.b;
  const steps: SolutionStep[] = [];
  const big = larger(p);
  const small = smaller(p);
  if (ad === bd) {
    steps.push({
      math: `${frac(small[0], small[1])} < ${frac(big[0], big[1])}`,
      reason: `The denominators are the same, so the pieces are the same size. ${big[0]} ${big[0] === 1 ? 'piece is' : 'pieces are'} more than ${small[0]} ${small[0] === 1 ? 'piece' : 'pieces'}.`,
    });
  } else if (an === bn) {
    steps.push({
      math: `${frac(small[0], small[1])} < ${frac(big[0], big[1])}`,
      reason: `The numerators are the same, so compare the size of the pieces. Splitting into ${big[1]} parts makes bigger pieces than splitting into ${small[1]} parts.`,
    });
  } else {
    const common = lcmInt(ad, bd);
    const scaled = (n: number, d: number) => {
      const k = common / d;
      return k === 1
        ? { math: frac(n, d), value: n }
        : { math: `${frac(n, d)} = ${frac(n * k, common)}`, value: n * k };
    };
    const sa = scaled(an, ad);
    const sb = scaled(bn, bd);
    for (const [s, [n, d]] of [
      [sa, p.a],
      [sb, p.b],
    ] as const) {
      if (d !== common) {
        steps.push({
          math: s.math,
          reason: `Write ${n}/${d} with denominator ${common}, the lowest common multiple of ${ad} and ${bd}: multiply the top and the bottom by ${common / d}.`,
        });
      }
    }
    const [lo, hi] = sa.value < sb.value ? [sa.value, sb.value] : [sb.value, sa.value];
    steps.push({
      math: `${frac(lo, common)} < ${frac(hi, common)}`,
      reason: `Now the pieces are the same size, so compare the numerators: ${lo} is less than ${hi}.`,
    });
  }
  steps.push({
    math: frac(big[0], big[1]),
    reason: `So the larger fraction is ${big[0]}/${big[1]}.`,
  });
  return {
    prompt: [
      text('Which is larger, '),
      math(frac(an, ad)),
      text(' or '),
      math(frac(bn, bd)),
      text('? Write down the larger fraction.'),
    ],
    answer: { kind: 'number', canonical: frac(big[0], big[1]), form: [] },
    steps,
    hints: [
      {
        level: 'nudge',
        body: [text('Fractions are easy to compare when their pieces are the same size.')],
      },
      {
        level: 'method',
        body: [
          text(
            ad === bd
              ? 'With the same denominator, the bigger numerator is the bigger fraction.'
              : 'Rewrite both fractions with the same denominator, then compare the numerators.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
    ],
  };
}

export const compare: Generator<CompareParams> = {
  id: `${TOPIC}/compare`,
  version: 1,
  topicId: TOPIC,
  title: 'Compare fractions',
  sample: sampleCompare,
  build: buildCompare,
  // Independent route: cross-multiply. a/b > c/d exactly when ad > cb (all positive).
  solveDirectly: (p) => {
    const [an, ad] = p.a;
    const [bn, bd] = p.b;
    return an * bd > bn * ad ? frac(an, ad) : frac(bn, bd);
  },
  misconceptions: [
    {
      id: 'larger-denominator-larger-fraction',
      produce: (p) => {
        const [x, y] = p.a[1] > p.b[1] ? [p.a, p.b] : [p.b, p.a];
        if (x[1] === y[1]) return null;
        return x === larger(p) ? null : frac(x[0], x[1]);
      },
      wrongSteps: (p) => {
        const x = p.a[1] > p.b[1] ? p.a : p.b;
        const y = x === p.a ? p.b : p.a;
        return [
          {
            math: `${y[1]} < ${x[1]}`,
            reason:
              'Compare the denominators: the bigger bottom number is taken to mean the bigger fraction.',
          },
          { math: frac(x[0], x[1]), reason: `So ${x[0]}/${x[1]} is chosen as larger.` },
        ];
      },
    },
  ],
  equivalents: (p) => {
    const [n, d] = larger(p);
    return [frac(n * 2, d * 2)];
  },
  nearMisses: (p) => {
    const [n, d] = smaller(p);
    return [frac(n, d)];
  },
};

export const generators = [defineGenerator(missing), defineGenerator(compare)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'fe-missing': defineExample<MissingParams>(missing, {
    difficulty: 1,
    params: { n: 3, d: 4, left: 1, right: 5, missing: 'numerator' },
    fade: 'full',
  }),
  'fe-missing-wrong': defineExample<MissingParams>(missing, {
    difficulty: 1,
    params: { n: 3, d: 4, left: 1, right: 5, missing: 'numerator' },
    fade: 'full',
    misconception: 'add-same-to-top-and-bottom',
  }),
  'fe-missing-two-steps': defineExample<MissingParams>(missing, {
    difficulty: 3,
    params: { n: 2, d: 3, left: 3, right: 5, missing: 'numerator' },
    fade: 'last-1',
  }),
  'fe-compare': defineExample<CompareParams>(compare, {
    difficulty: 3,
    params: { a: [3, 4], b: [4, 5] },
    fade: 'full',
  }),
  'fe-compare-own': defineExample<CompareParams>(compare, {
    difficulty: 2,
    params: { a: [2, 3], b: [7, 12] },
    fade: 'learner',
  }),
};
