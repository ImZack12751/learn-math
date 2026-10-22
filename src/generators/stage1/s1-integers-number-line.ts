/**
 * Integers and the number line: comparing and ordering integers, the distance between two
 * integers, and moving along the line. Every number comes from the parameters below.
 */
import type { Rng } from '../../engine/rng';
import type { SolutionStep } from '../../engine/types';
import { math, text, words } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-integers-number-line';

const intAnswer = (n: number) => ({
  kind: 'number' as const,
  canonical: String(n),
  form: ['integer' as const],
});

/** Distinct integers in [lo, hi] whose sizes (distances from zero) are also distinct. */
function distinctSizes(rng: Rng, count: number, lo: number, hi: number): number[] {
  for (;;) {
    const values = Array.from({ length: count }, () => rng.int(lo, hi));
    const sizes = new Set(values.map(Math.abs));
    if (sizes.size === count) return values;
  }
}

/* ---------- Skill 1: compare and order ---------- */

export interface CompareParams {
  values: number[];
  /** Which one the question asks for. */
  want: 'greatest' | 'smallest';
}

function sampleCompare(rng: Rng, difficulty: Difficulty): CompareParams {
  if (difficulty === 1) {
    // One negative and one positive, or a negative and zero's neighbours.
    const [a, b] = [-rng.int(1, 12), rng.int(1, 12)];
    if (a === -b) return sampleCompare(rng, difficulty);
    return { values: rng.shuffle([a, b]), want: rng.bool() ? 'greatest' : 'smallest' };
  }
  if (difficulty === 2) {
    // Both negative: the case where size and order disagree.
    const values = distinctSizes(rng, 2, -20, -1);
    return { values, want: rng.bool() ? 'greatest' : 'smallest' };
  }
  const values = distinctSizes(rng, 5, -25, 25);
  if (values.filter((v) => v < 0).length < 2 || !values.some((v) => v > 0)) {
    return sampleCompare(rng, difficulty);
  }
  return { values, want: rng.bool() ? 'greatest' : 'smallest' };
}

const listTex = (values: number[]) => values.join(', \\; ');
const ordered = (values: number[]) => [...values].sort((a, b) => a - b);
const compareAnswer = (p: CompareParams) =>
  p.want === 'greatest' ? Math.max(...p.values) : Math.min(...p.values);

function buildCompare(p: CompareParams): BuiltProblem {
  const answer = compareAnswer(p);
  const sorted = ordered(p.values);
  const steps: SolutionStep[] = [
    {
      math: sorted.join(' < '),
      reason:
        'On the number line, numbers increase from left to right. Placed in order from left to right, the numbers are as shown.',
    },
    {
      math: String(answer),
      reason:
        p.want === 'greatest'
          ? `The greatest is the one furthest to the right: ${words(answer)}.`
          : `The smallest is the one furthest to the left: ${words(answer)}.`,
    },
  ];
  return {
    prompt: [
      text(`Write down the ${p.want} of these numbers: `),
      math(listTex(p.values)),
      text('.'),
    ],
    answer: intAnswer(answer),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text(
            'Picture each number on the number line. Which is furthest to the right, and which to the left?',
          ),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            'A negative number is to the left of zero. The bigger its size, the further left it is, so the smaller it is.',
          ),
        ],
      },
      { level: 'first-step', body: [math(sorted.join(' < '))] },
    ],
  };
}

export const compare: Generator<CompareParams> = {
  id: `${TOPIC}/compare`,
  version: 1,
  topicId: TOPIC,
  title: 'Compare and order integers',
  sample: sampleCompare,
  build: buildCompare,
  // Independent route: count how many of the others each value beats.
  solveDirectly: (p) => {
    const beats = (v: number) =>
      p.values.filter((w) => (p.want === 'greatest' ? v > w : v < w)).length;
    const winner = p.values.find((v) => beats(v) === p.values.length - 1);
    return String(winner);
  },
  misconceptions: [
    {
      id: 'negative-size-ordering',
      produce: (p) => {
        // Ordering by size alone, ignoring the signs.
        const bySize = [...p.values].sort((a, b) => Math.abs(a) - Math.abs(b));
        const wrong = p.want === 'greatest' ? bySize.at(-1) : bySize[0];
        return wrong === undefined || wrong === compareAnswer(p) ? null : String(wrong);
      },
      wrongSteps: (p) => {
        const bySize = [...p.values].sort((a, b) => Math.abs(a) - Math.abs(b));
        const wrong = (p.want === 'greatest' ? bySize.at(-1) : bySize[0]) ?? 0;
        return [
          {
            math: bySize.map((v) => String(Math.abs(v))).join(' < '),
            reason: 'Order the numbers by their digits, ignoring the minus signs.',
          },
          {
            math: String(wrong),
            reason: `So the ${p.want} is taken to be ${words(wrong)}.`,
          },
        ];
      },
    },
  ],
  equivalents: (p) => [`\\left(${compareAnswer(p)}\\right)`],
  nearMisses: (p) => {
    const answer = compareAnswer(p);
    const others = p.values.filter((v) => v !== answer);
    return [...others, ...(answer === 0 ? [] : [-answer])].map(String);
  },
};

/* ---------- Skill 2: distance between two integers ---------- */

export interface DistanceParams {
  a: number;
  b: number;
  /** Temperatures instead of bare numbers (difficulty 3). */
  context: boolean;
}

function sampleDistance(rng: Rng, difficulty: Difficulty): DistanceParams {
  if (difficulty === 1) return { a: -rng.int(1, 9), b: rng.int(1, 9), context: false };
  if (difficulty === 2) {
    const [a, b] = distinctSizes(rng, 2, -20, -1) as [number, number];
    return rng.bool()
      ? { a, b, context: false }
      : { a: -rng.int(2, 15), b: rng.int(2, 15), context: false };
  }
  const a = -rng.int(3, 25);
  const b = rng.bool(0.7) ? rng.int(1, 30) : -rng.int(1, Math.abs(a) - 1);
  return rng.bool() ? { a, b, context: true } : { a: b, b: a, context: true };
}

const distance = (p: DistanceParams) => Math.abs(p.a - p.b);

function buildDistance(p: DistanceParams): BuiltProblem {
  const [lo, hi] = p.a < p.b ? [p.a, p.b] : [p.b, p.a];
  const d = distance(p);
  const steps: SolutionStep[] = [];
  if (lo < 0 && hi > 0) {
    steps.push({
      math: `${-lo} + ${hi}`,
      reason: `From ${words(lo)} up to 0 is ${-lo} steps, and from 0 up to ${words(hi)} is ${hi} more. The numbers are on opposite sides of zero, so add the two parts.`,
    });
  } else {
    steps.push({
      math: `${Math.abs(lo)} - ${Math.abs(hi)}`,
      reason: `Both numbers are on the same side of zero. ${words(lo)} is ${Math.abs(lo)} from zero and ${words(hi)} is ${Math.abs(hi)} from zero, so the gap between them is the difference of those distances.`,
    });
  }
  steps.push({ math: `= ${d}`, reason: `So they are ${d} units apart.` });
  const prompt = p.context
    ? [
        text(
          p.a < p.b
            ? `The temperature rises from ${words(p.a)} °C to ${words(p.b)} °C. By how many degrees does it rise?`
            : `The temperature falls from ${words(p.a)} °C to ${words(p.b)} °C. By how many degrees does it fall?`,
        ),
      ]
    : [
        text('How many units apart are '),
        math(String(p.a)),
        text(' and '),
        math(String(p.b)),
        text(' on the number line?'),
      ];
  return {
    prompt,
    answer: intAnswer(d),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [text('Count the steps along the number line from one number to the other.')],
      },
      {
        level: 'method',
        body: [
          text(
            'If the numbers are on opposite sides of zero, count to zero first and then on from zero: add the two distances.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? String(d))] },
    ],
  };
}

export const distanceSkill: Generator<DistanceParams> = {
  id: `${TOPIC}/distance`,
  version: 1,
  topicId: TOPIC,
  title: 'Distance on the number line',
  sample: sampleDistance,
  build: buildDistance,
  // Independent route: count the unit steps one at a time.
  solveDirectly: (p) => {
    let steps = 0;
    for (let at = Math.min(p.a, p.b); at < Math.max(p.a, p.b); at++) steps++;
    return String(steps);
  },
  misconceptions: [
    {
      id: 'distance-subtract-sizes',
      produce: (p) => {
        if (Math.sign(p.a) === Math.sign(p.b)) return null;
        const wrong = Math.abs(Math.abs(p.a) - Math.abs(p.b));
        return wrong === distance(p) ? null : String(wrong);
      },
      wrongSteps: (p) => {
        const wrong = Math.abs(Math.abs(p.a) - Math.abs(p.b));
        const [big, small] = Math.abs(p.a) > Math.abs(p.b) ? [p.a, p.b] : [p.b, p.a];
        return [
          {
            math: `${Math.abs(big)} - ${Math.abs(small)}`,
            reason:
              'Subtract the smaller size from the larger, ignoring which side of zero each number is on.',
          },
          { math: `= ${wrong}`, reason: 'Subtract.' },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => [String(distance(p) + 1), String(distance(p) - 1), String(-distance(p))],
};

/* ---------- Skill 3: moving along the line ---------- */

export interface MoveParams {
  start: number;
  /** Positive moves right, negative moves left. */
  move: number;
}

function sampleMove(rng: Rng, difficulty: Difficulty): MoveParams {
  if (difficulty === 1) {
    // Positive start, move left past zero.
    const start = rng.int(1, 8);
    return { start, move: -rng.int(start + 1, start + 8) };
  }
  if (difficulty === 2) {
    // Negative start, move right (past zero or not).
    const start = -rng.int(2, 12);
    return { start, move: rng.int(1, 18) };
  }
  // Negative start, further left; or larger numbers either way.
  const start = rng.nonZero(5, 40);
  const move = start < 0 && rng.bool() ? -rng.int(3, 30) : rng.nonZero(10, 60);
  return { start, move };
}

const moveWords = (m: number) =>
  `${Math.abs(m)} ${Math.abs(m) === 1 ? 'unit' : 'units'} to the ${m > 0 ? 'right' : 'left'}`;

function buildMove(p: MoveParams): BuiltProblem {
  const end = p.start + p.move;
  const steps: SolutionStep[] = [];
  const crosses = Math.sign(p.start) !== Math.sign(end) && end !== 0 && p.start !== 0;
  if (crosses) {
    const toZero = Math.abs(p.start);
    steps.push({
      math: `${Math.abs(p.move)} = ${toZero} + ${Math.abs(p.move) - toZero}`,
      reason: `Split the move: ${toZero} ${toZero === 1 ? 'unit takes' : 'units take'} you from ${words(p.start)} to 0, and the rest carries on past zero.`,
    });
    steps.push({
      math: String(end),
      reason: `${Math.abs(p.move) - toZero} ${p.move > 0 ? 'to the right of' : 'to the left of'} zero is ${words(end)}.`,
    });
  } else {
    steps.push({
      math: String(end),
      reason: `Moving ${moveWords(p.move)} from ${words(p.start)} ${Math.abs(end) > Math.abs(p.start) ? 'takes you further from zero' : 'takes you towards zero'}, to ${words(end)}.`,
    });
  }
  return {
    prompt: [
      text('Start at '),
      math(String(p.start)),
      text(` on the number line and move ${moveWords(p.move)}. Where do you finish?`),
    ],
    answer: intAnswer(end),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [text('Right means towards bigger numbers; left means towards smaller numbers.')],
      },
      {
        level: 'method',
        body: [
          text(
            'If the move crosses zero, split it: first move to zero, then move the rest of the way.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? String(end))] },
    ],
  };
}

export const move: Generator<MoveParams> = {
  id: `${TOPIC}/move`,
  version: 1,
  topicId: TOPIC,
  title: 'Move along the number line',
  sample: sampleMove,
  build: buildMove,
  // Independent route: walk one unit at a time.
  solveDirectly: (p) => {
    let at = p.start;
    for (let i = 0; i < Math.abs(p.move); i++) at += Math.sign(p.move);
    return String(at);
  },
  misconceptions: [
    {
      id: 'move-wrong-direction',
      produce: (p) => (p.move === 0 ? null : String(p.start - p.move)),
    },
  ],
  equivalents: (p) => [`\\left(${p.start + p.move}\\right)`],
  nearMisses: (p) => {
    const end = p.start + p.move;
    return [String(end + 1), String(end - 1), ...(end === 0 ? [] : [String(-end)])].filter(
      (v) => v !== String(p.start - p.move),
    );
  },
  isDegenerate: (p) => p.start + p.move === p.start,
};

export const generators = [
  defineGenerator(compare),
  defineGenerator(distanceSkill),
  defineGenerator(move),
];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'int-compare': defineExample<CompareParams>(compare, {
    difficulty: 2,
    params: { values: [-7, -3], want: 'greatest' },
    fade: 'full',
  }),
  'int-compare-wrong': defineExample<CompareParams>(compare, {
    difficulty: 2,
    params: { values: [-7, -3], want: 'greatest' },
    fade: 'full',
    misconception: 'negative-size-ordering',
  }),
  'int-order': defineExample<CompareParams>(compare, {
    difficulty: 3,
    params: { values: [4, -9, 0, -2, 7], want: 'smallest' },
    fade: 'last-1',
  }),
  'int-distance': defineExample(distanceSkill, {
    difficulty: 1,
    params: { a: -4, b: 3, context: false },
    fade: 'full',
  }),
  'int-temperature': defineExample(distanceSkill, {
    difficulty: 3,
    params: { a: -6, b: 5, context: true },
    fade: 'learner',
  }),
};
