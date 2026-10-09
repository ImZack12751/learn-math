import type { MisconceptionId } from '../content/misconceptions';
import type { Rng } from '../engine/rng';
import type {
  AnswerSpec,
  Hint,
  MisconceptionAnswer,
  RichText,
  SolutionStep,
} from '../engine/types';

export type Difficulty = 1 | 2 | 3;
export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3];

/** What `build` produces from a set of parameters. */
export interface BuiltProblem {
  /** States any required form in words ("Give your answer as a fraction in its simplest form"). */
  prompt: RichText;
  answer: AnswerSpec;
  /** Working, one line per step, each with its reason. The last line equals the answer. */
  steps: SolutionStep[];
  /** Nudge, method, first step. */
  hints: readonly [Hint, Hint, Hint];
}

export interface MisconceptionRule<P> {
  id: MisconceptionId;
  /** The wrong answer this faulty rule gives, as LaTeX; null when it would coincide with the right one. */
  produce: (p: P) => string | null;
  /**
   * The faulty working, for the worked example that fails on purpose. Its last line must equal
   * `produce(p)` (checked by the content tests).
   */
  wrongSteps?: (p: P) => SolutionStep[];
}

/**
 * A parametric problem generator (ARCHITECTURE section 5.3). `sample` and `build` are separate
 * so worked examples can pass hand-picked parameters through the same `build` code.
 */
export interface Generator<P> {
  id: string;
  /** Bump when the problem produced for a seed changes. */
  version: number;
  topicId: string;
  /** Skill name, shown in practice filters. */
  title: string;
  sample: (rng: Rng, difficulty: Difficulty) => P;
  build: (p: P, difficulty: Difficulty) => BuiltProblem;
  /** An independent computation of the answer (a different code path from `build`), as LaTeX. */
  solveDirectly: (p: P) => string;
  misconceptions: readonly MisconceptionRule<P>[];
  /** Correct rewrites the checker must accept (only forms the question allows). */
  equivalents: (p: P) => string[];
  /** Plausible wrong answers the checker must reject. */
  nearMisses: (p: P) => string[];
  /** True for parameters that make a trivial or broken problem. */
  isDegenerate?: (p: P) => boolean;
}

/** A generator with its parameter type erased, as the registry and harness hold it. */
export type AnyGenerator = Generator<unknown>;

export const defineGenerator = <P>(g: Generator<P>): AnyGenerator => g as unknown as AnyGenerator;

export interface ProblemInstance extends BuiltProblem {
  /** `${generatorId}@v${version}:${difficulty}:${seed}`: reproduces the problem exactly. */
  key: string;
  generatorId: string;
  topicId: string;
  difficulty: Difficulty;
  seed: number;
  /** The wrong answers each faulty rule gives for this problem, for feedback. */
  misconceptionAnswers: MisconceptionAnswer[];
}

/** How much of a worked example is shown (CONTENT_GUIDE section 5). */
export type Fade = 'full' | 'last-1' | 'last-2' | 'learner';

/** A worked example: authored parameters run through the generator's own `build`. */
export interface ExampleSpec {
  generatorId: string;
  difficulty: Difficulty;
  params: unknown;
  fade: Fade;
  /** Set for the example that fails on purpose: shows this misconception's faulty working. */
  misconception?: MisconceptionId;
}

export function defineExample<P>(
  generator: Generator<P>,
  spec: { difficulty: Difficulty; params: P; fade: Fade; misconception?: MisconceptionId },
): ExampleSpec {
  return { generatorId: generator.id, ...spec };
}
