/**
 * Shared types for problems, answers and checking. Pure data: no behaviour lives here.
 */

/** Text runs and LaTeX runs. Problem prompts never contain caret notation. */
export type RichText = ({ t: 'text'; v: string } | { t: 'math'; v: string })[];

export interface SolutionStep {
  /** LaTeX for this line of working. */
  math: string;
  /** Why this step is allowed, in a short sentence. */
  reason: string;
}

export interface Hint {
  level: 'nudge' | 'method' | 'first-step';
  body: RichText;
}

export type FormRequirement =
  | 'simplified-fraction'
  | 'improper-fraction'
  | 'mixed-number'
  | 'decimal'
  | 'integer'
  | 'factorised'
  | 'expanded'
  | 'collected'
  | 'simplest-surd'
  | 'rationalised-denominator'
  | 'positive-exponents'
  | 'single-power'
  /** A number times a single power of one letter: k·xⁿ. */
  | 'power-term'
  | 'exponent-form'
  | 'radical-form'
  | 'standard-form';

export type AnswerKind =
  | 'number'
  | 'expression'
  | 'solution-set'
  | 'inequality'
  | 'ordered-pairs'
  | 'formula'
  // Designed for later stages; the checker reports them as unsupported until their stage is built.
  | 'interval'
  | 'point'
  | 'function'
  | 'complex'
  | 'vector'
  | 'matrix'
  | 'limit'
  | 'antiderivative'
  | 'ode-solution';

export interface DomainSpec {
  /** Sampling range for each variable. */
  ranges: Record<string, readonly [number, number]>;
  /** Variables that only take integer values (sampled as integers). */
  integer?: readonly string[];
}

export interface AnswerSpec {
  kind: AnswerKind;
  /**
   * LaTeX of the canonical answer. For 'solution-set' a list joined by commas (`2, -3`, or
   * `\varnothing` for no solution); for 'inequality' the inequality in `variable`; for 'ordered-pairs'
   * a list of tuples; for 'formula' the expression the subject equals.
   */
  canonical: string;
  /** The variable solved for ('solution-set', 'inequality') or the formula's subject. */
  variable?: string;
  /** For 'ordered-pairs': the variable names, in tuple order. */
  variables?: readonly string[];
  domain?: DomainSpec;
  form: readonly FormRequirement[];
  /** Only when the question asks for rounding. */
  accuracy?: { sf: number } | { dp: number };
}

export interface MisconceptionAnswer {
  id: string;
  /** The wrong answer that this faulty rule produces, as LaTeX. */
  answer: string;
}

export type Verdict = 'correct' | 'right-value-wrong-form' | 'incorrect' | 'unparseable';

export interface CheckResult {
  verdict: Verdict;
  /** Plain-language reasons the form is not the one asked for. */
  formIssues: string[];
  /** The matched misconception when the answer is incorrect. */
  misconceptionId?: string;
  /** Short explanation for the learner. */
  feedback: string;
}
