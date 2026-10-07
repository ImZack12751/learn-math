/**
 * The misconception catalogue. Generators name the faulty rule behind each typical wrong answer
 * by id; feedback shows the name and links to the section of the topic that addresses it.
 * Grows with each topic (CONTENT_GUIDE section 7).
 */
import type { TopicId } from './curriculum';

export interface Misconception {
  name: string;
  /** The faulty rule, as LaTeX. */
  faultyRule: string;
  /** Why it is wrong, in one or two plain sentences. */
  why: string;
  /** Where it is taught properly: the topic and the section anchor in its MDX. */
  topic: TopicId;
  section: string;
}

export const misconceptions = {
  'subtract-negative-as-negative': {
    name: 'Subtracting a negative as if it were a negative',
    faultyRule: 'a - (-b) = a - b',
    why: 'Taking away a debt leaves you better off: subtracting a negative number adds its size.',
    topic: 's1-negative-operations',
    section: 'subtracting-negatives',
  },
  'add-numerators-and-denominators': {
    name: 'Adding the tops and the bottoms of fractions',
    faultyRule: '\\frac{a}{b} + \\frac{c}{d} = \\frac{a + c}{b + d}',
    why: 'Fractions can only be added when they count the same size of piece, so the denominators must match first.',
    topic: 's1-add-subtract-fractions',
    section: 'common-denominators',
  },
  'multiply-base-by-exponent': {
    name: 'Multiplying the base by the exponent',
    faultyRule: 'a^{n} = a \\times n',
    why: 'An exponent counts how many times the base is multiplied by itself, not what to multiply it by.',
    topic: 's2-exponent-laws',
    section: 'what-an-exponent-means',
  },
  'add-exponents-different-bases': {
    name: 'Adding exponents when the bases differ',
    faultyRule: 'a^{m} \\times b^{n} = (ab)^{m + n}',
    why: 'The add-the-exponents law only works when the same base is repeated; different bases cannot be combined that way.',
    topic: 's2-exponent-laws',
    section: 'same-base-only',
  },
  'negative-exponent-gives-negative': {
    name: 'Reading a negative exponent as a negative number',
    faultyRule: 'a^{-n} = -a^{n}',
    why: 'A negative exponent means the reciprocal: one divided by the power. The result is still positive for a positive base.',
    topic: 's2-zero-negative-exponents',
    section: 'negative-exponents',
  },
  'fractional-exponent-divides-base': {
    name: 'Dividing the base by the denominator of a fractional exponent',
    faultyRule: 'a^{\\frac{1}{n}} = \\frac{a}{n}',
    why: 'An exponent of one over n asks for the nth root, the number that multiplied by itself n times gives a.',
    topic: 's2-fractional-exponents',
    section: 'unit-fraction-exponents',
  },
  'fractional-exponent-multiplies-base': {
    name: 'Multiplying the base by a fractional exponent',
    faultyRule: 'a^{\\frac{m}{n}} = a \\times \\frac{m}{n}',
    why: 'An exponent is never a multiplier. a to the m over n means the nth root of a, raised to the power m.',
    topic: 's2-fractional-exponents',
    section: 'general-fractional-exponents',
  },
  'distribute-power-over-sum': {
    name: 'Distributing a power over a sum',
    faultyRule: '(a + b)^{2} = a^{2} + b^{2}',
    why: 'Squaring means multiplying the whole bracket by itself, which creates the two middle terms 2ab.',
    topic: 's3-double-brackets',
    section: 'perfect-squares',
  },
  'expand-only-first-term': {
    name: 'Multiplying only the first term in a bracket',
    faultyRule: 'a(b + c) = ab + c',
    why: 'The number outside multiplies everything inside the bracket, every term.',
    topic: 's2-expanding-single-brackets',
    section: 'every-term',
  },
  'cancel-terms-not-factors': {
    name: 'Cancelling terms instead of factors',
    faultyRule: '\\frac{a + b}{a} = b',
    why: 'Only common factors of the whole top and the whole bottom cancel; a term inside a sum is not a factor.',
    topic: 's3-alg-fractions-simplify',
    section: 'factors-not-terms',
  },
  'sign-error-moving-term': {
    name: 'Keeping the sign when moving a term across the equals sign',
    faultyRule: 'x + a = b \\Rightarrow x = b + a',
    why: 'To keep the balance you do the opposite operation to both sides, so the sign of the moved term changes.',
    topic: 's2-one-two-step-equations',
    section: 'inverse-operations',
  },
  'forget-negative-root': {
    name: 'Forgetting the negative square root',
    faultyRule: 'x^{2} = a \\Rightarrow x = \\sqrt{a}',
    why: 'Both a number and its negative square to the same positive value, so there are two solutions.',
    topic: 's3-quadratics-factorising',
    section: 'two-roots',
  },
  'keep-extraneous-root': {
    name: 'Keeping a solution that does not satisfy the original equation',
    faultyRule: '\\text{squaring both sides gives only true solutions}',
    why: 'Squaring can create solutions to the squared equation that do not solve the original, so every answer must be checked.',
    topic: 's3-radical-equations',
    section: 'checking-solutions',
  },
  'inequality-sign-not-reversed': {
    name: 'Not reversing the inequality when multiplying or dividing by a negative',
    faultyRule: '-x < a \\Rightarrow x < -a',
    why: 'Multiplying by a negative number reverses the order of numbers on the number line, so the sign must flip.',
    topic: 's3-linear-inequalities',
    section: 'flipping-the-sign',
  },
  'log-of-sum': {
    name: 'Splitting the log of a sum',
    faultyRule: '\\log(a + b) = \\log a + \\log b',
    why: 'The log law turns a product into a sum: log of ab is log a plus log b. There is no law for log of a sum.',
    topic: 's3-log-laws',
    section: 'product-law',
  },
} as const satisfies Record<string, Misconception>;

export type MisconceptionId = keyof typeof misconceptions;
