/**
 * Fractional exponents: evaluate a^(m/n), and convert between exponent form and radical form.
 * Every number in a problem, step, hint or worked example comes from the parameters below.
 */
import type { Rng } from '../../engine/rng';
import { exactRoot, gcd, Q } from '../../engine/rational';
import type { RichText, SolutionStep } from '../../engine/types';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's2-fractional-exponents';

/* ---------- Shared notation ---------- */

const ORDINAL: Record<number, string> = { 4: 'fourth', 5: 'fifth', 6: 'sixth' };

/** "square root", "cube root", "fourth root". */
export function rootName(n: number): string {
  if (n === 2) return 'square root';
  if (n === 3) return 'cube root';
  return `${ORDINAL[n] ?? `${n}th`} root`;
}

const UNIT_FRACTION: Record<number, string> = {
  2: 'one half',
  3: 'one third',
  4: 'one quarter',
  5: 'one fifth',
};

/** "one third" for 1/3; "1/7" beyond fifths. */
const oneOver = (n: number) => UNIT_FRACTION[n] ?? `1/${n}`;

const rootTex = (n: number, inside: string) =>
  n === 2 ? `\\sqrt{${inside}}` : `\\sqrt[${n}]{${inside}}`;

/** The exponent m/n as LaTeX, sign in front: `\frac{2}{3}`, `-\frac{1}{2}`. */
function expTex(m: number, n: number): string {
  if (n === 1) return String(m);
  const sign = m < 0 ? '-' : '';
  return `${sign}\\frac{${Math.abs(m)}}{${n}}`;
}

/** A base for display: `8`, or `\left(\frac{8}{27}\right)` for a fraction. */
const baseTex = (b: Q) => (b.isInteger ? b.toLatex() : `\\left(${b.toLatex()}\\right)`);

const powerWord = (k: number) => (k === 2 ? 'squared' : k === 3 ? 'cubed' : `to the power ${k}`);

const coprime = (a: number, b: number) => gcd(BigInt(a), BigInt(b)) === 1n;

const text = (v: string) => ({ t: 'text', v }) as const;
const math = (v: string) => ({ t: 'math', v }) as const;

/* ---------- Skill 1: evaluate a^(m/n) ---------- */

export interface EvaluateParams {
  /** The n-th root of the base, so the base is root^n. */
  root: { n: number; d: number };
  /** Exponent m/n, in lowest terms, m may be negative. */
  m: number;
  n: number;
}

const rootQ = (p: EvaluateParams) => Q.of(p.root.n, p.root.d);
const baseQ = (p: EvaluateParams) => rootQ(p).pow(p.n);
const valueQ = (p: EvaluateParams) => rootQ(p).pow(p.m);

function sampleEvaluate(rng: Rng, difficulty: Difficulty): EvaluateParams {
  for (;;) {
    if (difficulty === 1) {
      const n = rng.pick([2, 2, 3, 3, 4, 5]);
      const maxRoot = { 2: 15, 3: 6, 4: 4, 5: 3 }[n] ?? 3;
      return { root: { n: rng.int(2, maxRoot), d: 1 }, m: 1, n };
    }
    if (difficulty === 2) {
      const n = rng.pick([2, 3, 3, 4, 5]);
      const m = rng.pick([2, 3, 4, 5].filter((k) => k !== n && coprime(k, n)));
      const r = rng.int(2, 6);
      if (r ** n > 1024 || r ** m > 1000) continue;
      return { root: { n: r, d: 1 }, m, n };
    }
    // Difficulty 3: negative exponents and fraction bases.
    const n = rng.pick([2, 3, 4]);
    const k = rng.pick([1, 2, 3].filter((x) => coprime(x, n)));
    const fraction = rng.bool(0.6);
    const top = fraction ? rng.int(1, 5) : rng.int(2, 6);
    const bottom = fraction ? rng.int(2, 6) : 1;
    if (!coprime(top, bottom) || top === bottom) continue;
    const negative = fraction ? rng.bool(0.6) : true;
    if (top ** n > 1024 || bottom ** n > 1024 || top ** k > 1000 || bottom ** k > 1000) continue;
    return { root: { n: top, d: bottom }, m: negative ? -k : k, n };
  }
}

function evaluateQuestion(p: EvaluateParams): string {
  return `${baseTex(baseQ(p))}^{${expTex(p.m, p.n)}}`;
}

/** A rational in running text: "8" or "8/27" (reasons are plain text, not LaTeX). */
const plain = (q: Q) => (q.isInteger ? q.toString() : `${q.n}/${q.d}`);

/** Explains why root^n = base: "2 × 2 × 2 = 8". */
function rootReason(r: Q, n: number, b: Q): string {
  const factor = plain(r);
  const product = Array.from({ length: n }, () => factor).join(' × ');
  const base = plain(b);
  return `The ${rootName(n)} of ${base} is ${factor}, because ${product} = ${base}.`;
}

function buildEvaluate(p: EvaluateParams): BuiltProblem {
  const b = baseQ(p);
  const r = rootQ(p);
  const k = Math.abs(p.m);
  const value = valueQ(p);
  const steps: SolutionStep[] = [];
  const question = evaluateQuestion(p);

  // A negative exponent first becomes a reciprocal: flip a fraction, or put 1 over a whole number.
  let wrap = (inner: string) => inner;
  let base = b;
  let rr = r;
  if (p.m < 0) {
    if (b.isInteger) {
      wrap = (inner) => `\\frac{1}{${inner}}`;
      steps.push({
        math: `${question} = \\frac{1}{${baseTex(b)}^{${expTex(k, p.n)}}}`,
        reason: 'A negative exponent means one over the power with the positive exponent.',
      });
    } else {
      base = Q.of(1).div(b);
      rr = Q.of(1).div(r);
      steps.push({
        math: `${question} = ${baseTex(base)}^{${expTex(k, p.n)}}`,
        reason:
          'A negative exponent means the reciprocal: flip the fraction and make the exponent positive.',
      });
    }
  }
  const prefix = steps.length === 0 ? `${question} = ` : '= ';
  if (k === 1) {
    steps.push({
      math: `${prefix}${wrap(rootTex(p.n, base.toLatex()))}`,
      reason: `An exponent of ${oneOver(p.n)} means the ${rootName(p.n)}.`,
    });
    steps.push({ math: `= ${value.toLatex()}`, reason: rootReason(rr, p.n, base) });
  } else {
    steps.push({
      math: `${prefix}${wrap(`\\left(${rootTex(p.n, base.toLatex())}\\right)^{${k}}`)}`,
      reason: `The denominator ${p.n} means take the ${rootName(p.n)}; the numerator ${k} means raise the result to the power ${k}.`,
    });
    steps.push({ math: `= ${wrap(`${baseTex(rr)}^{${k}}`)}`, reason: rootReason(rr, p.n, base) });
    steps.push({
      math: `= ${value.toLatex()}`,
      reason: `${plain(rr)} ${powerWord(k)} is ${plain(rr.pow(k))}.${p.m < 0 && b.isInteger ? ' So the answer is one over that.' : ''}`,
    });
  }

  const asFraction = !value.isInteger;
  const prompt: RichText = [
    text('Evaluate '),
    math(question),
    text(asFraction ? '. Give your answer as a fraction in its simplest form.' : '.'),
  ];
  return {
    prompt,
    answer: {
      kind: 'number',
      canonical: value.toLatex(),
      form: ['simplified-fraction'],
    },
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text(
            p.m < 0
              ? 'The minus sign in the exponent means a reciprocal; the denominator tells you which root to take.'
              : 'The denominator of the exponent tells you which root to take.',
          ),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            'Take the root first, then raise to the power. Doing the root first keeps the numbers small.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? question)] },
    ],
  };
}

export const evaluate: Generator<EvaluateParams> = {
  id: `${TOPIC}/evaluate`,
  version: 1,
  topicId: TOPIC,
  title: 'Evaluate fractional powers',
  sample: sampleEvaluate,
  build: buildEvaluate,
  // Independent route: power first, then the root (build takes the root first).
  solveDirectly: (p) => {
    const powered = baseQ(p).pow(p.m);
    const root = exactRoot(powered, p.n);
    if (!root) throw new Error('base is not a perfect power');
    return root.toLatex();
  },
  misconceptions: [
    {
      id: 'fractional-exponent-divides-base',
      produce: (p) => {
        if (p.m !== 1) return null;
        const wrong = baseQ(p).div(Q.of(p.n));
        return wrong.eq(valueQ(p)) ? null : wrong.toLatex();
      },
    },
    {
      id: 'fractional-exponent-multiplies-base',
      produce: (p) => {
        const wrong = baseQ(p).mul(Q.of(p.m, p.n));
        return wrong.eq(valueQ(p)) ? null : wrong.toLatex();
      },
      wrongSteps: (p) => {
        const wrong = baseQ(p).mul(Q.of(p.m, p.n));
        return [
          {
            math: `${evaluateQuestion(p)} = ${baseQ(p).toLatex()} \\times ${expTex(p.m, p.n)}`,
            reason: 'Treat the exponent as something to multiply by.',
          },
          { math: `= ${wrong.toLatex()}`, reason: 'Multiply.' },
        ];
      },
    },
    {
      id: 'fractional-exponent-ignore-numerator',
      produce: (p) => {
        if (Math.abs(p.m) === 1) return null;
        const wrong = p.m < 0 ? Q.of(1).div(rootQ(p)) : rootQ(p);
        return wrong.eq(valueQ(p)) ? null : wrong.toLatex();
      },
    },
    {
      id: 'negative-exponent-gives-negative',
      produce: (p) => (p.m < 0 ? valueQ(p).pow(-1).neg().toLatex() : null),
    },
  ],
  equivalents: (p) => {
    const v = valueQ(p);
    const out = [`\\left(${v.toLatex()}\\right)`];
    if (!v.isInteger && v.n > v.d) out.push(`${v.n / v.d}\\frac{${v.n % v.d}}{${v.d}}`);
    return out;
  },
  nearMisses: (p) => {
    const v = valueQ(p);
    const out = [v.add(Q.of(1)).toLatex(), v.mul(Q.of(2)).toLatex()];
    if (!v.eq(Q.of(1).div(v))) out.push(Q.of(1).div(v).toLatex());
    return out;
  },
};

/* ---------- Skills 2 and 3: radical form and exponent form ---------- */

export interface ConvertParams {
  letter: string;
  /** Coefficient (1 means none). */
  c: number;
  m: number;
  n: number;
}

// No k, m or n: those name the coefficient and exponent in prompts and hints.
const LETTERS = ['x', 'y', 'a', 'b', 'p', 't', 'w', 'z'];

function sampleConvert(rng: Rng, difficulty: Difficulty): ConvertParams {
  const letter = rng.pick(LETTERS);
  const n = rng.pick([2, 3, 4, 5]);
  if (difficulty === 1) return { letter, c: 1, m: 1, n };
  const m = rng.pick(
    [1, 2, 3, 4, 5, 7].filter((k) => k !== n && coprime(k, n) && (k > 1 || difficulty === 3)),
  );
  if (difficulty === 2) return { letter, c: 1, m, n };
  return { letter, c: rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9]), m: -m, n };
}

const coef = (c: number) => (c === 1 ? '' : String(c));
const radical = (p: ConvertParams) =>
  rootTex(p.n, Math.abs(p.m) === 1 ? p.letter : `${p.letter}^{${Math.abs(p.m)}}`);
/** The value in exponent form: `5x^{-\frac{2}{3}}`. */
const exponentForm = (p: ConvertParams) => `${coef(p.c)}${p.letter}^{${expTex(p.m, p.n)}}`;
/** The value in radical form: `\frac{5}{\sqrt[3]{x^{2}}}`. */
const radicalForm = (p: ConvertParams) =>
  p.m < 0 ? `\\frac{${p.c}}{${radical(p)}}` : `${coef(p.c)}${radical(p)}`;

const convertDomain = (p: ConvertParams) => ({ ranges: { [p.letter]: [0.2, 6] as const } });

const splitExponentStep = (p: ConvertParams): SolutionStep => ({
  math: `${p.letter}^{${expTex(Math.abs(p.m), p.n)}} = \\left(${p.letter}^{${Math.abs(p.m)}}\\right)^{\\frac{1}{${p.n}}}`,
  reason: `Split the exponent: ${Math.abs(p.m)}/${p.n} is ${Math.abs(p.m)} × 1/${p.n}, and a power of a power multiplies the exponents.`,
});

export const toRadical: Generator<ConvertParams> = {
  id: `${TOPIC}/to-radical`,
  version: 1,
  topicId: TOPIC,
  title: 'Write in radical form',
  sample: sampleConvert,
  build: (p, difficulty) => {
    const k = Math.abs(p.m);
    const start = exponentForm(p);
    const steps: SolutionStep[] = [];
    if (p.m < 0) {
      steps.push({
        math: `${start} = \\frac{${p.c}}{${p.letter}^{${expTex(k, p.n)}}}`,
        reason: 'A negative exponent means one over the power with the positive exponent.',
      });
    } else if (k > 1) {
      steps.push(splitExponentStep(p));
    }
    steps.push({
      math: `${steps.length === 0 ? `${start} ` : ''}= ${radicalForm(p)}`,
      reason:
        k === 1
          ? `An exponent of ${oneOver(p.n)} means the ${rootName(p.n)}.`
          : `An exponent of ${oneOver(p.n)} means the ${rootName(p.n)}, so this is the ${rootName(p.n)} of ${p.letter} to the power ${k}.`,
    });
    return {
      prompt: [
        text('Write '),
        math(exponentForm(p)),
        text(
          difficulty === 3
            ? ' in radical form, using a root sign, with no negative or fractional exponents.'
            : ' in radical form, using a root sign instead of a fractional exponent.',
        ),
      ],
      answer: {
        kind: 'expression',
        canonical: radicalForm(p),
        form: difficulty === 3 ? ['radical-form', 'positive-exponents'] : ['radical-form'],
        domain: convertDomain(p),
      },
      steps,
      hints: [
        {
          level: 'nudge',
          body: [
            text(
              'The denominator of the exponent becomes the root; the numerator stays as a power.',
            ),
          ],
        },
        {
          level: 'method',
          body: [
            text(
              p.m < 0
                ? 'First deal with the minus sign by writing one over the power. Then use '
                : 'Use ',
            ),
            math(`${p.letter}^{\\frac{m}{n}} = \\sqrt[n]{${p.letter}^{m}}`),
            text('.'),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? radicalForm(p))] },
      ],
    };
  },
  solveDirectly: exponentForm,
  misconceptions: [
    {
      id: 'swap-root-and-power',
      produce: (p) => {
        const k = Math.abs(p.m);
        if (k === 1) return null;
        const swapped = rootTex(k, `${p.letter}^{${p.n}}`);
        return p.m < 0 ? `\\frac{${p.c}}{${swapped}}` : `${coef(p.c)}${swapped}`;
      },
    },
    {
      id: 'fractional-exponent-divides-base',
      produce: (p) => (p.m === 1 && p.c === 1 ? `\\frac{${p.letter}}{${p.n}}` : null),
    },
    {
      id: 'negative-exponent-gives-negative',
      produce: (p) => (p.m < 0 ? `-${coef(p.c)}${radical(p)}` : null),
    },
  ],
  equivalents: (p) => {
    const k = Math.abs(p.m);
    if (k === 1) return [];
    const outer = `\\left(${rootTex(p.n, p.letter)}\\right)^{${k}}`;
    return [p.m < 0 ? `\\frac{${p.c}}{${outer}}` : `${coef(p.c)}${outer}`];
  },
  nearMisses: (p) => {
    const k = Math.abs(p.m);
    const wrongRoot = rootTex(p.n + 1, k === 1 ? p.letter : `${p.letter}^{${k}}`);
    const wrongPower = rootTex(p.n, `${p.letter}^{${k + 1}}`);
    const wrap = (r: string) => (p.m < 0 ? `\\frac{${p.c}}{${r}}` : `${coef(p.c)}${r}`);
    const out = [wrap(wrongRoot), wrap(wrongPower)];
    if (p.m < 0) out.push(`${coef(p.c)}${radical(p)}`);
    return out;
  },
};

export const toExponent: Generator<ConvertParams> = {
  id: `${TOPIC}/to-exponent`,
  version: 1,
  topicId: TOPIC,
  title: 'Write in exponent form',
  sample: sampleConvert,
  build: (p, difficulty) => {
    const k = Math.abs(p.m);
    const steps: SolutionStep[] = [];
    if (p.m < 0) {
      steps.push({
        math: `${radicalForm(p)} = \\frac{${p.c}}{${p.letter}^{${expTex(k, p.n)}}}`,
        reason: `The ${rootName(p.n)} of ${p.letter}${k === 1 ? '' : ` to the power ${k}`} is ${p.letter} to the power ${k}/${p.n}.`,
      });
      steps.push({
        math: `= ${exponentForm(p)}`,
        reason:
          'Dividing by a power is the same as multiplying by that power with a negative exponent.',
      });
    } else if (k === 1) {
      steps.push({
        math: `${radicalForm(p)} = ${exponentForm(p)}`,
        reason: `The ${rootName(p.n)} is the same as an exponent of ${oneOver(p.n)}.`,
      });
    } else {
      steps.push({
        math: `${radicalForm(p)} = \\left(${p.letter}^{${k}}\\right)^{\\frac{1}{${p.n}}}`,
        reason: `The ${rootName(p.n)} is the same as an exponent of ${oneOver(p.n)}.`,
      });
      steps.push({
        math: `= ${exponentForm(p)}`,
        reason: `A power of a power multiplies the exponents: ${k} × 1/${p.n} = ${k}/${p.n}.`,
      });
    }
    const target = difficulty === 3 ? 'kx^{n}' : 'x^{n}';
    return {
      prompt: [
        text('Write '),
        math(radicalForm(p)),
        text(' in the form '),
        math(target.replace('x', p.letter)),
        text(difficulty === 3 ? ', where k and n are numbers.' : ', where n is a number.'),
      ],
      answer: {
        kind: 'expression',
        canonical: exponentForm(p),
        form: difficulty === 3 ? ['power-term'] : ['single-power'],
        domain: convertDomain(p),
      },
      steps,
      hints: [
        { level: 'nudge', body: [text('A root can always be written as a fractional exponent.')] },
        {
          level: 'method',
          body: [
            text('Use '),
            math(`\\sqrt[n]{${p.letter}^{m}} = ${p.letter}^{\\frac{m}{n}}`),
            text(
              p.m < 0
                ? ', then move the power up from the denominator by making its exponent negative.'
                : '.',
            ),
          ],
        },
        { level: 'first-step', body: [math(steps[0]?.math ?? exponentForm(p))] },
      ],
    };
  },
  solveDirectly: radicalForm,
  misconceptions: [
    {
      id: 'swap-root-and-power',
      produce: (p) => `${coef(p.c)}${p.letter}^{${expTex(Math.sign(p.m) * p.n, Math.abs(p.m))}}`,
    },
    {
      id: 'negative-exponent-gives-negative',
      produce: (p) => (p.m < 0 ? `-${coef(p.c)}${p.letter}^{${expTex(-p.m, p.n)}}` : null),
    },
  ],
  equivalents: (p) => {
    const decimal = Q.of(p.m, p.n);
    const terminating = [2, 4, 5].includes(p.n);
    return terminating ? [`${coef(p.c)}${p.letter}^{${String(decimal.toNumber())}}`] : [];
  },
  nearMisses: (p) => [
    `${coef(p.c)}${p.letter}^{${expTex(p.m, p.n + 1)}}`,
    `${coef(p.c)}${p.letter}^{${expTex(p.m + Math.sign(p.m), p.n)}}`,
    ...(p.m < 0 ? [`${coef(p.c)}${p.letter}^{${expTex(-p.m, p.n)}}`] : []),
  ],
};

export const generators = [
  defineGenerator(evaluate),
  defineGenerator(toRadical),
  defineGenerator(toExponent),
];

/* ---------- Worked examples (CONTENT_GUIDE section 5) ---------- */

export const examples: Record<string, ExampleSpec> = {
  'fe-unit': defineExample(evaluate, {
    difficulty: 1,
    params: { root: { n: 4, d: 1 }, m: 1, n: 3 },
    fade: 'full',
  }),
  'fe-power': defineExample(evaluate, {
    difficulty: 2,
    params: { root: { n: 2, d: 1 }, m: 2, n: 3 },
    fade: 'full',
  }),
  'fe-faded': defineExample(evaluate, {
    difficulty: 2,
    params: { root: { n: 2, d: 1 }, m: 3, n: 4 },
    fade: 'last-2',
  }),
  'fe-negative': defineExample(evaluate, {
    difficulty: 3,
    params: { root: { n: 3, d: 1 }, m: -2, n: 3 },
    fade: 'learner',
  }),
  'fe-radical': defineExample(toRadical, {
    difficulty: 2,
    params: { letter: 'x', c: 1, m: 3, n: 4 },
    fade: 'full',
  }),
  'fe-wrong': defineExample(evaluate, {
    difficulty: 2,
    params: { root: { n: 2, d: 1 }, m: 2, n: 3 },
    fade: 'full',
    misconception: 'fractional-exponent-multiplies-base',
  }),
};
