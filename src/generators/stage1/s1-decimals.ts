/**
 * Decimals: converting fractions to decimals and back, and adding, subtracting and multiplying
 * decimals. Values are exact rationals throughout; decimals are printed from them, never typed.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { SolutionStep } from '../../engine/types';
import { decimalString, decimalTex, gcdInt, math, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-decimals';

const frac = (n: number | bigint | string, d: number | bigint | string) => `\\frac{${n}}{${d}}`;

const decimalAnswer = (q: Q) => ({
  kind: 'number' as const,
  canonical: decimalTex(q),
  form: ['decimal' as const],
});

/** Number of decimal places in the exact decimal form. */
const places = (q: Q) => (decimalString(q).split('.')[1] ?? '').length;

/** The digits with the point removed, as an integer: 3.25 → 325. */
const digitsOf = (q: Q) =>
  Number(
    decimalString(q)
      .replace('.', '')
      .replace(/^(-?)0+(?=\d)/, '$1'),
  );

const PLACE_NAME = ['', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths'];

/* ---------- Skill 1: fraction to decimal ---------- */

export interface ToDecimalParams {
  n: number;
  d: number;
}

const DENOMINATORS: Record<Difficulty, number[]> = {
  1: [2, 4, 5, 10],
  2: [8, 20, 25, 50],
  3: [16, 40, 80, 125, 200],
};

function sampleToDecimal(rng: Rng, difficulty: Difficulty): ToDecimalParams {
  for (;;) {
    const d = rng.pick(DENOMINATORS[difficulty]);
    const n = difficulty !== 2 && rng.bool(0.4) ? rng.int(d + 1, 3 * d) : rng.int(1, d - 1);
    if (gcdInt(n, d) === 1) return { n, d };
  }
}

/** The smallest power of ten that d divides, with the multiplier. */
function toPowerOfTen(d: number): { power: number; k: number } {
  for (let power = 10; ; power *= 10) if (power % d === 0) return { power, k: power / d };
}

export const toDecimal: Generator<ToDecimalParams> = {
  id: `${TOPIC}/fraction-to-decimal`,
  version: 1,
  topicId: TOPIC,
  title: 'Fraction to decimal',
  sample: sampleToDecimal,
  build: (p) => {
    const v = Q.of(p.n, p.d);
    const { power, k } = toPowerOfTen(p.d);
    const steps: SolutionStep[] = [];
    if (k > 1) {
      steps.push({
        math: `${frac(p.n, p.d)} = ${frac(`${p.n} \\times ${k}`, `${p.d} \\times ${k}`)} = ${frac(p.n * k, power)}`,
        reason: `Make the denominator a power of ten: ${p.d} × ${k} = ${power}. Multiply the top by ${k} too.`,
      });
    }
    steps.push({
      math: `${steps.length === 0 ? `${frac(p.n, p.d)} ` : ''}= ${decimalTex(v)}`,
      reason: `${p.n * k} ${PLACE_NAME[String(power).length - 1] ?? ''} is written with its last digit in the ${PLACE_NAME[String(power).length - 1] ?? ''} column.`,
    });
    return {
      prompt: [text('Write '), math(frac(p.n, p.d)), text(' as a decimal.')],
      answer: decimalAnswer(v),
      steps,
      hints: [
        { level: 'nudge', body: [text('Decimals count tenths, hundredths and thousandths.')] },
        {
          level: 'method',
          body: [
            text(
              'Find an equivalent fraction whose denominator is 10, 100 or 1000. Then read it as a decimal.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: long division, digit by digit.
  solveDirectly: (p) => {
    const whole = Math.floor(p.n / p.d);
    let rest = p.n % p.d;
    let digits = '';
    while (rest !== 0 && digits.length < 12) {
      rest *= 10;
      digits += String(Math.floor(rest / p.d));
      rest %= p.d;
    }
    return digits === '' ? String(whole) : `${whole}.${digits}`;
  },
  misconceptions: [
    {
      id: 'fraction-digits-as-decimal',
      produce: (p) => {
        const wrong = Q.fromDecimal(`${p.n}.${p.d}`);
        return wrong.eq(Q.of(p.n, p.d)) ? null : decimalTex(wrong);
      },
      wrongSteps: (p) => [
        {
          math: `${frac(p.n, p.d)} = ${p.n}.${p.d}`,
          reason: 'Write the numerator, then a decimal point, then the denominator.',
        },
      ],
    },
  ],
  equivalents: (p) => [`${decimalString(Q.of(p.n, p.d))}0`],
  nearMisses: (p) => {
    const v = Q.of(p.n, p.d);
    return [decimalTex(v.mul(Q.of(10))), decimalTex(v.div(Q.of(10)))];
  },
};

/* ---------- Skill 2: decimal to fraction ---------- */

export interface ToFractionParams {
  /** The decimal as an exact numerator over a power of ten. */
  digits: number;
  places: number;
}

function sampleToFraction(rng: Rng, difficulty: Difficulty): ToFractionParams {
  for (;;) {
    const dp = difficulty === 1 ? 1 : difficulty === 2 ? 2 : 3;
    const max = difficulty !== 2 && rng.bool(0.4) ? 4 * 10 ** dp : 10 ** dp - 1;
    const digits = rng.int(1, max);
    if (digits % 10 === 0) continue;
    if (gcdInt(digits, 10 ** dp) === 1 && difficulty > 1 && rng.bool(0.7)) continue;
    return { digits, places: dp };
  }
}

const tfValue = (p: ToFractionParams) => Q.of(p.digits, 10 ** p.places);

export const toFraction: Generator<ToFractionParams> = {
  id: `${TOPIC}/decimal-to-fraction`,
  version: 1,
  topicId: TOPIC,
  title: 'Decimal to fraction',
  sample: sampleToFraction,
  build: (p) => {
    const v = tfValue(p);
    const power = 10 ** p.places;
    const steps: SolutionStep[] = [
      {
        math: `${decimalTex(v)} = ${frac(p.digits, power)}`,
        reason: `The last digit is in the ${PLACE_NAME[p.places] ?? ''} column, so this is ${p.digits} ${PLACE_NAME[p.places] ?? ''}.`,
      },
    ];
    if (v.d !== BigInt(power)) {
      steps.push({
        math: `= ${v.toLatex()}`,
        reason: `Simplify: divide the top and the bottom by ${gcdInt(p.digits, power)}, their highest common factor.`,
      });
    }
    return {
      prompt: [text('Write '), math(decimalTex(v)), text(' as a fraction in its simplest form.')],
      answer: { kind: 'number', canonical: v.toLatex(), form: ['simplified-fraction'] },
      steps,
      hints: [
        {
          level: 'nudge',
          body: [text('Which column is the last digit in: tenths, hundredths or thousandths?')],
        },
        {
          level: 'method',
          body: [
            text('Write the digits over 10, 100 or 1000 to match the last column, then simplify.'),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: the engine reads the decimal exactly.
  solveDirectly: (p) => Q.fromDecimal(decimalString(tfValue(p))).toLatex(),
  misconceptions: [
    {
      id: 'decimal-wrong-power-of-ten',
      produce: (p) => (p.places < 2 ? null : Q.of(p.digits, 10 ** (p.places - 1)).toLatex()),
    },
  ],
  equivalents: (p) => {
    const v = tfValue(p);
    return v.n > v.d ? [`${v.n / v.d}${frac(v.n % v.d, v.d)}`] : [];
  },
  nearMisses: (p) => {
    const v = tfValue(p);
    return [frac(v.d, v.n)].filter((x) => x !== v.toLatex());
  },
};

/* ---------- Skill 3: calculate ---------- */

export interface DecimalCalcParams {
  /** Each operand as digits and decimal places: 3.25 is [325, 2]. */
  a: [number, number];
  b: [number, number];
  op: '+' | '-' | '*';
}

const opQ = ([digits, dp]: [number, number]) => Q.of(digits, 10 ** dp);

const calcValue = (p: DecimalCalcParams) => {
  const [a, b] = [opQ(p.a), opQ(p.b)];
  return p.op === '+' ? a.add(b) : p.op === '-' ? a.sub(b) : a.mul(b);
};

function operand(rng: Rng, dp: number, max: number): [number, number] {
  for (;;) {
    const digits = rng.int(1, max * 10 ** dp);
    if (dp === 0 || digits % 10 !== 0) return [digits, dp];
  }
}

function sampleCalc(rng: Rng, difficulty: Difficulty): DecimalCalcParams {
  for (;;) {
    let p: DecimalCalcParams;
    if (difficulty === 1) {
      const dp = rng.int(1, 2);
      p = { a: operand(rng, dp, 20), b: operand(rng, dp, 20), op: rng.pick(['+', '-'] as const) };
    } else if (difficulty === 2) {
      const [x, y] = rng.shuffle([1, 2]) as [number, number];
      p = { a: operand(rng, x, 30), b: operand(rng, y, 30), op: rng.pick(['+', '-'] as const) };
    } else {
      p = { a: operand(rng, rng.int(1, 2), 9), b: operand(rng, 1, 9), op: '*' };
      if (p.a[0] < 2 || p.b[0] < 2) continue;
    }
    const v = calcValue(p);
    if (v.n <= 0n || opQ(p.a).eq(opQ(p.b))) continue;
    return p;
  }
}

const OP_TEX = { '+': '+', '-': '-', '*': '\\times' } as const;

/** A decimal written with a given number of places: 3.5 to 2 places is "3.50". */
function padded(operand: [number, number], to: number): string {
  const s = decimalString(opQ(operand));
  const have = places(opQ(operand));
  return have >= to ? s : `${s}${have === 0 ? '.' : ''}${'0'.repeat(to - have)}`;
}

function buildCalc(p: DecimalCalcParams): BuiltProblem {
  const a = opQ(p.a);
  const b = opQ(p.b);
  const question = `${decimalTex(a)} ${OP_TEX[p.op]} ${decimalTex(b)}`;
  const v = calcValue(p);
  const steps: SolutionStep[] = [];
  if (p.op === '*') {
    const ia = digitsOf(a);
    const ib = digitsOf(b);
    const total = places(a) + places(b);
    steps.push({
      math: `${ia} \\times ${ib} = ${ia * ib}`,
      reason: 'Multiply the numbers as if there were no decimal points.',
    });
    steps.push({
      math: `${question} = ${decimalTex(v)}`,
      reason: `${decimalString(a)} has ${places(a)} decimal ${places(a) === 1 ? 'place' : 'places'} and ${decimalString(b)} has ${places(b)}, so the answer has ${total} decimal places: ${ia * ib} ${PLACE_NAME[total] ?? ''}.${places(v) < total ? ' Trailing zeros after the point can be left off.' : ''}`,
    });
  } else {
    const dp = Math.max(p.a[1], p.b[1]);
    const pa = padded(p.a, dp);
    const pb = padded(p.b, dp);
    if (pa !== decimalString(a) || pb !== decimalString(b)) {
      steps.push({
        math: `${question} = ${pa} ${OP_TEX[p.op]} ${pb}`,
        reason: `Line up the decimal points. Write both numbers with ${dp} decimal places by adding zeros at the end, which does not change their value.`,
      });
    }
    steps.push({
      math: `${steps.length === 0 ? `${question} ` : ''}= ${decimalTex(v)}`,
      reason: `${p.op === '+' ? 'Add' : 'Subtract'} column by column, keeping the decimal point in line.`,
    });
  }
  return {
    prompt: [text('Calculate '), math(question), text('.')],
    answer: decimalAnswer(v),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text(
            p.op === '*'
              ? 'Multiply without the points first, then decide where the point goes.'
              : 'Line up the decimal points, not the last digits.',
          ),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            p.op === '*'
              ? 'The answer has as many decimal places as the two numbers have altogether.'
              : 'Give both numbers the same number of decimal places by writing zeros at the end, then work column by column.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const calculate: Generator<DecimalCalcParams> = {
  id: `${TOPIC}/calculate`,
  version: 1,
  topicId: TOPIC,
  title: 'Calculate with decimals',
  sample: sampleCalc,
  build: buildCalc,
  // Independent route: the engine parses the question and evaluates it exactly.
  solveDirectly: (p) => {
    const [a, b] = [opQ(p.a), opQ(p.b)];
    const scale = Q.of(1000);
    const [ia, ib] = [a.mul(scale), b.mul(scale)];
    const v =
      p.op === '+'
        ? ia.add(ib).div(scale)
        : p.op === '-'
          ? ia.sub(ib).div(scale)
          : ia.mul(ib).div(scale).div(scale);
    return v.toLatex();
  },
  misconceptions: [
    {
      id: 'decimal-add-misaligned',
      produce: (p) => {
        if (p.op === '*' || p.a[1] === p.b[1]) return null;
        // The last digits are lined up instead of the points.
        const [ia, ib] = [digitsOf(opQ(p.a)), digitsOf(opQ(p.b))];
        const raw = p.op === '+' ? ia + ib : ia - ib;
        if (raw <= 0) return null;
        const wrong = Q.of(raw, 10 ** Math.max(p.a[1], p.b[1]));
        return wrong.eq(calcValue(p)) ? null : decimalTex(wrong);
      },
    },
    {
      id: 'decimal-multiply-place',
      produce: (p) => {
        if (p.op !== '*') return null;
        const raw = digitsOf(opQ(p.a)) * digitsOf(opQ(p.b));
        const wrong = Q.of(raw, 10 ** Math.max(p.a[1], p.b[1]));
        return wrong.eq(calcValue(p)) ? null : decimalTex(wrong);
      },
      wrongSteps: (p) => {
        const [ia, ib] = [digitsOf(opQ(p.a)), digitsOf(opQ(p.b))];
        const wrong = Q.of(ia * ib, 10 ** Math.max(p.a[1], p.b[1]));
        return [
          {
            math: `${ia} \\times ${ib} = ${ia * ib}`,
            reason: 'Multiply without the decimal points.',
          },
          {
            math: `${decimalTex(opQ(p.a))} \\times ${decimalTex(opQ(p.b))} = ${decimalTex(wrong)}`,
            reason:
              'Put the point back in the same place as in the numbers, as you would when adding.',
          },
        ];
      },
    },
  ],
  equivalents: (p) => [`${decimalString(calcValue(p))}${places(calcValue(p)) > 0 ? '0' : ''}`],
  nearMisses: (p) => {
    const v = calcValue(p);
    return [decimalTex(v.mul(Q.of(10))), decimalTex(v.div(Q.of(10)))];
  },
};

export const generators = [
  defineGenerator(toDecimal),
  defineGenerator(toFraction),
  defineGenerator(calculate),
];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'dec-to-decimal': defineExample(toDecimal, {
    difficulty: 2,
    params: { n: 3, d: 8 },
    fade: 'full',
  }),
  'dec-to-decimal-wrong': defineExample(toDecimal, {
    difficulty: 2,
    params: { n: 3, d: 8 },
    fade: 'full',
    misconception: 'fraction-digits-as-decimal',
  }),
  'dec-to-fraction': defineExample(toFraction, {
    difficulty: 2,
    params: { digits: 35, places: 2 },
    fade: 'last-1',
  }),
  'dec-add': defineExample<DecimalCalcParams>(calculate, {
    difficulty: 2,
    params: { a: [35, 1], b: [125, 2], op: '+' },
    fade: 'full',
  }),
  'dec-multiply': defineExample<DecimalCalcParams>(calculate, {
    difficulty: 3,
    params: { a: [3, 1], b: [4, 1], op: '*' },
    fade: 'learner',
  }),
};
