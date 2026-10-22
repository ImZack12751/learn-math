/**
 * Rates and unit conversion: converting metric units, and speed, distance and time (including
 * times given in minutes). All values are exact rationals.
 */
import { Q } from '../../engine/rational';
import type { Rng } from '../../engine/rng';
import type { AnswerSpec, SolutionStep } from '../../engine/types';
import { decimalTex, decimalWords, math, terminates, text } from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-rates-units';

function exactAnswer(q: Q): AnswerSpec {
  return { kind: 'number', canonical: decimalTex(q), form: [q.isInteger ? 'integer' : 'decimal'] };
}

/* ---------- Skill 1: converting units ---------- */

interface Conversion {
  big: string;
  small: string;
  /** Small units in one big unit. */
  factor: number;
}

const CONVERSIONS: Conversion[] = [
  { big: 'km', small: 'm', factor: 1000 },
  { big: 'm', small: 'cm', factor: 100 },
  { big: 'cm', small: 'mm', factor: 10 },
  { big: 'kg', small: 'g', factor: 1000 },
  { big: 'litres', small: 'ml', factor: 1000 },
];

/** Chains for two-step conversions (difficulty 3): km → m → cm, m → cm → mm. */
const CHAINS: [number, number][] = [
  [0, 1],
  [1, 2],
];

export interface ConvertParams {
  /** Steps of the conversion, as indices into the table, from the first unit to the last. */
  chain: number[];
  /** True to go from the big unit down to the small one. */
  down: boolean;
  /** The amount, in tenths of the starting unit. */
  tenths: number;
}

function sampleConvert(rng: Rng, difficulty: Difficulty): ConvertParams {
  for (;;) {
    const chain = difficulty === 3 ? [...rng.pick(CHAINS)] : [rng.int(0, CONVERSIONS.length - 1)];
    const down = rng.bool();
    const tenths = difficulty === 1 ? 10 * rng.int(2, 30) : rng.int(3, 400);
    if (difficulty === 1 && !down) {
      // Up to a bigger unit with whole numbers: a whole number of big units.
      const factor = CONVERSIONS[chain[0] ?? 0]?.factor ?? 1;
      return { chain, down, tenths: 10 * factor * rng.int(1, 9) };
    }
    if (tenths % 10 === 0 && difficulty === 2) continue;
    return { chain, down, tenths };
  }
}

const startQ = (p: ConvertParams) => Q.of(p.tenths, 10);
const totalFactor = (p: ConvertParams) =>
  p.chain.reduce((f, i) => f * (CONVERSIONS[i]?.factor ?? 1), 1);
const convertValue = (p: ConvertParams) =>
  p.down ? startQ(p).mul(Q.of(totalFactor(p))) : startQ(p).div(Q.of(totalFactor(p)));

/** Units along the chain, from the start unit to the end unit. */
function units(p: ConvertParams): string[] {
  const list = [CONVERSIONS[p.chain[0] ?? 0]?.big ?? ''];
  for (const i of p.chain) list.push(CONVERSIONS[i]?.small ?? '');
  return p.down ? list : list.reverse();
}

export const convert: Generator<ConvertParams> = {
  id: `${TOPIC}/convert-units`,
  version: 1,
  topicId: TOPIC,
  title: 'Convert metric units',
  sample: sampleConvert,
  build: (p) => {
    const names = units(p);
    const order = p.down ? p.chain : [...p.chain].reverse();
    const steps: SolutionStep[] = [];
    let value = startQ(p);
    order.forEach((i, k) => {
      const c = CONVERSIONS[i] as Conversion;
      const before = value;
      value = p.down ? value.mul(Q.of(c.factor)) : value.div(Q.of(c.factor));
      const rule = p.down
        ? `1 ${c.big.replace(/s$/, '')} is ${c.factor} ${c.small}. Going to a smaller unit gives more of them, so multiply by ${c.factor}.`
        : `${c.factor} ${c.small} make 1 ${c.big.replace(/s$/, '')}. Going to a bigger unit gives fewer of them, so divide by ${c.factor}.`;
      const so =
        k < order.length - 1 ? ` That is ${decimalWords(value)} ${names[k + 1] ?? ''}.` : '';
      steps.push({
        math: `${decimalTex(before)} ${p.down ? '\\times' : '\\div'} ${c.factor} = ${decimalTex(value)}`,
        reason: rule + so,
      });
    });
    return {
      prompt: [
        text(`Convert ${decimalWords(startQ(p))} ${names[0] ?? ''} to ${names.at(-1) ?? ''}.`),
      ],
      answer: exactAnswer(convertValue(p)),
      steps,
      hints: [
        {
          level: 'nudge',
          body: [
            text(
              'Are you going to a smaller unit (more of them) or a bigger unit (fewer of them)?',
            ),
          ],
        },
        {
          level: 'method',
          body: [
            text(
              'To a smaller unit, multiply by the number of small units in one big unit. To a bigger unit, divide by it.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: the whole factor at once.
  solveDirectly: (p) => convertValue(p).toLatex(),
  misconceptions: [
    {
      id: 'convert-wrong-direction',
      produce: (p) =>
        decimalTex(
          p.down ? startQ(p).div(Q.of(totalFactor(p))) : startQ(p).mul(Q.of(totalFactor(p))),
        ),
      wrongSteps: (p) => {
        const wrong = p.down
          ? startQ(p).div(Q.of(totalFactor(p)))
          : startQ(p).mul(Q.of(totalFactor(p)));
        return [
          {
            math: `${decimalTex(startQ(p))} ${p.down ? '\\div' : '\\times'} ${totalFactor(p)} = ${decimalTex(wrong)}`,
            reason: p.down
              ? 'The new unit is smaller, so divide.'
              : 'The new unit is bigger, so multiply.',
          },
        ];
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => [
    decimalTex(convertValue(p).mul(Q.of(10))),
    decimalTex(convertValue(p).div(Q.of(10))),
  ],
};

/* ---------- Skill 2: speed, distance and time ---------- */

export interface SpeedParams {
  /** Speed in km/h and time in minutes. */
  speed: number;
  minutes: number;
  find: 'speed' | 'distance' | 'time';
}

function sampleSpeed(rng: Rng, difficulty: Difficulty): SpeedParams {
  for (;;) {
    const speed = rng.int(2, 24) * 5;
    const minutes =
      difficulty === 3
        ? rng.pick([6, 12, 15, 24, 30, 36, 45, 48, 75, 90, 105, 150])
        : 60 * rng.int(1, 6);
    const find = difficulty === 1 ? 'speed' : rng.pick(['speed', 'distance', 'time'] as const);
    const distance = Q.of(speed * minutes, 60);
    if (!terminates(distance) || distance.d > 10n) continue;
    if (find === 'time' && difficulty === 3) continue;
    return { speed, minutes, find };
  }
}

const distanceQ = (p: SpeedParams) => Q.of(p.speed * p.minutes, 60);
const hoursQ = (p: SpeedParams) => Q.of(p.minutes, 60);

const timeWords = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} minutes`;
  return m === 0
    ? `${h} ${h === 1 ? 'hour' : 'hours'}`
    : `${h} ${h === 1 ? 'hour' : 'hours'} ${m} minutes`;
};

export const speed: Generator<SpeedParams> = {
  id: `${TOPIC}/speed`,
  version: 1,
  topicId: TOPIC,
  title: 'Speed, distance and time',
  sample: sampleSpeed,
  build: (p) => {
    const d = distanceQ(p);
    const t = hoursQ(p);
    const steps: SolutionStep[] = [];
    if (p.minutes % 60 !== 0) {
      steps.push({
        math: `${p.minutes} \\text{ min} = \\frac{${p.minutes}}{60} \\text{ h} = ${decimalTex(t)} \\text{ h}`,
        reason:
          'Speed is in kilometres per hour, so write the time in hours: there are 60 minutes in an hour.',
      });
    }
    let answer: Q;
    let prompt: string;
    if (p.find === 'speed') {
      answer = Q.of(p.speed);
      prompt = `A cyclist travels ${decimalWords(d)} km in ${timeWords(p.minutes)} at a steady speed. Find the speed in km/h.`;
      steps.push({
        math: `\\text{speed} = ${decimalTex(d)} \\div ${decimalTex(t)} = ${p.speed}`,
        reason: 'Speed is distance divided by time: the distance covered in each hour.',
      });
    } else if (p.find === 'distance') {
      answer = d;
      prompt = `A car travels at ${p.speed} km/h for ${timeWords(p.minutes)}. How far, in km, does it go?`;
      steps.push({
        math: `\\text{distance} = ${p.speed} \\times ${decimalTex(t)} = ${decimalTex(d)}`,
        reason: `Distance is speed times time: ${p.speed} km for every hour.`,
      });
    } else {
      answer = t;
      prompt = `A train travels ${decimalWords(d)} km at ${p.speed} km/h. How long, in hours, does the journey take?`;
      steps.push({
        math: `\\text{time} = ${decimalTex(d)} \\div ${p.speed} = ${decimalTex(t)}`,
        reason:
          'Time is distance divided by speed: how many hours of travel it takes to cover the distance.',
      });
    }
    return {
      prompt: [text(prompt)],
      answer: exactAnswer(answer),
      steps,
      hints: [
        { level: 'nudge', body: [text('Speed in km/h means kilometres travelled in each hour.')] },
        {
          level: 'method',
          body: [
            text(
              'distance = speed × time, speed = distance ÷ time, time = distance ÷ speed. Use hours for the time.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
      ],
    };
  },
  // Independent route: work per minute.
  solveDirectly: (p) => {
    const perMinute = Q.of(p.speed, 60);
    const d = perMinute.mul(Q.of(p.minutes));
    if (p.find === 'speed') return d.div(Q.of(p.minutes)).mul(Q.of(60)).toLatex();
    if (p.find === 'distance') return d.toLatex();
    return d.div(perMinute).div(Q.of(60)).toLatex();
  },
  misconceptions: [
    {
      id: 'speed-formula-mixed-up',
      produce: (p) => {
        const d = distanceQ(p);
        const t = hoursQ(p);
        const wrong =
          p.find === 'speed'
            ? d.mul(t)
            : p.find === 'distance'
              ? Q.of(p.speed).div(t)
              : Q.of(p.speed).div(d);
        const right = p.find === 'speed' ? Q.of(p.speed) : p.find === 'distance' ? d : t;
        return wrong.eq(right) ? null : wrong.toLatex();
      },
    },
    {
      id: 'minutes-as-decimal-hours',
      produce: (p) => {
        if (p.minutes % 60 === 0) return null;
        // 1 hour 30 minutes read as 1.30 hours.
        const h = Math.floor(p.minutes / 60);
        const m = p.minutes % 60;
        const wrongHours = Q.of(h * 100 + m, 100);
        const d = distanceQ(p);
        const wrong = p.find === 'speed' ? d.div(wrongHours) : Q.of(p.speed).mul(wrongHours);
        const right = p.find === 'speed' ? Q.of(p.speed) : d;
        return wrong.eq(right) ? null : wrong.toLatex();
      },
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const right =
      p.find === 'speed' ? Q.of(p.speed) : p.find === 'distance' ? distanceQ(p) : hoursQ(p);
    return [decimalTex(right.mul(Q.of(60))), decimalTex(right.add(Q.of(1)))];
  },
};

export const generators = [defineGenerator(convert), defineGenerator(speed)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'ru-down': defineExample(convert, {
    difficulty: 2,
    params: { chain: [0], down: true, tenths: 35 },
    fade: 'full',
  }),
  'ru-up-wrong': defineExample(convert, {
    difficulty: 2,
    params: { chain: [1], down: false, tenths: 4250 },
    fade: 'full',
    misconception: 'convert-wrong-direction',
  }),
  'ru-two-steps': defineExample(convert, {
    difficulty: 3,
    params: { chain: [0, 1], down: true, tenths: 12 },
    fade: 'last-1',
  }),
  'ru-distance': defineExample<SpeedParams>(speed, {
    difficulty: 3,
    params: { speed: 60, minutes: 90, find: 'distance' },
    fade: 'full',
  }),
  'ru-speed': defineExample<SpeedParams>(speed, {
    difficulty: 2,
    params: { speed: 45, minutes: 120, find: 'speed' },
    fade: 'learner',
  }),
};
