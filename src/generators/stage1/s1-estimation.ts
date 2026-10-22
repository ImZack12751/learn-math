/**
 * Estimation and sense-checking: rounding to a power of ten, to decimal places and to significant
 * figures, and estimating a calculation by rounding each number to one significant figure.
 * Rounding is done exactly on rationals (halves round up), never with floating point.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { AnswerSpec, SolutionStep } from '../../engine/types';
import { decimalString, decimalTex, math, terminates, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-estimation';

const pow10 = (k: number) => (k >= 0 ? Q.of(10n ** BigInt(k)) : Q.of(1n, 10n ** BigInt(-k)));

/** Rounds a positive rational to the nearest multiple of 10 to the power k (halves up). */
export function roundTo(q: Q, k: number): Q {
  const scaled = q.div(pow10(k));
  const whole = scaled.n / scaled.d;
  const rest = scaled.sub(Q.of(whole));
  const up = rest.cmp(Q.of(1, 2)) >= 0;
  return Q.of(up ? whole + 1n : whole).mul(pow10(k));
}

/** Cuts off (truncates) to a multiple of 10 to the power k. */
function truncateTo(q: Q, k: number): Q {
  const scaled = q.div(pow10(k));
  return Q.of(scaled.n / scaled.d).mul(pow10(k));
}

/** The power of ten of the first significant digit: 4567 → 3, 0.0456 → −2. */
export function leadingPower(q: Q): number {
  let k = 0;
  while (q.cmp(pow10(k + 1)) >= 0) k++;
  while (q.cmp(pow10(k)) < 0) k--;
  return k;
}

export const roundSf = (q: Q, sf: number) => roundTo(q, leadingPower(q) - sf + 1);

function answerFor(q: Q): AnswerSpec {
  return { kind: 'number', canonical: decimalTex(q), form: [q.isInteger ? 'integer' : 'decimal'] };
}

const COLUMNS_UP = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];
const COLUMNS_DOWN = [
  '',
  'tenths',
  'hundredths',
  'thousandths',
  'ten-thousandths',
  'hundred-thousandths',
];

/** The name of the column for 10 to the power k: "the hundreds column", "the tenths column". */
const column = (k: number) => `the ${(k >= 0 ? COLUMNS_UP[k] : COLUMNS_DOWN[-k]) ?? ''} column`;

/* ---------- Skill 1: rounding ---------- */

export interface RoundParams {
  /** The number as digits over a power of ten: 3.476 is [3476, 3]. */
  digits: number;
  places: number;
  mode: 'power' | 'dp' | 'sf';
  /** For 'power': round to 10 to the power k; for 'dp' and 'sf': how many. */
  to: number;
}

const valueOf = (p: RoundParams) => Q.of(p.digits, 10 ** p.places);

/** The rounding position as a power of ten. */
const positionOf = (p: RoundParams) =>
  p.mode === 'power' ? p.to : p.mode === 'dp' ? -p.to : leadingPower(valueOf(p)) - p.to + 1;

const rounded = (p: RoundParams) => roundTo(valueOf(p), positionOf(p));

function sampleRound(rng: Rng, difficulty: Difficulty): RoundParams {
  for (;;) {
    let p: RoundParams;
    if (difficulty === 1) {
      const to = rng.int(1, 3);
      p = { digits: rng.int(10 ** to + 1, 99999), places: 0, mode: 'power', to };
    } else if (difficulty === 2) {
      const to = rng.int(1, 3);
      p = {
        digits: rng.int(10 ** (to + 1), 10 ** (to + 3)),
        places: to + 1 + rng.int(0, 1),
        mode: 'dp',
        to,
      };
    } else {
      const to = rng.int(1, 3);
      const places = rng.pick([0, 0, 2, 4, 5]);
      p = { digits: rng.int(10 ** (to + 1), 10 ** (to + 3)), places, mode: 'sf', to };
    }
    const v = valueOf(p);
    const r = rounded(p);
    const k = positionOf(p);
    if (r.eq(v) || r.isZero) continue;
    // The last digit kept must be non-zero for decimals, so the answer shows its accuracy.
    if (k < 0 && decimalString(r).split('.')[1]?.length !== -k) continue;
    return p;
  }
}

function roundWhat(p: RoundParams): string {
  if (p.mode === 'power') return `the nearest ${10 ** p.to}`;
  if (p.mode === 'dp') return `${p.to} decimal ${p.to === 1 ? 'place' : 'places'}`;
  return `${p.to} significant ${p.to === 1 ? 'figure' : 'figures'}`;
}

/** The digit just after the rounding position. */
function decidingDigit(p: RoundParams): number {
  const k = positionOf(p);
  const shifted = valueOf(p).div(pow10(k - 1));
  return Number((shifted.n / shifted.d) % 10n);
}

export const round: Generator<RoundParams> = {
  id: `${TOPIC}/round`,
  version: 1,
  topicId: TOPIC,
  title: 'Round numbers',
  sample: sampleRound,
  build: (p) => {
    const v = valueOf(p);
    const r = rounded(p);
    const k = positionOf(p);
    const digit = decidingDigit(p);
    const where = column(k);
    const steps: SolutionStep[] = [];
    if (p.mode === 'sf') {
      steps.push({
        math: decimalTex(v),
        reason: `The first significant figure is the first non-zero digit, in ${column(k + p.to - 1)}. Keeping ${p.to} significant ${p.to === 1 ? 'figure' : 'figures'} means keeping digits up to ${where}.`,
      });
    }
    steps.push({
      math: `${decimalTex(v)} \\approx ${decimalTex(r)}`,
      reason: `Look at the digit after ${where}: it is ${digit}. ${digit >= 5 ? `${digit} is 5 or more, so round up.` : `${digit} is less than 5, so round down (keep the digit as it is).`}${k > 0 ? ' Fill the columns after it with zeros to keep the size of the number.' : ''}`,
    });
    steps.push({
      math: decimalTex(r),
      reason: `So, to ${roundWhat(p)}, the answer is ${decimalString(r)}.`,
    });
    return {
      prompt: [text('Round '), math(decimalTex(v)), text(` to ${roundWhat(p)}.`)],
      answer: answerFor(r),
      steps,
      hints: [
        {
          level: 'nudge',
          body: [
            text(
              p.mode === 'sf'
                ? 'Significant figures start at the first digit that is not zero.'
                : 'Find the last digit you are keeping, then look at the digit after it.',
            ),
          ],
        },
        {
          level: 'method',
          body: [
            text(
              'If the next digit is 5 or more, round up; if it is 4 or less, keep the digit as it is.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: whole-number arithmetic on the digits (halves round up).
  solveDirectly: (p) => {
    const k = positionOf(p);
    const divisor = 10n ** BigInt(p.places + k);
    const digits = BigInt(p.digits);
    const kept = digits / divisor + (2n * (digits % divisor) >= divisor ? 1n : 0n);
    return (k >= 0 ? Q.of(kept * 10n ** BigInt(k)) : Q.of(kept, 10n ** BigInt(-k))).toLatex();
  },
  misconceptions: [
    {
      id: 'round-truncate',
      produce: (p) => {
        const wrong = truncateTo(valueOf(p), positionOf(p));
        return wrong.eq(rounded(p)) || wrong.isZero ? null : decimalTex(wrong);
      },
    },
    {
      id: 'sf-count-leading-zeros',
      produce: (p) => {
        if (p.mode !== 'sf' || valueOf(p).cmp(Q.of(1)) >= 0) return null;
        const wrong = roundTo(valueOf(p), -p.to);
        return wrong.eq(rounded(p)) || wrong.isZero ? null : decimalTex(wrong);
      },
    },
    {
      id: 'round-drop-place-value',
      produce: (p) => {
        const k = positionOf(p);
        if (k <= 0) return null;
        const wrong = rounded(p).div(pow10(k));
        return decimalTex(wrong);
      },
      wrongSteps: (p) => {
        const k = positionOf(p);
        const wrong = rounded(p).div(pow10(k));
        return [
          {
            math: `${decimalTex(valueOf(p))} \\approx ${decimalTex(wrong)}`,
            reason: 'Round, then write only the digits that are kept.',
          },
          { math: decimalTex(wrong), reason: 'The zeros are left off.' },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const r = rounded(p);
    const step = pow10(positionOf(p));
    return [decimalTex(r.add(step)), ...(r.cmp(step) > 0 ? [decimalTex(r.sub(step))] : [])];
  },
};

/* ---------- Skill 2: estimating a calculation ---------- */

export interface EstimateParams {
  /** Each number as digits over a power of ten. */
  numbers: [number, number][];
  shape: 'times' | 'divide' | 'times-divide';
}

const numQ = ([digits, places]: [number, number]) => Q.of(digits, 10 ** places);

function sampleEstimate(rng: Rng, difficulty: Difficulty): EstimateParams {
  for (;;) {
    const shape = difficulty === 1 ? 'times' : difficulty === 2 ? 'divide' : 'times-divide';
    const count = shape === 'times-divide' ? 3 : 2;
    const numbers = Array.from({ length: count }, (): [number, number] => {
      const places = rng.pick([0, 1, 1, 2, 3]);
      return [rng.int(101, 999), places];
    });
    const r = numbers.map((n) => roundSf(numQ(n), 1));
    // A divisor must round to 1, 2, 4 or 5 times a power of ten so the estimate is exact.
    const divisor = shape === 'times' ? null : (r.at(-1) as Q);
    if (divisor) {
      const lead = divisor.div(pow10(leadingPower(divisor)));
      if (![1n, 2n, 4n, 5n].includes(lead.n) || lead.d !== 1n) continue;
    }
    const e = estimateValue({ numbers, shape });
    if (!terminates(e) || e.isZero || decimalString(e).replace(/^\d*\.?/, '').length > 3) continue;
    if (r.some((x, i) => x.eq(numQ(numbers[i] as [number, number])))) continue;
    return { numbers, shape };
  }
}

function estimateValue(p: EstimateParams): Q {
  const r = p.numbers.map((n) => roundSf(numQ(n), 1));
  const [a = Q.of(1), b = Q.of(1), c = Q.of(1)] = r;
  if (p.shape === 'times') return a.mul(b);
  if (p.shape === 'divide') return a.div(b);
  return a.mul(b).div(c);
}

const shapeTex = (xs: string[], shape: EstimateParams['shape']) =>
  shape === 'times'
    ? `${xs[0] ?? ''} \\times ${xs[1] ?? ''}`
    : shape === 'divide'
      ? `${xs[0] ?? ''} \\div ${xs[1] ?? ''}`
      : `\\frac{${xs[0] ?? ''} \\times ${xs[1] ?? ''}}{${xs[2] ?? ''}}`;

export const estimate: Generator<EstimateParams> = {
  id: `${TOPIC}/estimate`,
  version: 1,
  topicId: TOPIC,
  title: 'Estimate a calculation',
  sample: sampleEstimate,
  build: (p) => {
    const exact = p.numbers.map((n) => decimalTex(numQ(n)));
    const r = p.numbers.map((n) => roundSf(numQ(n), 1));
    const e = estimateValue(p);
    const steps: SolutionStep[] = [
      {
        math: `${shapeTex(exact, p.shape)} \\approx ${shapeTex(r.map(decimalTex), p.shape)}`,
        reason: `Round each number to 1 significant figure: ${p.numbers.map((n, i) => `${decimalString(numQ(n))} ≈ ${decimalString(r[i] as Q)}`).join(', ')}.`,
      },
    ];
    if (p.shape === 'times-divide') {
      const top = (r[0] as Q).mul(r[1] as Q);
      steps.push({
        math: `= \\frac{${decimalTex(top)}}{${decimalTex(r[2] as Q)}}`,
        reason: `Multiply the top: ${decimalString(r[0] as Q)} × ${decimalString(r[1] as Q)} = ${decimalString(top)}.`,
      });
    }
    steps.push({
      math: `= ${decimalTex(e)}`,
      reason:
        p.shape === 'times'
          ? 'Multiply the rounded numbers.'
          : (r.at(-1) as Q).cmp(Q.of(1)) < 0
            ? 'Divide. Dividing by a number less than 1 makes the answer bigger.'
            : 'Divide.',
    });
    return {
      prompt: [
        text('Estimate the value of '),
        math(shapeTex(exact, p.shape)),
        text(
          ' by rounding each number to 1 significant figure. Give the exact value of your estimate.',
        ),
      ],
      answer: answerFor(e),
      steps,
      hints: [
        { level: 'nudge', body: [text('Round first, then calculate with the rounded numbers.')] },
        {
          level: 'method',
          body: [
            text(
              'Each number keeps only its first non-zero digit, rounded, with zeros to keep its size.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: the engine evaluates the rounded calculation exactly.
  solveDirectly: (p) => estimateValue(p).toLatex(),
  misconceptions: [
    {
      id: 'dividing-always-makes-smaller',
      produce: (p) => {
        if (p.shape === 'times') return null;
        const r = p.numbers.map((n) => roundSf(numQ(n), 1));
        const divisor = r.at(-1) as Q;
        if (divisor.cmp(Q.of(1)) >= 0) return null;
        // Treats dividing by 0.5 as halving: multiplies by the divisor instead.
        const top = p.shape === 'divide' ? (r[0] as Q) : (r[0] as Q).mul(r[1] as Q);
        const wrong = top.mul(divisor);
        return wrong.eq(estimateValue(p)) ? null : decimalTex(wrong);
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const e = estimateValue(p);
    return [decimalTex(e.mul(Q.of(10))), decimalTex(e.div(Q.of(10)))];
  },
};

export const generators = [defineGenerator(round), defineGenerator(estimate)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'est-dp': defineExample<RoundParams>(round, {
    difficulty: 2,
    params: { digits: 3476, places: 3, mode: 'dp', to: 2 },
    fade: 'full',
  }),
  'est-power-wrong': defineExample<RoundParams>(round, {
    difficulty: 1,
    params: { digits: 4567, places: 0, mode: 'power', to: 2 },
    fade: 'full',
    misconception: 'round-drop-place-value',
  }),
  'est-sf': defineExample<RoundParams>(round, {
    difficulty: 3,
    params: { digits: 4567, places: 5, mode: 'sf', to: 2 },
    fade: 'last-1',
  }),
  'est-estimate': defineExample<EstimateParams>(estimate, {
    difficulty: 3,
    params: {
      numbers: [
        [487, 1],
        [321, 2],
        [512, 3],
      ],
      shape: 'times-divide',
    },
    fade: 'full',
  }),
  'est-own': defineExample<EstimateParams>(estimate, {
    difficulty: 1,
    params: {
      numbers: [
        [612, 1],
        [389, 0],
      ],
      shape: 'times',
    },
    fade: 'learner',
  }),
};
