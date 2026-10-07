/**
 * Instantiating problems, and auditing generators. The audit is what the 1,000-seeds-per-difficulty
 * test runs (ARCHITECTURE section 12): it proves every problem's answer independently, checks the
 * worked solution ends on the answer, and checks the checker against equivalent rewrites,
 * misconception answers and near misses.
 */
import { check } from '../engine/check';
import { deriveSeed, Rng } from '../engine/rng';
import type { AnswerSpec, RichText } from '../engine/types';
import { DIFFICULTIES, type AnyGenerator, type Difficulty, type ProblemInstance } from './types';

function hashText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** The parameters for a seed: each generator and difficulty gets its own stream. */
function paramsFor(gen: AnyGenerator, seed: number, difficulty: Difficulty): unknown {
  return gen.sample(
    new Rng((seed ^ hashText(gen.id) ^ Math.imul(difficulty, 0x9e3779b1)) >>> 0),
    difficulty,
  );
}

export function instantiate(
  gen: AnyGenerator,
  seed: number,
  difficulty: Difficulty,
): ProblemInstance {
  const p = paramsFor(gen, seed, difficulty);
  return fromParams(gen, p, difficulty, seed);
}

export function fromParams(
  gen: AnyGenerator,
  p: unknown,
  difficulty: Difficulty,
  seed: number,
): ProblemInstance {
  const built = gen.build(p, difficulty);
  return {
    ...built,
    key: `${gen.id}@v${gen.version}:${difficulty}:${seed}`,
    generatorId: gen.id,
    topicId: gen.topicId,
    difficulty,
    seed,
    misconceptionAnswers: gen.misconceptions.flatMap((m) => {
      const answer = m.produce(p);
      return answer === null ? [] : [{ id: m.id, answer }];
    }),
  };
}

/**
 * A set of distinct problems (practice, review, tests): consecutive derived seeds, skipping any
 * problem already in the set. Throws if the generator cannot supply enough distinct problems.
 */
export function buildSet(
  gen: AnyGenerator,
  baseSeed: number,
  difficulty: Difficulty,
  size: number,
): ProblemInstance[] {
  const out: ProblemInstance[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; out.length < size; attempt++) {
    if (attempt >= size * 25)
      throw new Error(
        `${gen.id} cannot produce ${size} distinct problems at difficulty ${difficulty}`,
      );
    const problem = instantiate(gen, deriveSeed(baseSeed, attempt), difficulty);
    const identity = JSON.stringify(problem.prompt);
    if (seen.has(identity)) continue;
    seen.add(identity);
    out.push(problem);
  }
  return out;
}

export interface AuditFailure {
  generatorId: string;
  difficulty: Difficulty;
  seed: number;
  problem: string;
}

export interface AuditOptions {
  seeds: number;
  /** Size of the sets that must contain no repeated problem (default 20). */
  setSize?: number;
  /** Throws if a LaTeX string does not render (the test passes KaTeX here). */
  validateLatex?: (tex: string) => void;
  /** Stop after this many failures. */
  maxFailures?: number;
}

/** The same answer with no form or rounding asked for: compares values only. */
const valueOnly = (spec: AnswerSpec): AnswerSpec => {
  const plain: AnswerSpec = { ...spec, form: [] };
  delete plain.accuracy;
  return plain;
};

/** Text after the last top-level equals sign of a line of working ("x = 4" → "4"). */
function afterLastEquals(line: string): string | null {
  let depth = 0;
  let at = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '{' || ch === '(') depth++;
    else if (ch === '}' || ch === ')') depth--;
    else if (ch === '=' && depth === 0) at = i;
  }
  return at >= 0 ? line.slice(at + 1) : null;
}

const textRuns = (rich: RichText) => rich.filter((r) => r.t === 'text').map((r) => r.v);
const mathRuns = (rich: RichText) => rich.filter((r) => r.t === 'math').map((r) => r.v);

/** Every problem a single instance must satisfy. Returns the first failure found, or null. */
export function auditInstance(
  gen: AnyGenerator,
  seed: number,
  difficulty: Difficulty,
  options: AuditOptions,
): string | null {
  const p = paramsFor(gen, seed, difficulty);
  const problem = fromParams(gen, p, difficulty, seed);
  const spec = problem.answer;

  if (gen.isDegenerate?.(p)) return 'degenerate parameters';
  if (JSON.stringify(instantiate(gen, seed, difficulty)) !== JSON.stringify(problem))
    return 'not reproducible by seed';

  // Presentation: prompt, steps with reasons, three hints in order, no caret notation in text.
  if (problem.prompt.length === 0) return 'empty prompt';
  if (problem.steps.length === 0) return 'no solution steps';
  if (problem.steps.some((s) => s.reason.trim() === '' || s.math.trim() === ''))
    return 'a step without maths or reason';
  if (problem.hints.map((h) => h.level).join() !== 'nudge,method,first-step')
    return 'hints out of order';
  const texts = [
    ...textRuns(problem.prompt),
    ...problem.steps.map((s) => s.reason),
    ...problem.hints.flatMap((h) => textRuns(h.body)),
  ];
  if (texts.some((t) => t.includes('^'))) return 'caret notation in text';
  if (options.validateLatex) {
    const all = [
      ...mathRuns(problem.prompt),
      ...problem.steps.map((s) => s.math),
      ...problem.hints.flatMap((h) => mathRuns(h.body)),
      spec.canonical,
    ];
    for (const tex of all) {
      try {
        options.validateLatex(tex);
      } catch (error) {
        return `LaTeX does not render: ${tex} (${String(error)})`;
      }
    }
  }

  // The answer, proved independently, accepted in its canonical form.
  const direct = gen.solveDirectly(p);
  if (check(direct, valueOnly(spec)).verdict !== 'correct')
    return `direct computation ${direct} ≠ answer ${spec.canonical}`;
  const own = check(spec.canonical, spec);
  if (own.verdict !== 'correct') return `canonical answer not accepted: ${own.feedback}`;

  // The worked solution ends on the answer.
  const last = problem.steps.at(-1)?.math ?? '';
  const candidates = [last, afterLastEquals(last)].filter((x): x is string => x !== null);
  if (!candidates.some((c) => check(c, spec).verdict === 'correct'))
    return `last step "${last}" is not the answer`;

  for (const eq of gen.equivalents(p)) {
    const r = check(eq, spec);
    if (r.verdict !== 'correct') return `equivalent ${eq} judged ${r.verdict}`;
  }

  // Each misconception answer is wrong, and is recognised as that misconception (or an earlier
  // rule that gives the same wrong answer for these parameters).
  const rules = problem.misconceptionAnswers;
  for (const [i, m] of rules.entries()) {
    const r = check(m.answer, spec, rules);
    if (r.verdict === 'correct' || r.verdict === 'right-value-wrong-form')
      return `misconception ${m.id} gives a right value (${m.answer})`;
    const expected = rules
      .slice(0, i + 1)
      .find((other) => check(m.answer, spec, [other]).misconceptionId)?.id;
    if (r.misconceptionId !== expected)
      return `misconception ${m.id} answer ${m.answer} not recognised`;
  }

  for (const miss of gen.nearMisses(p)) {
    const r = check(miss, spec);
    if (r.verdict !== 'incorrect') return `near miss ${miss} judged ${r.verdict}`;
  }
  return null;
}

/** Audits a generator over `seeds` seeds at every difficulty. */
export function auditGenerator(gen: AnyGenerator, options: AuditOptions): AuditFailure[] {
  const failures: AuditFailure[] = [];
  const setSize = options.setSize ?? 20;
  const max = options.maxFailures ?? 10;
  for (const difficulty of DIFFICULTIES) {
    for (let seed = 0; seed < options.seeds && failures.length < max; seed++) {
      const issue = auditInstance(gen, seed, difficulty, options);
      if (issue) failures.push({ generatorId: gen.id, difficulty, seed, problem: issue });
    }
    // Sets of distinct problems can be built across the same span of seeds.
    for (let block = 0; block < options.seeds / setSize && failures.length < max; block++) {
      try {
        buildSet(gen, block, difficulty, setSize);
      } catch (error) {
        failures.push({ generatorId: gen.id, difficulty, seed: block, problem: String(error) });
      }
    }
  }
  return failures;
}
