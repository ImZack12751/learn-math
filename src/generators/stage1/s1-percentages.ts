/**
 * Percentages: a percentage of an amount, one amount as a percentage of another, percentage
 * increase and decrease with multipliers, and reverse percentages. All values are exact rationals.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { AnswerSpec, SolutionStep } from '../../engine/types';
import { decimalTex, decimalWords, math, terminates, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-percentages';

/** A whole number or a terminating decimal, as the answer. */
function exactAnswer(q: Q): AnswerSpec {
  return { kind: 'number', canonical: decimalTex(q), form: [q.isInteger ? 'integer' : 'decimal'] };
}

const pct = (p: Q) => `${decimalTex(p)}\\%`;
const pctWords = (p: Q) => `${decimalWords(p)}%`;
/** An amount of money in running text: £72, £86.40. */
const money = (q: Q) => {
  if (q.isInteger) return `£${q.toString()}`;
  const [whole, pence = ''] = decimalWords(q).split('.');
  return `£${whole ?? ''}.${pence.padEnd(2, '0')}`;
};

/* ---------- Skill 1: a percentage of an amount ---------- */

export interface OfParams {
  /** The percentage, possibly a decimal such as 17.5. */
  p: [number, number];
  amount: number;
}

const pQ = (p: [number, number]) => Q.of(...p);

function sampleOf(rng: Rng, difficulty: Difficulty): OfParams {
  for (;;) {
    let p: [number, number];
    let amount: number;
    if (difficulty === 1) {
      p = [rng.pick([10, 20, 25, 50, 75]), 1];
      amount = 4 * rng.int(2, 50);
    } else if (difficulty === 2) {
      p = [rng.pick([5, 15, 30, 35, 40, 45, 60, 65, 80, 85, 12, 8]), 1];
      amount = rng.int(2, 60) * 5;
    } else {
      p = rng.pick<[number, number]>([
        [35, 2],
        [5, 2],
        [125, 2],
        [120, 1],
        [135, 1],
        [3, 1],
        [175, 1],
      ]);
      amount = rng.int(4, 80) * 2;
    }
    const v = pQ(p).mul(Q.of(amount)).div(Q.of(100));
    if (!terminates(v) || (difficulty === 1 && !v.isInteger)) continue;
    if (v.d > 100n) continue;
    return { p, amount };
  }
}

const ofValue = (p: OfParams) => pQ(p.p).mul(Q.of(p.amount)).div(Q.of(100));

function buildOf(p: OfParams): BuiltProblem {
  const percent = pQ(p.p);
  const v = ofValue(p);
  const multiplier = percent.div(Q.of(100));
  const steps: SolutionStep[] = [
    {
      math: `${pct(percent)} = ${decimalTex(multiplier)}`,
      reason: `Per cent means out of 100: ${pctWords(percent)} is ${decimalWords(percent)} hundredths, which is ${decimalWords(multiplier)}.`,
    },
    {
      math: `${decimalTex(multiplier)} \\times ${p.amount} = ${decimalTex(v)}`,
      reason: '"Of" means multiply.',
    },
  ];
  return {
    prompt: [text(`Find ${pctWords(percent)} of ${p.amount}.`)],
    answer: exactAnswer(v),
    steps,
    hints: [
      { level: 'nudge', body: [text('A percentage is a number of hundredths.')] },
      {
        level: 'method',
        body: [
          text(
            'Write the percentage as a decimal (divide by 100), then multiply by the amount. Or find 1% or 10% first and build up.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
    ],
  };
}

export const percentOf: Generator<OfParams> = {
  id: `${TOPIC}/percentage-of`,
  version: 1,
  topicId: TOPIC,
  title: 'Percentage of an amount',
  sample: sampleOf,
  build: buildOf,
  // Independent route: find 1% first, then scale up.
  solveDirectly: (p) => Q.of(p.amount).div(Q.of(100)).mul(pQ(p.p)).toLatex(),
  misconceptions: [
    {
      id: 'percentage-as-number',
      produce: (p) => decimalTex(pQ(p.p).mul(Q.of(p.amount))),
      wrongSteps: (p) => [
        {
          math: `${decimalTex(pQ(p.p))} \\times ${p.amount} = ${decimalTex(pQ(p.p).mul(Q.of(p.amount)))}`,
          reason: 'Multiply the amount by the percentage number.',
        },
      ],
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const v = ofValue(p);
    return [decimalTex(v.mul(Q.of(10))), decimalTex(Q.of(p.amount).sub(v))].filter(
      (x) => x !== decimalTex(v),
    );
  },
};

/* ---------- Skill 2: one amount as a percentage of another ---------- */

export interface AsPercentParams {
  part: number;
  whole: number;
}

function sampleAsPercent(rng: Rng, difficulty: Difficulty): AsPercentParams {
  for (;;) {
    const whole =
      difficulty === 1
        ? rng.pick([10, 20, 25, 50, 100])
        : difficulty === 2
          ? rng.pick([40, 80, 200, 250, 400, 500, 30, 60])
          : rng.int(12, 400);
    const part = rng.int(1, difficulty === 3 ? Math.floor(whole * 1.5) : whole - 1);
    const v = Q.of(part * 100, whole);
    if (!terminates(v) || v.d > (difficulty === 3 ? 10n : 1n) || part === whole) continue;
    return { part, whole };
  }
}

const asValue = (p: AsPercentParams) => Q.of(p.part * 100, p.whole);

export const asPercentage: Generator<AsPercentParams> = {
  id: `${TOPIC}/as-percentage`,
  version: 1,
  topicId: TOPIC,
  title: 'One amount as a percentage of another',
  sample: sampleAsPercent,
  build: (p) => {
    const v = asValue(p);
    const steps: SolutionStep[] = [
      {
        math: `\\frac{${p.part}}{${p.whole}} \\times 100 = ${decimalTex(v)}`,
        reason: `Write ${p.part} as a fraction of ${p.whole}, then multiply by 100 to count hundredths.`,
      },
    ];
    return {
      prompt: [
        text('Fill in the missing number: '),
        math(`${p.part} \\text{ is } \\square \\% \\text{ of } ${p.whole}`),
        text('.'),
      ],
      answer: exactAnswer(v),
      steps,
      hints: [
        { level: 'nudge', body: [text('What fraction of the whole is the part?')] },
        { level: 'method', body: [text('Write the part over the whole, then multiply by 100.')] },
        { level: 'first-step', body: [math(`\\frac{${p.part}}{${p.whole}} \\times 100`)] },
      ],
    };
  },
  // Independent route: scale the fraction to a denominator of 100.
  solveDirectly: (p) => Q.of(p.part).div(Q.of(p.whole)).mul(Q.of(100)).toLatex(),
  misconceptions: [
    {
      id: 'fraction-upside-down',
      produce: (p) => Q.of(p.whole * 100, p.part).toLatex(),
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => [decimalTex(asValue(p).div(Q.of(100))), decimalTex(asValue(p).add(Q.of(1)))],
};

/* ---------- Skill 3: increase and decrease ---------- */

export interface ChangeParams {
  amount: number;
  p: number;
  up: boolean;
}

function sampleChange(rng: Rng, difficulty: Difficulty): ChangeParams {
  for (;;) {
    const p =
      difficulty === 1
        ? rng.pick([10, 20, 25, 50])
        : difficulty === 2
          ? rng.pick([5, 15, 30, 35, 40, 12, 8])
          : rng.pick([3, 7, 13, 17, 22, 35, 45, 65]);
    const amount =
      difficulty === 1
        ? 10 * rng.int(2, 30)
        : difficulty === 2
          ? 5 * rng.int(4, 80)
          : rng.int(20, 500);
    const up = rng.bool();
    const v = changeValue({ amount, p, up });
    if (!terminates(v) || v.d > 100n || (difficulty === 1 && !v.isInteger)) continue;
    return { amount, p, up };
  }
}

const multiplierOf = (p: { p: number; up: boolean }) => Q.of(100 + (p.up ? p.p : -p.p), 100);
function changeValue(p: ChangeParams): Q {
  return Q.of(p.amount).mul(multiplierOf(p));
}

export const change: Generator<ChangeParams> = {
  id: `${TOPIC}/increase-decrease`,
  version: 1,
  topicId: TOPIC,
  title: 'Percentage increase and decrease',
  sample: sampleChange,
  build: (p) => {
    const m = multiplierOf(p);
    const v = changeValue(p);
    const steps: SolutionStep[] = [
      {
        math: `${p.up ? `100\\% + ${p.p}\\%` : `100\\% - ${p.p}\\%`} = ${100 + (p.up ? p.p : -p.p)}\\% = ${decimalTex(m)}`,
        reason: `The new amount is the whole of the old amount ${p.up ? 'plus' : 'minus'} ${p.p}% of it: ${100 + (p.up ? p.p : -p.p)}% of the original. As a decimal, that is the multiplier ${decimalWords(m)}.`,
      },
      {
        math: `${p.amount} \\times ${decimalTex(m)} = ${decimalTex(v)}`,
        reason: 'Multiply the original amount by the multiplier.',
      },
    ];
    return {
      prompt: [text(`${p.up ? 'Increase' : 'Decrease'} ${p.amount} by ${p.p}%.`)],
      answer: exactAnswer(v),
      steps,
      hints: [
        {
          level: 'nudge',
          body: [
            text(
              `After the change, what percentage of the original is left${p.up ? ', counting the extra' : ''}?`,
            ),
          ],
        },
        {
          level: 'method',
          body: [
            text(
              `Use a multiplier: ${p.up ? 'add' : 'subtract'} the percentage to or from 100%, write it as a decimal, and multiply.`,
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: find the change, then add or subtract it.
  solveDirectly: (p) => {
    const delta = Q.of(p.amount * p.p, 100);
    return (p.up ? Q.of(p.amount).add(delta) : Q.of(p.amount).sub(delta)).toLatex();
  },
  misconceptions: [
    {
      id: 'percent-change-add-percent',
      produce: (p) => {
        const wrong = Q.of(p.amount + (p.up ? p.p : -p.p));
        return wrong.eq(changeValue(p)) ? null : decimalTex(wrong);
      },
      wrongSteps: (p) => [
        {
          math: `${p.amount} ${p.up ? '+' : '-'} ${p.p} = ${p.amount + (p.up ? p.p : -p.p)}`,
          reason: `${p.up ? 'Add' : 'Subtract'} the percentage number to the amount.`,
        },
      ],
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const delta = Q.of(p.amount * p.p, 100);
    const wrong = [delta, p.up ? Q.of(p.amount).sub(delta) : Q.of(p.amount).add(delta)];
    return wrong.filter((w) => !w.eq(changeValue(p))).map(decimalTex);
  },
};

/* ---------- Skill 4: reverse percentages ---------- */

export interface ReverseParams {
  original: number;
  p: number;
  up: boolean;
}

function sampleReverse(rng: Rng, difficulty: Difficulty): ReverseParams {
  for (;;) {
    const p =
      difficulty === 1
        ? rng.pick([10, 20, 25, 50])
        : difficulty === 2
          ? rng.pick([5, 15, 30, 40, 12])
          : rng.pick([8, 15, 35]);
    const original = difficulty === 3 ? rng.int(10, 400) : 10 * rng.int(2, 40);
    const up = difficulty === 1 ? true : rng.bool();
    const now = Q.of(original).mul(multiplierOf({ p, up }));
    if (!terminates(now) || now.d > 100n) continue;
    return { original, p, up };
  }
}

const nowOf = (p: ReverseParams) => Q.of(p.original).mul(multiplierOf(p));

export const reverse: Generator<ReverseParams> = {
  id: `${TOPIC}/reverse`,
  version: 1,
  topicId: TOPIC,
  title: 'Reverse percentages',
  sample: sampleReverse,
  build: (p) => {
    const m = multiplierOf(p);
    const now = nowOf(p);
    const steps: SolutionStep[] = [
      {
        math: `\\text{original} \\times ${decimalTex(m)} = ${decimalTex(now)}`,
        reason: `After a ${p.p}% ${p.up ? 'increase' : 'decrease'}, the new price is ${100 + (p.up ? p.p : -p.p)}% of the original, so the original was multiplied by ${decimalWords(m)}.`,
      },
      {
        math: `\\text{original} = ${decimalTex(now)} \\div ${decimalTex(m)} = ${p.original}`,
        reason: 'Undo the multiplication by dividing by the multiplier.',
      },
    ];
    return {
      prompt: [
        text(
          `A shop ${p.up ? 'raises' : 'reduces'} all its prices by ${p.p}%. After the ${p.up ? 'increase' : 'reduction'}, a coat costs ${money(now)}. What was its price, in pounds, before the ${p.up ? 'increase' : 'reduction'}?`,
        ),
      ],
      answer: exactAnswer(Q.of(p.original)),
      steps,
      hints: [
        {
          level: 'nudge',
          body: [text('The percentage was taken of the original price, not of the new one.')],
        },
        {
          level: 'method',
          body: [
            text(
              'Write the multiplier for the change. The new price is the original times the multiplier, so divide the new price by the multiplier.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: the new price is (100 ± p) parts; find 1 part, then 100 parts.
  solveDirectly: (p) =>
    nowOf(p)
      .div(Q.of(100 + (p.up ? p.p : -p.p)))
      .mul(Q.of(100))
      .toLatex(),
  misconceptions: [
    {
      id: 'reverse-percentage-of-new',
      produce: (p) => {
        const wrong = nowOf(p).mul(multiplierOf({ p: p.p, up: !p.up }));
        return wrong.eq(Q.of(p.original)) ? null : decimalTex(wrong);
      },
      wrongSteps: (p) => {
        const wrong = nowOf(p).mul(multiplierOf({ p: p.p, up: !p.up }));
        return [
          {
            math: `${decimalTex(nowOf(p))} \\times ${decimalTex(multiplierOf({ p: p.p, up: !p.up }))} = ${decimalTex(wrong)}`,
            reason: `${p.up ? 'Take' : 'Add'} ${p.p}% ${p.up ? 'off' : 'on to'} the new price to undo the change.`,
          },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => [String(p.original + 1), decimalTex(nowOf(p))],
};

export const generators = [
  defineGenerator(percentOf),
  defineGenerator(asPercentage),
  defineGenerator(change),
  defineGenerator(reverse),
];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'pc-of': defineExample<OfParams>(percentOf, {
    difficulty: 2,
    params: { p: [35, 1], amount: 80 },
    fade: 'full',
  }),
  'pc-as': defineExample(asPercentage, {
    difficulty: 2,
    params: { part: 18, whole: 40 },
    fade: 'full',
  }),
  'pc-increase': defineExample(change, {
    difficulty: 2,
    params: { amount: 80, p: 15, up: true },
    fade: 'last-1',
  }),
  'pc-reverse': defineExample(reverse, {
    difficulty: 1,
    params: { original: 60, p: 20, up: true },
    fade: 'full',
  }),
  'pc-reverse-wrong': defineExample(reverse, {
    difficulty: 1,
    params: { original: 60, p: 20, up: true },
    fade: 'full',
    misconception: 'reverse-percentage-of-new',
  }),
  'pc-decrease-own': defineExample(change, {
    difficulty: 3,
    params: { amount: 240, p: 35, up: false },
    fade: 'learner',
  }),
};
