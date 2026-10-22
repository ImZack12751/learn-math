/**
 * Multiplying and dividing fractions: tops times tops and bottoms times bottoms, and dividing by
 * multiplying by the reciprocal. Every number comes from the parameters below.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { SolutionStep } from '../../engine/types';
import { gcdInt, math, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-multiply-divide-fractions';

/** A fraction as [numerator, denominator]; a whole number has denominator 1. */
type F = [number, number];

export interface ProductParams {
  a: F;
  b: F;
}

/** A fraction for display: `\frac{3}{4}`, `-\frac{3}{4}`, or a whole number. */
const fTex = ([n, d]: F) =>
  d === 1 ? String(n) : `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}`;
/** In the middle of a calculation a negative fraction is bracketed. */
const fTexInner = (f: F) => (f[0] < 0 ? `\\left(${fTex(f)}\\right)` : fTex(f));
const fQ = ([n, d]: F) => Q.of(n, d);

function fraction(rng: Rng, maxDen: number): F {
  for (;;) {
    const d = rng.int(2, maxDen);
    const n = rng.int(1, d + 3);
    if (gcdInt(n, d) === 1 && n !== d) return [n, d];
  }
}

function sampleProduct(rng: Rng, difficulty: Difficulty, divide: boolean): ProductParams {
  for (;;) {
    let a = fraction(rng, difficulty === 1 ? 6 : 10);
    let b = fraction(rng, difficulty === 1 ? 6 : 10);
    if (difficulty === 1 && (a[0] > a[1] || b[0] > b[1])) continue;
    // Difficulty 2 needs something to cancel.
    if (difficulty === 2 && gcdInt(a[0], b[1]) === 1 && gcdInt(b[0], a[1]) === 1) continue;
    if (difficulty === 3) {
      if (rng.bool()) {
        const whole: F = [rng.int(2, 9), 1];
        if (rng.bool()) a = whole;
        else b = whole;
      } else {
        a = [-a[0], a[1]];
        if (rng.bool()) [a, b] = [b, a];
      }
    }
    const p = { a, b };
    const v = divide ? fQ(a).div(fQ(b)) : fQ(a).mul(fQ(b));
    if (v.isInteger && difficulty < 3) continue;
    if (fQ(a).eq(fQ(b))) continue;
    return p;
  }
}

const sizeOf = ([n, d]: F): F => [Math.abs(n), d];

/** Multiply two fractions (sizes only), writing the working; returns the steps. */
function productSteps(a: F, b: F, lead: string): SolutionStep[] {
  const [an, ad] = sizeOf(a);
  const [bn, bd] = sizeOf(b);
  const steps: SolutionStep[] = [];
  const top = an * bn;
  const bottom = ad * bd;
  steps.push({
    math: `${lead}= \\frac{${an} \\times ${bn}}{${ad} \\times ${bd}}`,
    reason: 'Multiply the numerators together and the denominators together.',
  });
  steps.push({
    math: `= \\frac{${top}}{${bottom}}`,
    reason: `${an} × ${bn} = ${top} and ${ad} × ${bd} = ${bottom}.`,
  });
  const v = Q.of(top, bottom);
  if (v.toLatex() !== `\\frac{${top}}{${bottom}}`) {
    steps.push({
      math: `= ${v.toLatex()}`,
      reason:
        bottom === 1
          ? 'A denominator of 1 means a whole number.'
          : `Simplify: divide the top and the bottom by ${gcdInt(top, bottom)}, their highest common factor.`,
    });
  }
  return steps;
}

const negative = (p: ProductParams) => p.a[0] < 0 !== p.b[0] < 0;

function signStep(question: string, p: ProductParams, op: string): SolutionStep {
  const sizes = `${fTex(sizeOf(p.a))} ${op} ${fTex(sizeOf(p.b))}`;
  return {
    math: `${question} = ${negative(p) ? `-\\left(${sizes}\\right)` : sizes}`,
    reason: negative(p)
      ? 'One of the numbers is negative, so the answer is negative. Work with the sizes.'
      : 'Work with the sizes.',
  };
}

/* ---------- Skill 1: multiply ---------- */

function buildMultiply(p: ProductParams): BuiltProblem {
  const question = `${fTexInner(p.a)} \\times ${fTexInner(p.b)}`;
  const steps: SolutionStep[] = [];
  const v = fQ(p.a).mul(fQ(p.b));
  if (negative(p)) steps.push(signStep(question, p, '\\times'));
  if (p.a[1] === 1 || p.b[1] === 1) {
    const [w, f] = p.a[1] === 1 ? [p.a, p.b] : [p.b, p.a];
    steps.push({
      math: `${steps.length === 0 ? `${question} ` : ''}= \\frac{${Math.abs(w[0])}}{1} \\times ${fTex(sizeOf(f))}`,
      reason: `A whole number is a fraction with denominator 1: ${Math.abs(w[0])} is ${Math.abs(w[0])} wholes.`,
    });
  }
  const inner = productSteps(p.a, p.b, steps.length === 0 ? `${question} ` : '');
  if (negative(p)) for (const s of inner) s.math = s.math.replace(/^= /, '= -');
  steps.push(...inner);
  return {
    prompt: [
      text('Calculate '),
      math(question),
      text('. Give your answer as a fraction in its simplest form.'),
    ],
    answer: { kind: 'number', canonical: v.toLatex(), form: ['simplified-fraction'] },
    steps,
    hints: [
      { level: 'nudge', body: [text('Multiplying fractions needs no common denominator.')] },
      {
        level: 'method',
        body: [text('Multiply the tops together and the bottoms together, then simplify.')],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const multiply: Generator<ProductParams> = {
  id: `${TOPIC}/multiply`,
  version: 1,
  topicId: TOPIC,
  title: 'Multiply fractions',
  sample: (rng, d) => sampleProduct(rng, d, false),
  build: buildMultiply,
  // Independent route: cancel common factors first, then multiply.
  solveDirectly: (p) => {
    let [an, ad] = p.a;
    let [bn, bd] = p.b;
    const g1 = gcdInt(an, bd);
    const g2 = gcdInt(bn, ad);
    [an, bd] = [an / g1, bd / g1];
    [bn, ad] = [bn / g2, ad / g2];
    return Q.of(an * bn, ad * bd).toLatex();
  },
  misconceptions: [
    {
      id: 'multiply-top-and-bottom-by-whole',
      produce: (p) => {
        if (p.a[1] !== 1 && p.b[1] !== 1) return null;
        const [w, f] = p.a[1] === 1 ? [p.a, p.b] : [p.b, p.a];
        return `\\frac{${w[0] * f[0]}}{${w[0] * f[1]}}`;
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const v = fQ(p.a).mul(fQ(p.b));
    return [Q.of(1).div(v).toLatex(), v.neg().toLatex()].filter((x) => x !== v.toLatex());
  },
};

/* ---------- Skill 2: divide ---------- */

const reciprocal = ([n, d]: F): F => (n < 0 ? [-d, -n] : [d, n]);

function buildDivide(p: ProductParams): BuiltProblem {
  const question = `${fTexInner(p.a)} \\div ${fTexInner(p.b)}`;
  const steps: SolutionStep[] = [];
  const v = fQ(p.a).div(fQ(p.b));
  if (negative(p)) steps.push(signStep(question, p, '\\div'));
  const a = sizeOf(p.a);
  const b = sizeOf(p.b);
  const flipped = reciprocal(b);
  const lead = steps.length === 0 ? `${question} ` : '';
  const neg = negative(p) ? '-' : '';
  const wrap = (s: string) => (negative(p) ? `-\\left(${s}\\right)` : s);
  steps.push({
    math: `${lead}= ${wrap(`${a[1] === 1 ? `\\frac{${a[0]}}{1}` : fTex(a)} \\times ${fTex(flipped)}`)}`,
    reason: `Dividing by ${b[1] === 1 ? b[0] : `${b[0]}/${b[1]}`} is the same as multiplying by its reciprocal, ${flipped[1] === 1 ? flipped[0] : `${flipped[0]}/${flipped[1]}`}: turn the second fraction upside down.`,
  });
  const inner = productSteps(a[1] === 1 ? [a[0], 1] : a, flipped, '');
  for (const s of inner) s.math = s.math.replace(/^= /, `= ${neg}`);
  steps.push(...inner);
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
        body: [text('Dividing by a number is the same as multiplying by its reciprocal.')],
      },
      {
        level: 'method',
        body: [
          text(
            'Keep the first fraction, change ÷ to ×, and turn the second fraction upside down. Then multiply.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const divide: Generator<ProductParams> = {
  id: `${TOPIC}/divide`,
  version: 1,
  topicId: TOPIC,
  title: 'Divide fractions',
  sample: (rng, d) => sampleProduct(rng, d, true),
  build: buildDivide,
  // Independent route: a common denominator, then divide the numerators.
  solveDirectly: (p) => {
    const [an, ad] = p.a;
    const [bn, bd] = p.b;
    return Q.of(an * bd, ad * bd)
      .div(Q.of(bn * ad, ad * bd))
      .toLatex();
  },
  misconceptions: [
    {
      id: 'divide-without-flipping',
      produce: (p) => {
        const wrong = fQ(p.a).mul(fQ(p.b));
        return wrong.eq(fQ(p.a).div(fQ(p.b))) ? null : wrong.toLatex();
      },
    },
    {
      id: 'flip-first-fraction',
      produce: (p) => {
        const wrong = Q.of(1).div(fQ(p.a)).mul(fQ(p.b));
        return wrong.eq(fQ(p.a).div(fQ(p.b))) ? null : wrong.toLatex();
      },
      wrongSteps: (p) => {
        const flipped = reciprocal(p.a);
        const wrong = Q.of(1).div(fQ(p.a)).mul(fQ(p.b));
        return [
          {
            math: `${fTexInner(p.a)} \\div ${fTexInner(p.b)} = ${fTexInner(flipped)} \\times ${fTexInner(p.b)}`,
            reason: 'Turn the first fraction upside down and multiply.',
          },
          { math: `= ${wrong.toLatex()}`, reason: 'Multiply and simplify.' },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const v = fQ(p.a).div(fQ(p.b));
    return [v.neg().toLatex(), v.add(Q.of(1)).toLatex()];
  },
};

export const generators = [defineGenerator(multiply), defineGenerator(divide)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'mdf-multiply': defineExample<ProductParams>(multiply, {
    difficulty: 1,
    params: { a: [2, 3], b: [4, 5] },
    fade: 'full',
  }),
  'mdf-whole': defineExample<ProductParams>(multiply, {
    difficulty: 3,
    params: { a: [3, 1], b: [2, 5] },
    fade: 'last-1',
  }),
  'mdf-divide': defineExample<ProductParams>(divide, {
    difficulty: 2,
    params: { a: [3, 4], b: [9, 10] },
    fade: 'full',
  }),
  'mdf-wrong': defineExample<ProductParams>(divide, {
    difficulty: 2,
    params: { a: [3, 4], b: [9, 10] },
    fade: 'full',
    misconception: 'flip-first-fraction',
  }),
  'mdf-own': defineExample<ProductParams>(divide, {
    difficulty: 1,
    params: { a: [2, 5], b: [3, 4] },
    fade: 'learner',
  }),
};
