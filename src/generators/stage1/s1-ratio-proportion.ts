/**
 * Ratio and proportion: simplifying ratios, sharing in a ratio, and direct proportion by the
 * unitary method. All values are exact rationals.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { AnswerSpec, SolutionStep } from '../../engine/types';
import { decimalTex, decimalWords, gcdInt, math, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-ratio-proportion';

const ratioTex = (parts: readonly (number | string)[]) => parts.join(' : ');
const gcdAll = (xs: number[]) => xs.reduce((g, x) => gcdInt(g, x), 0);

function exactAnswer(q: Q): AnswerSpec {
  return { kind: 'number', canonical: decimalTex(q), form: [q.isInteger ? 'integer' : 'decimal'] };
}

/** An amount of money in running text: £72, £5.40. */
const money = (q: Q) => {
  if (q.isInteger) return `£${q.toString()}`;
  const [whole, pence = ''] = decimalWords(q).split('.');
  return `£${whole ?? ''}.${pence.padEnd(2, '0')}`;
};

/* ---------- Skill 1: simplify a ratio ---------- */

interface UnitPair {
  small: string;
  big: string;
  size: number;
}

const UNIT_PAIRS: UnitPair[] = [
  { small: 'cm', big: 'm', size: 100 },
  { small: 'g', big: 'kg', size: 1000 },
  { small: 'minutes', big: 'hours', size: 60 },
  { small: 'mm', big: 'cm', size: 10 },
];

export interface SimplifyRatioParams {
  /** The parts as written, in tenths when `tenths` is set (1.5 is 15). */
  parts: number[];
  tenths: boolean;
  /** Mixed units: the first part is in the small unit and the second in the big unit. */
  units: number;
}

function sampleSimplify(rng: Rng, difficulty: Difficulty): SimplifyRatioParams {
  for (;;) {
    const count = difficulty === 2 ? 3 : 2;
    const base = Array.from({ length: count }, () => rng.int(1, 9));
    if (gcdAll(base) !== 1 || new Set(base).size !== count) continue;
    if (difficulty === 3) {
      if (rng.bool()) {
        // Decimals such as 1.5 : 2.5, held in tenths.
        const parts = base.map((b) => b * 5);
        if (parts.every((x) => x % 10 === 0)) continue;
        return { parts, tenths: true, units: -1 };
      }
      // Mixed units: a small-unit amount against a whole number of big units.
      const units = rng.int(0, UNIT_PAIRS.length - 1);
      const u = UNIT_PAIRS[units] as UnitPair;
      const step = { 100: 5, 1000: 50, 60: 5, 10: 1 }[u.size] ?? 1;
      const big = rng.int(1, 4);
      const small = step * rng.int(1, Math.floor((3 * u.size) / step));
      if (small === big * u.size) continue;
      return { parts: [small, big], tenths: false, units };
    }
    const k = difficulty === 1 ? rng.int(2, 9) : rng.int(2, 12);
    return { parts: base.map((b) => b * k), tenths: false, units: -1 };
  }
}

/** The parts in a common whole-number unit. */
function commonParts(p: SimplifyRatioParams): number[] {
  if (p.units >= 0) {
    const u = UNIT_PAIRS[p.units] as UnitPair;
    return [p.parts[0] ?? 0, (p.parts[1] ?? 0) * u.size];
  }
  return p.parts;
}

const simplestParts = (p: SimplifyRatioParams) => {
  const parts = commonParts(p);
  const g = gcdAll(parts);
  return parts.map((x) => x / g);
};

const writtenTex = (p: SimplifyRatioParams) => {
  if (p.tenths) return ratioTex(p.parts.map((x) => decimalTex(Q.of(x, 10))));
  if (p.units >= 0) {
    const u = UNIT_PAIRS[p.units] as UnitPair;
    return `${p.parts[0] ?? 0} \\text{ ${u.small}} : ${p.parts[1] ?? 0} \\text{ ${u.big}}`;
  }
  return ratioTex(p.parts);
};

export const simplifyRatio: Generator<SimplifyRatioParams> = {
  id: `${TOPIC}/simplify-ratio`,
  version: 1,
  topicId: TOPIC,
  title: 'Simplify ratios',
  sample: sampleSimplify,
  build: (p) => {
    const steps: SolutionStep[] = [];
    const parts = commonParts(p);
    if (p.tenths) {
      steps.push({
        math: `${writtenTex(p)} = ${ratioTex(parts)}`,
        reason:
          'Multiply every part by 10 to clear the decimals. Multiplying all the parts by the same number keeps the ratio the same.',
      });
    } else if (p.units >= 0) {
      const u = UNIT_PAIRS[p.units] as UnitPair;
      steps.push({
        math: `${writtenTex(p)} = ${parts[0] ?? 0} \\text{ ${u.small}} : ${parts[1] ?? 0} \\text{ ${u.small}}`,
        reason: `Write both parts in the same unit: 1 ${u.big.replace(/s$/, '')} is ${u.size} ${u.small}.`,
      });
    }
    const g = gcdAll(parts);
    const simple = simplestParts(p);
    steps.push({
      math: `${steps.length === 0 ? `${writtenTex(p)} ` : ''}= ${ratioTex(simple)}`,
      reason: `The highest common factor of ${parts.join(', ')} is ${g}. Divide every part by ${g}.`,
    });
    return {
      prompt: [text('Write the ratio '), math(writtenTex(p)), text(' in its simplest form.')],
      answer: { kind: 'ratio', canonical: ratioTex(simple), form: ['simplest-ratio'] },
      steps,
      hints: [
        {
          level: 'nudge',
          body: [
            text(
              'A ratio stays the same when every part is multiplied or divided by the same number.',
            ),
          ],
        },
        {
          level: 'method',
          body: [
            text(
              p.units >= 0
                ? 'Change both parts into the same unit first, then divide by the highest common factor.'
                : p.tenths
                  ? 'Multiply by 10 to make whole numbers, then divide by the highest common factor.'
                  : 'Divide every part by the highest common factor of the parts.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: divide out common primes one at a time.
  solveDirectly: (p) => {
    let parts = commonParts(p);
    for (let q = 2; q <= Math.max(...parts); q++) {
      while (parts.every((x) => x % q === 0)) parts = parts.map((x) => x / q);
    }
    return ratioTex(parts);
  },
  misconceptions: [
    {
      id: 'ratio-order-reversed',
      produce: (p) => {
        const simple = simplestParts(p);
        const reversed = [...simple].reverse();
        return reversed.join() === simple.join() ? null : ratioTex(reversed);
      },
    },
    {
      id: 'fraction-mixed-units',
      produce: (p) => {
        if (p.units < 0) return null;
        const g = gcdAll(p.parts);
        const wrong = p.parts.map((x) => x / g);
        return wrong.join() === simplestParts(p).join() ? null : ratioTex(wrong);
      },
    },
  ],
  equivalents: (p) => [ratioTex(simplestParts(p)).replace(/ /g, '')],
  nearMisses: (p) => {
    const s = simplestParts(p);
    return [ratioTex(s.map((x, i) => (i === 0 ? x + 1 : x)))];
  },
};

/* ---------- Skill 2: share in a ratio ---------- */

export interface ShareParams {
  parts: number[];
  /** Amount per part. */
  unit: number;
  /** Which share is asked for (index into parts). */
  ask: number;
}

const NAMES = ['Asha', 'Ben', 'Chen'];

function sampleShare(rng: Rng, difficulty: Difficulty): ShareParams {
  for (;;) {
    const count = difficulty === 1 ? 2 : rng.pick([2, 3]);
    const parts = Array.from({ length: count }, () => rng.int(1, 9));
    if (gcdAll(parts) !== 1 || new Set(parts).size !== count) continue;
    const unit = difficulty === 3 ? rng.int(3, 40) * 5 : rng.int(2, 20);
    return { parts, unit, ask: rng.int(0, count - 1) };
  }
}

const shareTotal = (p: ShareParams) => p.parts.reduce((a, b) => a + b, 0) * p.unit;

export const share: Generator<ShareParams> = {
  id: `${TOPIC}/share`,
  version: 1,
  topicId: TOPIC,
  title: 'Share in a ratio',
  sample: sampleShare,
  build: (p) => {
    const names = NAMES.slice(0, p.parts.length);
    const totalParts = p.parts.reduce((a, b) => a + b, 0);
    const total = shareTotal(p);
    const asked = p.parts[p.ask] ?? 1;
    const who = names[p.ask] ?? '';
    const steps: SolutionStep[] = [
      {
        math: `${p.parts.join(' + ')} = ${totalParts}`,
        reason: `Count the parts: the ratio ${ratioTex(p.parts)} splits the money into ${totalParts} equal parts.`,
      },
      {
        math: `${total} \\div ${totalParts} = ${p.unit}`,
        reason: `Each part is worth £${total} ÷ ${totalParts} = £${p.unit}.`,
      },
      {
        math: `${asked} \\times ${p.unit} = ${asked * p.unit}`,
        reason: `${who} gets ${asked} ${asked === 1 ? 'part' : 'parts'}.`,
      },
    ];
    const list =
      names.length === 2
        ? `${names[0] ?? ''} and ${names[1] ?? ''}`
        : `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;
    return {
      prompt: [
        text(`£${total} is shared between ${list} in the ratio `),
        math(ratioTex(p.parts)),
        text(`. How much, in pounds, does ${who} get?`),
      ],
      answer: exactAnswer(Q.of(asked * p.unit)),
      steps,
      hints: [
        {
          level: 'nudge',
          body: [text('How many equal parts is the money split into altogether?')],
        },
        {
          level: 'method',
          body: [
            text(
              'Add the numbers in the ratio, divide the amount by that total to find one part, then multiply.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: the share is a fraction of the total.
  solveDirectly: (p) =>
    Q.of(
      p.parts[p.ask] ?? 0,
      p.parts.reduce((a, b) => a + b, 0),
    )
      .mul(Q.of(shareTotal(p)))
      .toLatex(),
  misconceptions: [
    {
      id: 'share-divide-by-part',
      produce: (p) => {
        const wrong = Q.of(shareTotal(p), p.parts[p.ask] ?? 1);
        return wrong.eq(Q.of((p.parts[p.ask] ?? 0) * p.unit)) ? null : wrong.toLatex();
      },
      wrongSteps: (p) => {
        const part = p.parts[p.ask] ?? 1;
        return [
          {
            math: `${shareTotal(p)} \\div ${part} = ${Q.of(shareTotal(p), part).toLatex()}`,
            reason: `Divide the money by ${part}, the number in the ratio for ${NAMES[p.ask] ?? ''}.`,
          },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) =>
    [String(p.unit), String(shareTotal(p) - (p.parts[p.ask] ?? 0) * p.unit)].filter(
      (x) => x !== String((p.parts[p.ask] ?? 0) * p.unit),
    ),
};

/* ---------- Skill 3: direct proportion ---------- */

export interface ProportionParams {
  /** Number of items in the known case and the asked case. */
  n1: number;
  n2: number;
  /** Cost of one item, in pence. */
  pence: number;
  item: number;
}

const ITEMS = ['pens', 'notebooks', 'bus tickets', 'apples', 'stamps'];

function sampleProportion(rng: Rng, difficulty: Difficulty): ProportionParams {
  for (;;) {
    const n1 = rng.int(2, 9);
    const n2 = difficulty === 1 ? n1 * rng.int(2, 5) : rng.int(2, 15);
    if (n2 === n1 || (difficulty > 1 && n2 % n1 === 0)) continue;
    const pence = difficulty === 3 ? rng.int(13, 250) : rng.int(2, 40) * 5;
    return { n1, n2, pence, item: rng.int(0, ITEMS.length - 1) };
  }
}

const pounds = (pence: number) => Q.of(pence, 100);

export const proportion: Generator<ProportionParams> = {
  id: `${TOPIC}/direct-proportion`,
  version: 1,
  topicId: TOPIC,
  title: 'Direct proportion',
  sample: sampleProportion,
  build: (p) => {
    const cost1 = pounds(p.pence * p.n1);
    const each = pounds(p.pence);
    const cost2 = pounds(p.pence * p.n2);
    const item = ITEMS[p.item] ?? 'items';
    const steps: SolutionStep[] = [
      {
        math: `${decimalTex(cost1)} \\div ${p.n1} = ${decimalTex(each)}`,
        reason: `Find the cost of one: ${p.n1} ${item} cost ${money(cost1)}, so one costs ${money(cost1)} ÷ ${p.n1}.`,
      },
      {
        math: `${decimalTex(each)} \\times ${p.n2} = ${decimalTex(cost2)}`,
        reason: `Then multiply by the number wanted, ${p.n2}.`,
      },
    ];
    return {
      prompt: [
        text(`${p.n1} ${item} cost ${money(cost1)}. How much, in pounds, do ${p.n2} ${item} cost?`),
      ],
      answer: exactAnswer(cost2),
      steps,
      hints: [
        {
          level: 'nudge',
          body: [text('If you knew the cost of one, could you find the cost of any number?')],
        },
        {
          level: 'method',
          body: [
            text('Divide to find the cost of one item, then multiply by the number you want.'),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: scale the known cost by the ratio of the numbers.
  solveDirectly: (p) =>
    pounds(p.pence * p.n1)
      .mul(Q.of(p.n2, p.n1))
      .toLatex(),
  misconceptions: [
    {
      id: 'proportion-add-difference',
      produce: (p) => {
        const wrong = pounds(p.pence * p.n1).add(Q.of(p.n2 - p.n1));
        return wrong.eq(pounds(p.pence * p.n2)) || wrong.n <= 0n ? null : decimalTex(wrong);
      },
      wrongSteps: (p) => {
        const wrong = pounds(p.pence * p.n1).add(Q.of(p.n2 - p.n1));
        return [
          {
            math: `${p.n2} - ${p.n1} = ${p.n2 - p.n1}`,
            reason: `There are ${Math.abs(p.n2 - p.n1)} ${p.n2 > p.n1 ? 'more' : 'fewer'} items.`,
          },
          {
            math: `${decimalTex(pounds(p.pence * p.n1))} ${p.n2 > p.n1 ? '+' : '-'} ${Math.abs(p.n2 - p.n1)} = ${decimalTex(wrong)}`,
            reason: `So ${p.n2 > p.n1 ? 'add' : 'take off'} ${Math.abs(p.n2 - p.n1)} pounds.`,
          },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => [decimalTex(pounds(p.pence)), decimalTex(pounds(p.pence * (p.n2 + 1)))],
};

export const generators = [
  defineGenerator(simplifyRatio),
  defineGenerator(share),
  defineGenerator(proportion),
];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'rp-simplify': defineExample(simplifyRatio, {
    difficulty: 1,
    params: { parts: [12, 18], tenths: false, units: -1 },
    fade: 'full',
  }),
  'rp-units': defineExample(simplifyRatio, {
    difficulty: 3,
    params: { parts: [40, 2], tenths: false, units: 0 },
    fade: 'last-1',
  }),
  'rp-share': defineExample(share, {
    difficulty: 1,
    params: { parts: [2, 3], unit: 12, ask: 1 },
    fade: 'full',
  }),
  'rp-share-wrong': defineExample(share, {
    difficulty: 1,
    params: { parts: [2, 3], unit: 12, ask: 1 },
    fade: 'full',
    misconception: 'share-divide-by-part',
  }),
  'rp-proportion': defineExample(proportion, {
    difficulty: 2,
    params: { n1: 5, n2: 8, pence: 68, item: 0 },
    fade: 'learner',
  }),
};
