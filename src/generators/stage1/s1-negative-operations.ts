/**
 * Operations with negative numbers: adding and subtracting, multiplying and dividing.
 * Every number in a problem, step, hint or worked example comes from the parameters below.
 */
import type { Rng } from '../../engine/rng';
import type { SolutionStep } from '../../engine/types';
import { math, signed, text, words } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-negative-operations';

const intAnswer = (n: number) => ({
  kind: 'number' as const,
  canonical: String(n),
  form: ['integer' as const],
});

/* ---------- Skill 1: adding and subtracting ---------- */

export interface AddParams {
  /** The first number, then each following term with its operation. */
  first: number;
  terms: { op: '+' | '-'; value: number }[];
}

function sampleAdd(rng: Rng, difficulty: Difficulty): AddParams {
  if (difficulty === 1) {
    // A negative and a positive, added or subtracted (no negative to subtract yet).
    const first = rng.bool() ? -rng.int(1, 12) : rng.int(1, 12);
    const value = first < 0 ? rng.int(1, 15) : rng.int(first + 1, first + 12);
    return { first, terms: [{ op: first < 0 ? '+' : '-', value }] };
  }
  if (difficulty === 2) {
    // Adding or subtracting a negative.
    return {
      first: rng.nonZero(1, 15),
      terms: [{ op: rng.pick(['+', '-'] as const), value: -rng.int(1, 15) }],
    };
  }
  return {
    first: rng.nonZero(2, 20),
    terms: [
      { op: '-', value: -rng.int(2, 20) },
      { op: rng.pick(['+', '-'] as const), value: rng.nonZero(2, 20) },
    ],
  };
}

const addQuestion = (p: AddParams) =>
  [String(p.first), ...p.terms.map((t) => `${t.op} ${signed(t.value)}`)].join(' ');

const addValue = (p: AddParams) =>
  p.terms.reduce((acc, t) => (t.op === '+' ? acc + t.value : acc - t.value), p.first);

function buildAdd(p: AddParams): BuiltProblem {
  const question = addQuestion(p);
  const steps: SolutionStep[] = [];
  // First rewrite every operation as adding or taking away a positive amount.
  const simple = p.terms.map((t) => {
    const adds = (t.op === '+') === t.value > 0;
    return { op: adds ? '+' : '-', size: Math.abs(t.value) };
  });
  const rewritten = [String(p.first), ...simple.map((t) => `${t.op} ${t.size}`)].join(' ');
  const hasNegativeTerm = p.terms.some((t) => t.value < 0);
  if (hasNegativeTerm) {
    const reasons = p.terms
      .filter((t) => t.value < 0)
      .map((t) =>
        t.op === '-'
          ? `subtracting ${words(t.value)} is the same as adding ${-t.value}`
          : `adding ${words(t.value)} is the same as subtracting ${-t.value}`,
      );
    steps.push({
      math: `${question} = ${rewritten}`,
      reason: `Rewrite each operation with a negative number: ${reasons.join(', and ')}.`,
    });
  }
  let running = p.first;
  simple.forEach((t, i) => {
    const before = running;
    running = t.op === '+' ? running + t.size : running - t.size;
    const rest = simple
      .slice(i + 1)
      .map((s) => ` ${s.op} ${s.size}`)
      .join('');
    const prefix = steps.length === 0 ? `${question} ` : '';
    steps.push({
      math: `${prefix}= ${running}${rest}`,
      reason: `Start at ${words(before)} and move ${t.size} to the ${t.op === '+' ? 'right' : 'left'}: you reach ${words(running)}.`,
    });
  });
  return {
    prompt: [text('Calculate '), math(question), text('.')],
    answer: intAnswer(addValue(p)),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [text('Think of the number line: adding moves right, subtracting moves left.')],
      },
      {
        level: 'method',
        body: [
          text(
            'Two signs next to each other can be combined: subtracting a negative is adding, and adding a negative is subtracting.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const addSubtract: Generator<AddParams> = {
  id: `${TOPIC}/add-subtract`,
  version: 1,
  topicId: TOPIC,
  title: 'Add and subtract with negatives',
  sample: sampleAdd,
  build: buildAdd,
  // Independent route: total of the gains minus total of the losses.
  solveDirectly: (p) => {
    const signedTerms = [p.first, ...p.terms.map((t) => (t.op === '+' ? t.value : -t.value))];
    const gains = signedTerms.filter((v) => v > 0).reduce((a, b) => a + b, 0);
    const losses = signedTerms.filter((v) => v < 0).reduce((a, b) => a - b, 0);
    return String(gains - losses);
  },
  misconceptions: [
    {
      id: 'subtract-negative-as-negative',
      produce: (p) => {
        if (!p.terms.some((t) => t.op === '-' && t.value < 0)) return null;
        const wrong = p.terms.reduce(
          (acc, t) =>
            t.op === '-' && t.value < 0
              ? acc + t.value
              : t.op === '+'
                ? acc + t.value
                : acc - t.value,
          p.first,
        );
        return wrong === addValue(p) ? null : String(wrong);
      },
      wrongSteps: (p) => {
        const wrong = p.terms.reduce(
          (acc, t) =>
            t.op === '-' && t.value < 0
              ? acc + t.value
              : t.op === '+'
                ? acc + t.value
                : acc - t.value,
          p.first,
        );
        const rewritten = [
          String(p.first),
          ...p.terms.map((t) =>
            t.op === '-' && t.value < 0 ? `- ${-t.value}` : `${t.op} ${signed(t.value)}`,
          ),
        ].join(' ');
        return [
          {
            math: `${addQuestion(p)} = ${rewritten}`,
            reason: 'Treat taking away a negative as taking away.',
          },
          { math: `= ${wrong}`, reason: 'Work along the number line.' },
        ];
      },
    },
  ],
  equivalents: (p) => [`\\left(${addValue(p)}\\right)`],
  nearMisses: (p) => {
    const v = addValue(p);
    return [String(v + 1), String(v - 1), ...(v === 0 ? [] : [String(-v)])];
  },
};

/* ---------- Skill 2: multiplying and dividing ---------- */

export interface MultiplyParams {
  /** Factors of a product, or [dividend, divisor] for a division. */
  values: number[];
  op: 'times' | 'divide';
}

function sampleMultiply(rng: Rng, difficulty: Difficulty): MultiplyParams {
  if (difficulty === 1) {
    const a = rng.int(2, 12);
    const b = rng.int(2, 12);
    const negatives = rng.pick([
      [true, false],
      [false, true],
      [true, true],
    ]);
    return { values: [negatives[0] ? -a : a, negatives[1] ? -b : b], op: 'times' };
  }
  if (difficulty === 2) {
    const q = rng.int(2, 12);
    const d = rng.int(2, 12);
    const [nq, nd] = rng.pick([
      [true, false],
      [false, true],
      [true, true],
    ]);
    const quotient = nq ? -q : q;
    const divisor = nd ? -d : d;
    return { values: [quotient * divisor, divisor], op: 'divide' };
  }
  // Three factors, at least one negative.
  for (;;) {
    const values = [rng.nonZero(2, 9), rng.nonZero(2, 6), rng.nonZero(2, 5)];
    if (values.some((v) => v < 0)) return { values, op: 'times' };
  }
}

const multiplyQuestion = (p: MultiplyParams) =>
  p.values.map(signed).join(p.op === 'times' ? ' \\times ' : ' \\div ');

const multiplyValue = (p: MultiplyParams) =>
  p.op === 'times' ? p.values.reduce((a, b) => a * b, 1) : (p.values[0] ?? 0) / (p.values[1] ?? 1);

function buildMultiply(p: MultiplyParams): BuiltProblem {
  const question = multiplyQuestion(p);
  const negatives = p.values.filter((v) => v < 0).length;
  const sizes = p.values.map(Math.abs);
  const sizeTex = sizes.join(p.op === 'times' ? ' \\times ' : ' \\div ');
  const negative = negatives % 2 === 1;
  const value = multiplyValue(p);
  const signReason =
    p.values.length === 2
      ? negative
        ? 'The signs are different, so the answer is negative. Work with the sizes.'
        : 'The signs are the same, so the answer is positive. Work with the sizes.'
      : `There ${negatives === 1 ? 'is 1 negative factor' : `are ${negatives} negative factors`}. Each pair of negatives makes a positive, so ${negative ? 'one minus sign is left over and the answer is negative' : 'no minus sign is left over and the answer is positive'}.`;
  const steps: SolutionStep[] = [
    {
      math: `${question} = ${negative ? `-\\left(${sizeTex}\\right)` : sizeTex}`,
      reason: signReason,
    },
    {
      math: `= ${value}`,
      reason:
        p.op === 'times'
          ? `${sizes.join(' × ')} = ${Math.abs(value)}.`
          : `${sizes[0] ?? 0} ÷ ${sizes[1] ?? 1} = ${Math.abs(value)}.`,
    },
  ];
  return {
    prompt: [text('Calculate '), math(question), text('.')],
    answer: intAnswer(value),
    steps,
    hints: [
      { level: 'nudge', body: [text('Decide the sign first, then work with the sizes.')] },
      {
        level: 'method',
        body: [
          text(
            'Same signs give a positive answer; different signs give a negative answer. This is true for dividing as well as multiplying.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const multiplyDivide: Generator<MultiplyParams> = {
  id: `${TOPIC}/multiply-divide`,
  version: 1,
  topicId: TOPIC,
  title: 'Multiply and divide with negatives',
  sample: sampleMultiply,
  build: buildMultiply,
  // Independent route: repeated addition (or repeated subtraction for a negative multiplier).
  solveDirectly: (p) => {
    const times = (a: number, b: number) => {
      let total = 0;
      for (let i = 0; i < Math.abs(b); i++) total += b > 0 ? a : -a;
      return total;
    };
    if (p.op === 'times') return String(p.values.reduce(times, 1));
    const [dividend = 0, divisor = 1] = p.values;
    let q = 0;
    while (times(divisor, q) !== dividend) q += Math.sign(dividend) * Math.sign(divisor);
    return String(q);
  },
  misconceptions: [
    {
      id: 'negative-times-negative-negative',
      produce: (p) => {
        const negatives = p.values.filter((v) => v < 0).length;
        // Any minus sign makes the answer negative; only wrong when the true answer is positive.
        if (negatives < 2 || multiplyValue(p) < 0) return null;
        return String(-multiplyValue(p));
      },
      wrongSteps: (p) => {
        const sizes = p.values.map(Math.abs).join(p.op === 'times' ? ' \\times ' : ' \\div ');
        return [
          {
            math: `${multiplyQuestion(p)} = -\\left(${sizes}\\right)`,
            reason: 'There are minus signs, so make the answer negative.',
          },
          { math: `= ${-Math.abs(multiplyValue(p))}`, reason: 'Work out the sizes.' },
        ];
      },
    },
  ],
  equivalents: (p) => [`\\left(${multiplyValue(p)}\\right)`],
  nearMisses: (p) => {
    const v = multiplyValue(p);
    return [String(v + 1), String(v - 1), String(-v)];
  },
};

export const generators = [defineGenerator(addSubtract), defineGenerator(multiplyDivide)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'neg-add': defineExample<AddParams>(addSubtract, {
    difficulty: 1,
    params: { first: -5, terms: [{ op: '+', value: 8 }] },
    fade: 'full',
  }),
  'neg-subtract-negative': defineExample<AddParams>(addSubtract, {
    difficulty: 2,
    params: { first: 3, terms: [{ op: '-', value: -4 }] },
    fade: 'full',
  }),
  'neg-wrong': defineExample<AddParams>(addSubtract, {
    difficulty: 2,
    params: { first: 3, terms: [{ op: '-', value: -4 }] },
    fade: 'full',
    misconception: 'subtract-negative-as-negative',
  }),
  'neg-multiply': defineExample<MultiplyParams>(multiplyDivide, {
    difficulty: 1,
    params: { values: [-6, -4], op: 'times' },
    fade: 'last-1',
  }),
  'neg-divide': defineExample<MultiplyParams>(multiplyDivide, {
    difficulty: 2,
    params: { values: [-36, 4], op: 'divide' },
    fade: 'learner',
  }),
};
