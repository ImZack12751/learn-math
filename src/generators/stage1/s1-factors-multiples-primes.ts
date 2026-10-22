/**
 * Factors, multiples and primes: prime factorisation, the highest common factor and the lowest
 * common multiple. Every number comes from the parameters below; the answers are checked against
 * a search over all candidates.
 */
import type { Rng } from '../../engine/rng';
import type { SolutionStep } from '../../engine/types';
import {
  gcdInt,
  indexFormTex,
  isPrime,
  lcmInt,
  math,
  primeFactors,
  primePowers,
  repeatedTex,
  text,
} from '../_shared/notation';
import {
  defineExample,
  defineGenerator,
  type BuiltProblem,
  type Difficulty,
  type ExampleSpec,
  type Generator,
} from '../types';

const TOPIC = 's1-factors-multiples-primes';

const intAnswer = (v: number) => ({
  kind: 'number' as const,
  canonical: String(v),
  form: ['integer' as const],
});

/* ---------- Skill 1: prime factorisation ---------- */

export interface FactoriseParams {
  n: number;
}

function sampleFactorise(rng: Rng, difficulty: Difficulty): FactoriseParams {
  for (;;) {
    const n =
      difficulty === 1 ? rng.int(12, 60) : difficulty === 2 ? rng.int(60, 250) : rng.int(250, 1000);
    const factors = primeFactors(n);
    const distinct = new Set(factors).size;
    if (isPrime(n) || factors.length < 3 || Math.max(...factors) > 13) continue;
    if (difficulty === 3 && distinct < 3) continue;
    if (difficulty === 2 && !primePowers(n).some(([, k]) => k >= 2)) continue;
    return { n };
  }
}

/** The factor ladder: divide by the smallest prime that goes, one line per division. */
function ladder(n: number): SolutionStep[] {
  const steps: SolutionStep[] = [];
  const found: number[] = [];
  let rest = n;
  while (!isPrime(rest)) {
    let p = 2;
    while (rest % p !== 0) p++;
    found.push(p);
    const before = rest;
    rest /= p;
    steps.push({
      math: `${steps.length === 0 ? `${n} ` : ''}= ${repeatedTex([...found, rest])}`,
      reason:
        p === 2
          ? `${before} is even, so 2 is a factor: ${before} = 2 × ${rest}.`
          : `${before} is not divisible by any smaller prime, but it is divisible by ${p}: ${before} = ${p} × ${rest}.`,
    });
  }
  return steps;
}

function buildFactorise(p: FactoriseParams): BuiltProblem {
  const steps = ladder(p.n);
  const powers = primePowers(p.n);
  const last = primeFactors(p.n);
  steps.push({
    math: `= ${indexFormTex(powers)}`,
    reason: `${last.at(-1) ?? ''} is prime, so every factor is now prime. Write repeated primes as powers.`,
  });
  return {
    prompt: [
      text('Write '),
      math(String(p.n)),
      text(' as a product of its prime factors. You may use powers for repeated factors.'),
    ],
    answer: { kind: 'number', canonical: indexFormTex(powers), form: ['prime-factorisation'] },
    steps,
    hints: [
      {
        level: 'nudge',
        body: [text('Start with the smallest prime, 2. Does it divide the number?')],
      },
      {
        level: 'method',
        body: [
          text(
            'Keep dividing by the smallest prime that goes exactly, then 3, then 5 and so on, until what is left is prime.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? String(p.n))] },
    ],
  };
}

export const factorise: Generator<FactoriseParams> = {
  id: `${TOPIC}/prime-factorise`,
  version: 1,
  topicId: TOPIC,
  title: 'Prime factorisation',
  sample: sampleFactorise,
  build: buildFactorise,
  // Independent route: trial division from the largest prime down.
  solveDirectly: (p) => {
    const out: number[] = [];
    let rest = p.n;
    for (let d = rest; d >= 2 && rest > 1; d--) {
      if (!isPrime(d)) continue;
      while (rest % d === 0) {
        out.push(d);
        rest /= d;
      }
    }
    return out.join(' \\times ');
  },
  misconceptions: [],
  equivalents: (p) => [
    repeatedTex(primeFactors(p.n)),
    [...primeFactors(p.n)].reverse().join(' \\times '),
  ],
  nearMisses: (p) => {
    const powers = primePowers(p.n);
    const [first, ...rest] = powers as [[number, number], ...[number, number][]];
    return [
      indexFormTex([[first[0], first[1] + 1], ...rest]),
      indexFormTex(rest.length > 0 ? rest : [[first[0], first[1] - 1]]),
    ];
  },
};

/* ---------- Skills 2 and 3: HCF and LCM ---------- */

export interface CommonParams {
  a: number;
  b: number;
  /** A word problem (difficulty 3). */
  story: boolean;
}

function sampleCommon(rng: Rng, difficulty: Difficulty, want: 'hcf' | 'lcm'): CommonParams {
  for (;;) {
    const max = difficulty === 1 ? 30 : difficulty === 2 ? 72 : 120;
    const a = rng.int(4, max);
    const b = rng.int(4, max);
    if (a === b || a % b === 0 || b % a === 0) continue;
    const g = gcdInt(a, b);
    if (g === 1) continue;
    if (want === 'lcm' && lcmInt(a, b) > (difficulty === 3 ? 600 : 300)) continue;
    if (Math.max(...primeFactors(a), ...primeFactors(b)) > 13) continue;
    return { a, b, story: difficulty === 3 };
  }
}

const hcfOf = (p: CommonParams) => gcdInt(p.a, p.b);
const lcmOf = (p: CommonParams) => lcmInt(p.a, p.b);

function factorLines(p: CommonParams): SolutionStep[] {
  return [p.a, p.b].map((v) => ({
    math: `${v} = ${repeatedTex(primeFactors(v))}`,
    reason: `Break ${v} into its prime factors.`,
  }));
}

/** Primes shared by both, as many times as both have them. */
function shared(p: CommonParams): number[] {
  const rest = primeFactors(p.b);
  return primeFactors(p.a).filter((f) => {
    const at = rest.indexOf(f);
    if (at < 0) return false;
    rest.splice(at, 1);
    return true;
  });
}

function buildHcf(p: CommonParams): BuiltProblem {
  const common = shared(p);
  const hcf = hcfOf(p);
  const steps = [
    ...factorLines(p),
    {
      math:
        common.length === 1
          ? `\\text{HCF} = ${hcf}`
          : `\\text{HCF} = ${repeatedTex(common)} = ${hcf}`,
      reason: `The primes that appear in both lists, as many times as they appear in both, are ${common.join(', ')}. Their product is the highest common factor.`,
    },
  ];
  const prompt = p.story
    ? [
        text(
          `A teacher has ${p.a} pencils and ${p.b} rulers. They want to make identical packs using all of them, with no items left over. What is the largest number of packs she can make?`,
        ),
      ]
    : [
        text('Find the highest common factor (HCF) of '),
        math(String(p.a)),
        text(' and '),
        math(String(p.b)),
        text('.'),
      ];
  return {
    prompt,
    answer: intAnswer(hcf),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text(
            p.story
              ? 'The number of packs must divide both amounts exactly.'
              : 'The HCF is the biggest number that divides both exactly.',
          ),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            'Write both numbers as products of primes, then multiply together the primes they share.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
    ],
  };
}

function buildLcm(p: CommonParams): BuiltProblem {
  const lcm = lcmOf(p);
  const common = shared(p);
  // The LCM uses every prime from either list, each as many times as the larger count.
  const extraB = [...primeFactors(p.b)];
  for (const f of common) extraB.splice(extraB.indexOf(f), 1);
  const all = [...primeFactors(p.a), ...extraB].sort((x, y) => x - y);
  const steps = [
    ...factorLines(p),
    {
      math: `\\text{LCM} = ${repeatedTex(all)} = ${lcm}`,
      reason: `Take every prime in ${p.a}, then add the primes of ${p.b} that are not already covered (${extraB.join(', ')}). Their product is the lowest common multiple.`,
    },
  ];
  const prompt = p.story
    ? [
        text(
          `One bus leaves the station every ${p.a} minutes and another every ${p.b} minutes. They both leave at 9 am. After how many minutes will they next leave together?`,
        ),
      ]
    : [
        text('Find the lowest common multiple (LCM) of '),
        math(String(p.a)),
        text(' and '),
        math(String(p.b)),
        text('.'),
      ];
  return {
    prompt,
    answer: intAnswer(lcm),
    steps,
    hints: [
      {
        level: 'nudge',
        body: [
          text(
            p.story
              ? 'The time must be in both buses’ lists of times: a multiple of both numbers.'
              : 'The LCM is the smallest number that both numbers divide into exactly.',
          ),
        ],
      },
      {
        level: 'method',
        body: [
          text(
            'Write both numbers as products of primes. The LCM contains every prime from either number, as many times as the number that has it most.',
          ),
        ],
      },
      { level: 'first-step', body: [math(steps[0]?.math ?? '')] },
    ],
  };
}

/** Independent route: search every candidate. */
const searchHcf = (p: CommonParams) => {
  for (let d = Math.min(p.a, p.b); d >= 1; d--)
    if (p.a % d === 0 && p.b % d === 0) return String(d);
  return '1';
};
const searchLcm = (p: CommonParams) => {
  for (let m = Math.max(p.a, p.b); ; m++) if (m % p.a === 0 && m % p.b === 0) return String(m);
};

export const hcf: Generator<CommonParams> = {
  id: `${TOPIC}/hcf`,
  version: 1,
  topicId: TOPIC,
  title: 'Highest common factor',
  sample: (rng, d) => sampleCommon(rng, d, 'hcf'),
  build: buildHcf,
  solveDirectly: searchHcf,
  misconceptions: [
    {
      id: 'hcf-lcm-confused',
      produce: (p) => String(lcmOf(p)),
    },
  ],
  equivalents: () => [],
  nearMisses: (p) => {
    const h = hcfOf(p);
    // Common factors that are not the highest, and the product.
    const smaller = [];
    for (let d = h - 1; d >= 2; d--) if (h % d === 0) smaller.push(String(d));
    return [...smaller.slice(0, 2), String(p.a * p.b)].filter((v) => v !== String(lcmOf(p)));
  },
};

export const lcm: Generator<CommonParams> = {
  id: `${TOPIC}/lcm`,
  version: 1,
  topicId: TOPIC,
  title: 'Lowest common multiple',
  sample: (rng, d) => sampleCommon(rng, d, 'lcm'),
  build: buildLcm,
  solveDirectly: searchLcm,
  misconceptions: [
    {
      id: 'lcm-as-product',
      produce: (p) => (p.a * p.b === lcmOf(p) ? null : String(p.a * p.b)),
      wrongSteps: (p) => [
        {
          math: `${p.a} \\times ${p.b} = ${p.a * p.b}`,
          reason: 'Multiply the two numbers together.',
        },
      ],
    },
    { id: 'hcf-lcm-confused', produce: (p) => String(hcfOf(p)) },
  ],
  equivalents: () => [],
  nearMisses: (p) => [String(lcmOf(p) * 2), String(lcmOf(p) + 1)],
};

export const generators = [defineGenerator(factorise), defineGenerator(hcf), defineGenerator(lcm)];

/* ---------- Worked examples ---------- */

export const examples: Record<string, ExampleSpec> = {
  'fmp-factorise': defineExample(factorise, { difficulty: 2, params: { n: 72 }, fade: 'full' }),
  'fmp-factorise-faded': defineExample(factorise, {
    difficulty: 3,
    params: { n: 360 },
    fade: 'last-2',
  }),
  'fmp-hcf': defineExample(hcf, {
    difficulty: 1,
    params: { a: 12, b: 18, story: false },
    fade: 'full',
  }),
  'fmp-lcm-wrong': defineExample(lcm, {
    difficulty: 1,
    params: { a: 6, b: 8, story: false },
    fade: 'full',
    misconception: 'lcm-as-product',
  }),
  'fmp-lcm': defineExample(lcm, {
    difficulty: 3,
    params: { a: 12, b: 20, story: true },
    fade: 'learner',
  }),
};
