/**
 * Simplifying fractions: dividing the numerator and denominator by their highest common factor,
 * and writing one quantity as a fraction of another in its simplest form.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { SolutionStep } from '../../engine/types';
import { gcdInt, math, primeFactors, repeatedTex, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-simplifying-fractions';

const frac = (n: number | bigint | string, d: number | bigint | string) => `\\frac{${n}}{${d}}`;

const simplest = (n: number, d: number) => Q.of(n, d).toLatex();

/** Primes common to both, as many times as both have them. */
function sharedPrimes(a: number, b: number): number[] {
  const rest = primeFactors(b);
  return primeFactors(a).filter((f) => {
    const at = rest.indexOf(f);
    if (at < 0) return false;
    rest.splice(at, 1);
    return true;
  });
}

/** The working for n/d: divide by the HCF, or (difficulty 3) cancel common primes. */
function simplifySteps(n: number, d: number, byPrimes: boolean): SolutionStep[] {
  const g = gcdInt(n, d);
  if (byPrimes) {
    const shared = sharedPrimes(n, d);
    return [
      {
        math: `${frac(n, d)} = ${frac(repeatedTex(primeFactors(n)), repeatedTex(primeFactors(d)))}`,
        reason: 'Write the top and the bottom as products of primes.',
      },
      {
        math: `= ${simplest(n, d)}`,
        reason: `Cancel the common primes (${shared.join(', ')}): dividing the top and the bottom by each of them leaves an equivalent fraction with no common factor.`,
      },
    ];
  }
  return [
    {
      math: `${frac(n, d)} = ${frac(`${n} \\div ${g}`, `${d} \\div ${g}`)}`,
      reason: `The highest common factor of ${n} and ${d} is ${g}. Divide the top and the bottom by it.`,
    },
    { math: `= ${simplest(n, d)}`, reason: `${n} ÷ ${g} = ${n / g} and ${d} ÷ ${g} = ${d / g}.` },
  ];
}

const simplestAnswer = (n: number, d: number) => ({
  kind: 'number' as const,
  canonical: simplest(n, d),
  form: ['simplified-fraction' as const],
});

/* ---------- Skill 1: simplify ---------- */

export interface SimplifyParams {
  n: number;
  d: number;
}

function sampleSimplify(rng: Rng, difficulty: Difficulty): SimplifyParams {
  for (;;) {
    const top = rng.int(1, difficulty === 3 ? 14 : 9);
    const bottom = rng.int(2, difficulty === 3 ? 15 : 10);
    if (gcdInt(top, bottom) !== 1 || top === bottom || (difficulty < 3 && top > bottom)) continue;
    const k = difficulty === 1 ? rng.int(2, 5) : rng.int(4, 12);
    if (difficulty === 3 && primeFactors(k).length < 2) continue;
    return { n: top * k, d: bottom * k };
  }
}

export const simplify: Generator<SimplifyParams> = {
  id: `${TOPIC}/simplify`,
  version: 1,
  topicId: TOPIC,
  title: 'Simplify fractions',
  sample: sampleSimplify,
  build: (p, difficulty) => {
    const steps = simplifySteps(p.n, p.d, difficulty === 3);
    return {
      prompt: [
        text('Simplify '),
        math(frac(p.n, p.d)),
        text(' fully. Give your answer as a fraction in its simplest form.'),
      ],
      answer: simplestAnswer(p.n, p.d),
      steps,
      hints: [
        {
          level: 'nudge',
          body: [text('Look for a number that divides both the top and the bottom.')],
        },
        {
          level: 'method',
          body: [
            text(
              'Divide the top and the bottom by their highest common factor. If you use a smaller common factor, keep going until no common factor is left.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: Euclid's algorithm inside exact rational arithmetic.
  solveDirectly: (p) => Q.of(p.n, p.d).toLatex(),
  misconceptions: [
    {
      id: 'divide-one-part-only',
      produce: (p) => {
        const g = gcdInt(p.n, p.d);
        return frac(p.n / g, p.d);
      },
      wrongSteps: (p) => {
        const g = gcdInt(p.n, p.d);
        return [
          {
            math: `${frac(p.n, p.d)} = ${frac(`${p.n} \\div ${g}`, p.d)}`,
            reason: `Divide the numerator by ${g}, and leave the denominator as it is.`,
          },
          { math: `= ${frac(p.n / g, p.d)}`, reason: 'Divide.' },
        ];
      },
    },
  ],
  equivalents: (p) => {
    const v = Q.of(p.n, p.d);
    return v.n > v.d ? [`${v.n / v.d}\\frac{${v.n % v.d}}{${v.d}}`] : [];
  },
  nearMisses: (p) => {
    const v = Q.of(p.n, p.d);
    return [frac(v.n + 1n, v.d), frac(v.d, v.n)].filter((x) => x !== simplest(p.n, p.d));
  },
  isDegenerate: (p) => p.n % p.d === 0,
};

/* ---------- Skill 2: one quantity as a fraction of another ---------- */

interface Unit {
  part: string;
  whole: string;
  /** How many of the small unit make one of the big unit. */
  size: number;
}

const UNITS: Unit[] = [
  { part: 'minutes', whole: 'hour', size: 60 },
  { part: 'centimetres', whole: 'metre', size: 100 },
  { part: 'grams', whole: 'kilogram', size: 1000 },
  { part: 'hours', whole: 'day', size: 24 },
  { part: 'months', whole: 'year', size: 12 },
  { part: 'pence', whole: 'pound', size: 100 },
];

export interface PartParams {
  part: number;
  /** The whole, in the small unit. */
  whole: number;
  /** Index into the unit list, or −1 for bare numbers. */
  unit: number;
  /** How many of the big unit the whole is (difficulty 3), else 1. */
  bigUnits: number;
}

function samplePart(rng: Rng, difficulty: Difficulty): PartParams {
  for (;;) {
    if (difficulty === 1) {
      const whole = rng.int(6, 60);
      const part = rng.int(2, whole - 1);
      if (gcdInt(part, whole) === 1) continue;
      return { part, whole, unit: -1, bigUnits: 1 };
    }
    const unit = rng.int(0, UNITS.length - 1);
    const u = UNITS[unit] as Unit;
    const bigUnits = difficulty === 3 ? rng.int(2, 4) : 1;
    const whole = u.size * bigUnits;
    const step = u.size >= 100 ? 5 : 1;
    const part = step * rng.int(1, Math.floor(whole / step) - 1);
    if (gcdInt(part, whole) === 1 || part >= whole) continue;
    return { part, whole, unit, bigUnits };
  }
}

function partPrompt(p: PartParams) {
  if (p.unit < 0) {
    return [
      text('What fraction of '),
      math(String(p.whole)),
      text(' is '),
      math(String(p.part)),
      text('? Give your answer in its simplest form.'),
    ];
  }
  const u = UNITS[p.unit] as Unit;
  const whole = p.bigUnits === 1 ? `a ${u.whole}` : `${p.bigUnits} ${u.whole}s`;
  return [
    text(
      `Write ${p.part} ${u.part} as a fraction of ${whole}. Give your answer in its simplest form.`,
    ),
  ];
}

function buildPart(p: PartParams): BuiltProblem {
  const steps: SolutionStep[] = [];
  if (p.unit >= 0) {
    const u = UNITS[p.unit] as Unit;
    steps.push({
      math:
        p.bigUnits === 1
          ? `1 \\text{ ${u.whole}} = ${u.size} \\text{ ${u.part}}`
          : `${p.bigUnits} \\text{ ${u.whole}s} = ${p.bigUnits} \\times ${u.size} = ${p.whole} \\text{ ${u.part}}`,
      reason: `Write both amounts in the same unit, ${u.part}.`,
    });
  }
  steps.push({
    math: `\\text{fraction} = ${frac(p.part, p.whole)}`,
    reason: 'The part goes on top and the whole goes on the bottom.',
  });
  const [first, second] = simplifySteps(p.part, p.whole, false) as [SolutionStep, SolutionStep];
  steps.push(first, second);
  return {
    prompt: partPrompt(p),
    answer: simplestAnswer(p.part, p.whole),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text('A fraction of something is the part over the whole, with both in the same unit.'),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            'Write the part over the whole, then divide the top and the bottom by their highest common factor.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
    ],
  };
}

export const partOfWhole: Generator<PartParams> = {
  id: `${TOPIC}/fraction-of`,
  version: 1,
  topicId: TOPIC,
  title: 'One amount as a fraction of another',
  sample: samplePart,
  build: buildPart,
  solveDirectly: (p) => Q.of(p.part).div(Q.of(p.whole)).toLatex(),
  misconceptions: [
    {
      id: 'fraction-upside-down',
      produce: (p) => simplest(p.whole, p.part),
    },
    {
      id: 'fraction-mixed-units',
      produce: (p) => (p.bigUnits < 2 ? null : simplest(p.part, p.bigUnits)),
      wrongSteps: (p) => [
        {
          math: `\\text{fraction} = ${frac(p.part, p.bigUnits)}`,
          reason: `Put the ${p.part} on top and the ${p.bigUnits} on the bottom, without changing the units.`,
        },
        { math: `= ${simplest(p.part, p.bigUnits)}`, reason: 'Simplify.' },
      ],
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const v = Q.of(p.part, p.whole);
    return [frac(v.n + 1n, v.d)];
  },
};

export const generators = [defineGenerator(simplify), defineGenerator(partOfWhole)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'sf-simplify': defineExample(simplify, { difficulty: 1, params: { n: 18, d: 24 }, fade: 'full' }),
  'sf-primes': defineExample(simplify, {
    difficulty: 3,
    params: { n: 84, d: 126 },
    fade: 'last-1',
  }),
  'sf-wrong': defineExample(simplify, {
    difficulty: 1,
    params: { n: 18, d: 24 },
    fade: 'full',
    misconception: 'divide-one-part-only',
  }),
  'sf-minutes': defineExample(partOfWhole, {
    difficulty: 2,
    params: { part: 25, whole: 60, unit: 0, bigUnits: 1 },
    fade: 'full',
  }),
  'sf-metres': defineExample(partOfWhole, {
    difficulty: 3,
    params: { part: 45, whole: 300, unit: 1, bigUnits: 3 },
    fade: 'learner',
  }),
};
