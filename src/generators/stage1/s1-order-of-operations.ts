/**
 * Order of operations: evaluating calculations with brackets, powers, multiplication and division,
 * addition and subtraction; and powers as repeated multiplication. The working is produced by
 * reducing one operation at a time in the conventional order; the answer is checked by parsing
 * the question with the engine and evaluating it exactly.
 */
import { parseLatex } from '../../engine/ce-adapter';
import { exact } from '../../engine/evaluate';
import { Q } from '../../engine/rational';
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

const TOPIC = 's1-order-of-operations';

const intAnswer = (n: number) => ({
  kind: 'number' as const,
  canonical: String(n),
  form: ['integer' as const],
});

/* ---------- Calculation trees ---------- */

type Op = '+' | '-' | '*' | '/';
type Side = 'a' | 'b' | 'base';

export type Calc =
  | { k: 'n'; v: number }
  | { k: 'op'; op: Op; a: Calc; b: Calc; br?: boolean }
  /** A power of a number, or of a bracketed calculation such as (5 − 2)². */
  | { k: 'pow'; base: Calc; e: number };

const n = (v: number): Calc => ({ k: 'n', v });
const op = (o: Op, a: Calc, b: Calc, br = false): Calc => ({ k: 'op', op: o, a, b, br });
const pow = (base: number | Calc, e: number): Calc => ({
  k: 'pow',
  base: typeof base === 'number' ? n(base) : { ...base, ...(base.k === 'op' ? { br: true } : {}) },
  e,
});

const OP_TEX: Record<Op, string> = { '+': '+', '-': '-', '*': '\\times', '/': '\\div' };
const OP_WORD: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };

/** LaTeX for a calculation. A negative number is bracketed unless it leads the whole line. */
export function calcTex(c: Calc, lead = true): string {
  switch (c.k) {
    case 'n':
      return lead ? String(c.v) : signed(c.v);
    case 'pow':
      return `${c.base.k === 'n' ? signed(c.base.v) : calcTex(c.base, false)}^{${c.e}}`;
    case 'op': {
      const inner = `${calcTex(c.a, c.br === true || lead)} ${OP_TEX[c.op]} ${calcTex(c.b, false)}`;
      return c.br ? `\\left(${inner}\\right)` : inner;
    }
  }
}

const apply = (o: Op, a: Q, b: Q) =>
  o === '+' ? a.add(b) : o === '-' ? a.sub(b) : o === '*' ? a.mul(b) : a.div(b);

/** Exact value, following the tree. */
function valueOf(c: Calc): Q {
  switch (c.k) {
    case 'n':
      return Q.of(c.v);
    case 'pow':
      return valueOf(c.base).pow(c.e);
    case 'op':
      return apply(c.op, valueOf(c.a), valueOf(c.b));
  }
}

/** Every intermediate value is a whole number of moderate size, and no division leaves a remainder. */
function clean(c: Calc, limit = 1000): boolean {
  if (c.k === 'n') return true;
  if (c.k === 'pow') return clean(c.base, limit) && Math.abs(valueOf(c).toNumber()) <= limit;
  if (!clean(c.a, limit) || !clean(c.b, limit)) return false;
  if (c.op === '/' && valueOf(c.b).isZero) return false;
  const v = valueOf(c);
  return v.isInteger && Math.abs(v.toNumber()) <= limit;
}

/** Operations ready to do, each ranked: inside brackets first, then powers, then × ÷, then + −. */
interface Candidate {
  path: Side[];
  depth: number;
  /** The innermost bracket the operation sits in, so one bracket is finished before the next. */
  group: string;
  rank: number;
}

function candidates(c: Calc, path: Side[] = [], depth = 0, group = ''): Candidate[] {
  if (c.k === 'n') return [];
  if (c.k === 'pow') {
    return c.base.k === 'n'
      ? [{ path, depth, group, rank: 3 }]
      : candidates(c.base, [...path, 'base'], depth, group);
  }
  const d = depth + (c.br ? 1 : 0);
  const g = c.br ? path.join('.') : group;
  const inner = [
    ...candidates(c.a, [...path, 'a'], d, g),
    ...candidates(c.b, [...path, 'b'], d, g),
  ];
  if (c.a.k === 'n' && c.b.k === 'n') {
    inner.push({ path, depth: d, group: g, rank: c.op === '*' || c.op === '/' ? 2 : 1 });
  }
  return inner;
}

function child(c: Calc, side: Side): Calc {
  if (side === 'base') return c.k === 'pow' ? c.base : c;
  return c.k === 'op' ? c[side] : c;
}

const at = (c: Calc, path: Side[]) => path.reduce(child, c);

function replace(c: Calc, path: Side[], value: number): Calc {
  const [side, ...rest] = path;
  if (side === undefined) return n(value);
  if (side === 'base' && c.k === 'pow') return { ...c, base: replace(c.base, rest, value) };
  if (side !== 'base' && c.k === 'op') return { ...c, [side]: replace(c[side], rest, value) };
  return c;
}

const POWER_WORD = (e: number) => (e === 2 ? 'squared' : e === 3 ? 'cubed' : `to the power ${e}`);

/** "4 × 4 × 4" for a power, in running text. */
const repeated = (base: number, e: number) =>
  Array.from({ length: e }, () => (base < 0 ? `(${words(base)})` : String(base))).join(' × ');

/** The working: one operation per line, in the conventional order. */
export function reduce(start: Calc): SolutionStep[] {
  const steps: SolutionStep[] = [];
  let current = start;
  const question = calcTex(start);
  for (;;) {
    const all = candidates(current);
    if (all.length === 0) break;
    // Deepest brackets first, the leftmost of those, then the highest rank. Candidates are
    // collected left to right, so on a tie the first (leftmost) one is kept.
    const deepest = Math.max(...all.map((c) => c.depth));
    const group = all.find((c) => c.depth === deepest)?.group;
    const best = all
      .filter((c) => c.depth === deepest && c.group === group)
      .reduce((x, y) => (y.rank > x.rank ? y : x));
    const node = at(current, best.path);
    const v = valueOf(node).toNumber();
    let reason = '';
    if (node.k === 'pow' && node.base.k === 'n') {
      const base = node.base.v;
      reason = `Powers come before multiplying and adding: ${words(base)} ${POWER_WORD(node.e)} is ${repeated(base, node.e)} = ${words(v)}.`;
    } else if (node.k === 'op') {
      const a = valueOf(node.a).toNumber();
      const b = valueOf(node.b).toNumber();
      const sum = `${words(a)} ${OP_WORD[node.op]} ${b < 0 ? `(${words(b)})` : words(b)} = ${words(v)}`;
      reason =
        best.depth > 0
          ? `Work inside the brackets first: ${sum}.`
          : best.rank === 2
            ? `Multiplication and division come next, working from left to right: ${sum}.`
            : `Addition and subtraction come last, working from left to right: ${sum}.`;
    }
    current = replace(current, best.path, v);
    steps.push({
      math: `${steps.length === 0 ? `${question} ` : ''}= ${calcTex(current)}`,
      reason,
    });
  }
  return steps;
}

/* ---------- Faulty orders, for the misconceptions ---------- */

/** Strictly left to right (brackets and powers still respected), the way the line reads. */
function leftToRight(c: Calc): Q | null {
  const atoms: Q[] = [];
  const ops: Op[] = [];
  const atom = (node: Calc): Q | null => {
    if (node.k === 'n') return Q.of(node.v);
    if (node.k === 'pow') return atom(node.base)?.pow(node.e) ?? null;
    return leftToRight({ ...node, br: false });
  };
  const flatten = (node: Calc): boolean => {
    if (node.k === 'op' && !node.br) {
      if (!flatten(node.a)) return false;
      ops.push(node.op);
      return flatten(node.b);
    }
    const v = atom(node);
    if (v === null) return false;
    atoms.push(v);
    return true;
  };
  if (!flatten(c)) return null;
  let acc = atoms[0] as Q;
  for (const [i, o] of ops.entries()) {
    const b = atoms[i + 1] as Q;
    if (o === '/' && b.isZero) return null;
    acc = apply(o, acc, b);
  }
  return acc;
}

/** Powers read as multiplication by the exponent: 3² as 3 × 2. */
function powerAsProduct(c: Calc): Q | null {
  if (c.k === 'n') return Q.of(c.v);
  if (c.k === 'pow') return powerAsProduct(c.base)?.mul(Q.of(c.e)) ?? null;
  const a = powerAsProduct(c.a);
  const b = powerAsProduct(c.b);
  if (a === null || b === null || (c.op === '/' && b.isZero)) return null;
  return apply(c.op, a, b);
}

const hasPower = (c: Calc): boolean =>
  c.k === 'pow' || (c.k === 'op' && (hasPower(c.a) || hasPower(c.b)));

/* ---------- Skill 1: evaluate a calculation ---------- */

export interface EvaluateParams {
  calc: Calc;
}

const TEMPLATES: Record<Difficulty, ((r: Rng) => Calc)[]> = {
  1: [
    (r) => op('+', n(r.int(2, 20)), op('*', n(r.int(2, 9)), n(r.int(2, 9)))),
    (r) => op('-', op('*', n(r.int(3, 9)), n(r.int(3, 9))), n(r.int(1, 9))),
    (r) => op('*', op('+', n(r.int(2, 9)), n(r.int(2, 9)), true), n(r.int(2, 6))),
    (r) => {
      const c = r.int(2, 6);
      return op('-', n(r.int(12, 30)), op('/', n(c * r.int(2, 5)), n(c)));
    },
    (r) =>
      op('+', op('*', n(r.int(2, 6)), n(r.int(2, 6))), op('*', n(r.int(2, 6)), n(r.int(2, 6)))),
  ],
  2: [
    (r) => op('+', n(r.int(2, 20)), r.bool() ? pow(r.int(2, 9), 2) : pow(r.int(2, 4), 3)),
    (r) => {
      const b = r.int(1, 6);
      return op('*', pow(op('-', n(r.int(b + 2, b + 6)), n(b)), 2), n(r.int(2, 4)));
    },
    (r) => {
      const b = r.int(2, 6);
      return op('*', op('/', n(b * r.int(2, 9)), n(b)), n(r.int(2, 6)));
    },
    (r) => op('-', op('*', n(r.int(2, 5)), pow(r.int(2, 5), 2)), n(r.int(1, 20))),
    (r) => op('-', pow(r.int(3, 9), 2), op('*', n(r.int(2, 6)), n(r.int(2, 6)))),
  ],
  3: [
    (r) => {
      const inner = op('-', n(r.int(1, 12)), op('*', n(r.int(2, 5)), n(r.int(2, 5))));
      const v = valueOf(inner).toNumber();
      const divisors = [2, 3, 4, 5, 6, 9].filter((d) => v !== 0 && (v * v) % d === 0);
      return op('/', pow(inner, 2), n(divisors.length > 0 ? r.pick(divisors) : 7));
    },
    (r) =>
      op(
        '-',
        n(r.int(1, 20)),
        op('*', pow(op('-', n(r.int(1, 6)), n(r.int(7, 12))), 2), n(r.int(2, 3))),
      ),
    (r) => {
      const d = r.int(2, 6);
      return op('+', op('*', n(-r.int(2, 9)), n(r.int(2, 9))), op('/', n(d * r.int(2, 9)), n(-d)));
    },
    (r) =>
      op(
        '*',
        op('+', n(r.int(2, 9)), n(-r.int(2, 12)), true),
        op('-', n(r.int(2, 9)), pow(r.int(2, 3), 2), true),
      ),
  ],
};

function sampleEvaluate(rng: Rng, difficulty: Difficulty): EvaluateParams {
  for (;;) {
    const calc = rng.pick(TEMPLATES[difficulty])(rng);
    if (clean(calc) && !valueOf(calc).isZero) return { calc };
  }
}

function buildEvaluate(p: EvaluateParams): BuiltProblem {
  const steps = reduce(p.calc);
  const value = valueOf(p.calc).toNumber();
  return {
    prompt: [text('Calculate '), math(calcTex(p.calc)), text('.')],
    answer: intAnswer(value),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [text('Not everything is done from left to right. Which operation comes first?')],
      },
      {
        level: 'method',
        body: [
          text(
            'Brackets first, then powers, then multiplication and division from left to right, then addition and subtraction from left to right.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? calcTex(p.calc))] },
    ],
  };
}

export const evaluate: Generator<EvaluateParams> = {
  id: `${TOPIC}/evaluate`,
  version: 1,
  topicId: TOPIC,
  title: 'Use the order of operations',
  sample: sampleEvaluate,
  build: buildEvaluate,
  // Independent route: the engine parses the question as written and evaluates it exactly.
  solveDirectly: (p) => (exact(parseLatex(calcTex(p.calc))) ?? Q.of(0)).toLatex(),
  misconceptions: [
    {
      id: 'left-to-right-ignoring-precedence',
      produce: (p) => {
        const wrong = leftToRight(p.calc);
        return wrong === null || wrong.eq(valueOf(p.calc)) ? null : wrong.toLatex();
      },
      wrongSteps: (p) => {
        const wrong = leftToRight(p.calc) ?? Q.of(0);
        return [
          {
            math: `${calcTex(p.calc)} = ${wrong.toLatex()}`,
            reason:
              'Work through the line from left to right, one operation after another, as if reading a sentence.',
          },
        ];
      },
    },
    {
      id: 'multiply-base-by-exponent',
      produce: (p) => {
        if (!hasPower(p.calc)) return null;
        const wrong = powerAsProduct(p.calc);
        return wrong === null || wrong.eq(valueOf(p.calc)) ? null : wrong.toLatex();
      },
    },
  ],
  equivalents: (p) => [`\\left(${valueOf(p.calc).toLatex()}\\right)`],
  nearMisses: (p) => {
    const v = valueOf(p.calc).toNumber();
    return [String(v + 1), String(v - 1), ...(v === 0 ? [] : [String(-v)])];
  },
};

/* ---------- Skill 2: powers ---------- */

export interface PowerParams {
  base: number;
  e: number;
  /** For a negative base: written in brackets, (−3)², or without, −3². */
  bracketed: boolean;
}

function samplePower(rng: Rng, difficulty: Difficulty): PowerParams {
  if (difficulty === 1) {
    const e = rng.pick([2, 2, 3, 4, 5]);
    const max = { 2: 15, 3: 6, 4: 4, 5: 3 }[e] ?? 3;
    return { base: rng.int(2, max), e, bracketed: false };
  }
  const e = rng.pick([2, 2, 3, 4, 5]);
  const max = { 2: 15, 3: 6, 4: 5, 5: 3 }[e] ?? 3;
  const base = -rng.int(2, max);
  return { base, e, bracketed: difficulty === 2 ? true : rng.bool() };
}

/** The power as written: 3⁴, (−3)⁴ or −3⁴. */
const powerQuestion = (p: PowerParams) =>
  p.base < 0 && !p.bracketed ? `-${-p.base}^{${p.e}}` : `${signed(p.base)}^{${p.e}}`;

const powerValue = (p: PowerParams) =>
  p.base < 0 && !p.bracketed ? -((-p.base) ** p.e) : p.base ** p.e;

function buildPower(p: PowerParams): BuiltProblem {
  const question = powerQuestion(p);
  const v = powerValue(p);
  const steps: SolutionStep[] = [];
  if (p.base < 0 && !p.bracketed) {
    const size = -p.base;
    steps.push({
      math: `${question} = -\\left(${Array.from({ length: p.e }, () => size).join(' \\times ')}\\right)`,
      reason: `With no brackets, the power applies only to ${size}, not to the minus sign. Work out ${size} ${POWER_WORD(p.e)}, then make it negative.`,
    });
  } else {
    const factor = signed(p.base);
    steps.push({
      math: `${question} = ${Array.from({ length: p.e }, () => factor).join(' \\times ')}`,
      reason: `The exponent ${p.e} means ${p.e} copies of the base ${words(p.base)}, multiplied together.`,
    });
  }
  steps.push({
    math: `= ${v}`,
    reason:
      p.base < 0 && p.bracketed
        ? `Each pair of negatives makes a positive. ${p.e % 2 === 0 ? 'Every minus sign is paired, so the answer is positive.' : 'One minus sign is left over, so the answer is negative.'}`
        : 'Multiply.',
  });
  return {
    prompt: [text('Calculate '), math(question), text('.')],
    answer: intAnswer(v),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text(
            'An exponent counts copies of the base multiplied together, not something to multiply by.',
          ),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            p.base < 0
              ? 'Check the brackets: with brackets the minus sign is part of the base; without them, the power is worked out first and the minus sign applies afterwards.'
              : 'Write out the copies of the base and multiply them.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const powers: Generator<PowerParams> = {
  id: `${TOPIC}/powers`,
  version: 1,
  topicId: TOPIC,
  title: 'Calculate powers',
  sample: samplePower,
  build: buildPower,
  solveDirectly: (p) => (exact(parseLatex(powerQuestion(p))) ?? Q.of(0)).toLatex(),
  misconceptions: [
    {
      id: 'multiply-base-by-exponent',
      produce: (p) => {
        const wrong = p.base * p.e;
        return wrong === powerValue(p) ? null : String(wrong);
      },
      wrongSteps: (p) => [
        {
          math: `${powerQuestion(p)} = ${signed(p.base)} \\times ${p.e}`,
          reason: 'Read the exponent as a number to multiply by.',
        },
        { math: `= ${p.base * p.e}`, reason: 'Multiply.' },
      ],
    },
    {
      id: 'minus-sign-and-powers',
      produce: (p) => {
        if (p.base > 0) return null;
        const other = p.bracketed ? -((-p.base) ** p.e) : p.base ** p.e;
        return other === powerValue(p) ? null : String(other);
      },
    },
  ],
  equivalents: (p) => [`\\left(${powerValue(p)}\\right)`],
  nearMisses: (p) => {
    const v = powerValue(p);
    return [String(v + 1), String(v - 1)];
  },
};

export const generators = [defineGenerator(evaluate), defineGenerator(powers)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'oo-multiply-first': defineExample<EvaluateParams>(evaluate, {
    difficulty: 1,
    params: { calc: op('+', n(2), op('*', n(3), n(4))) },
    fade: 'full',
  }),
  'oo-wrong': defineExample<EvaluateParams>(evaluate, {
    difficulty: 1,
    params: { calc: op('+', n(2), op('*', n(3), n(4))) },
    fade: 'full',
    misconception: 'left-to-right-ignoring-precedence',
  }),
  'oo-brackets-powers': defineExample<EvaluateParams>(evaluate, {
    difficulty: 2,
    params: { calc: op('-', op('*', n(4), pow(3, 2)), op('/', n(10), n(2))) },
    fade: 'last-2',
  }),
  'oo-power': defineExample<PowerParams>(powers, {
    difficulty: 1,
    params: { base: 2, e: 5, bracketed: false },
    fade: 'full',
  }),
  'oo-negative-power': defineExample<PowerParams>(powers, {
    difficulty: 3,
    params: { base: -3, e: 2, bracketed: false },
    fade: 'learner',
  }),
};
