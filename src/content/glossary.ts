/**
 * Every term, in plain language. `firstTaughtIn` is where the term is defined properly; a lesson
 * may only use a term taught in itself or in one of its prerequisites (checked by the content
 * tests), so nothing is ever referred to before it is taught.
 */
import type { TopicId } from './curriculum';

export interface GlossaryEntry {
  term: string;
  definition: string;
  /** An optional example, as LaTeX. */
  example?: string;
  firstTaughtIn: TopicId;
}

export const glossary = {
  numerator: {
    term: 'numerator',
    definition: 'The top number of a fraction: how many of the equal pieces you have.',
    example: '\\frac{3}{4} \\text{ has numerator } 3',
    firstTaughtIn: 's1-fractions-equivalent',
  },
  denominator: {
    term: 'denominator',
    definition: 'The bottom number of a fraction: how many equal pieces the whole is split into.',
    example: '\\frac{3}{4} \\text{ has denominator } 4',
    firstTaughtIn: 's1-fractions-equivalent',
  },
  reciprocal: {
    term: 'reciprocal',
    definition:
      'One divided by a number. Multiplying a number by its reciprocal gives 1. For a fraction, the reciprocal is the fraction turned upside down.',
    example: '\\text{the reciprocal of } \\frac{2}{3} \\text{ is } \\frac{3}{2}',
    firstTaughtIn: 's1-multiply-divide-fractions',
  },
  base: {
    term: 'base',
    definition: 'In a power, the number being multiplied by itself.',
    example: '\\text{in } 2^{5} \\text{ the base is } 2',
    firstTaughtIn: 's2-exponent-laws',
  },
  exponent: {
    term: 'exponent',
    definition:
      'The small raised number in a power. A whole-number exponent says how many copies of the base are multiplied together. Also called an index or a power.',
    example: '\\text{in } 2^{5} \\text{ the exponent is } 5',
    firstTaughtIn: 's2-exponent-laws',
  },
  power: {
    term: 'power',
    definition: 'A base with an exponent, such as 2 to the power 5, or the value it stands for.',
    example: '2^{5} = 32',
    firstTaughtIn: 's2-exponent-laws',
  },
  'square-root': {
    term: 'square root',
    definition:
      'The square root of a number is the non-negative number that, multiplied by itself, gives that number.',
    example: '\\sqrt{9} = 3 \\text{ because } 3 \\times 3 = 9',
    firstTaughtIn: 's2-roots',
  },
  'cube-root': {
    term: 'cube root',
    definition:
      'The cube root of a number is the number that, multiplied by itself three times, gives that number.',
    example: '\\sqrt[3]{8} = 2 \\text{ because } 2 \\times 2 \\times 2 = 8',
    firstTaughtIn: 's2-roots',
  },
  'nth-root': {
    term: 'nth root',
    definition:
      'The nth root of a number is the number that, multiplied by itself n times, gives that number. The small n on the root sign is called the index of the root.',
    example: '\\sqrt[4]{16} = 2',
    firstTaughtIn: 's2-roots',
  },
  'fractional-exponent': {
    term: 'fractional exponent',
    definition:
      'An exponent that is a fraction. The denominator says which root to take and the numerator says which power to raise it to.',
    example: '8^{\\frac{2}{3}} = \\left(\\sqrt[3]{8}\\right)^{2} = 4',
    firstTaughtIn: 's2-fractional-exponents',
  },
  'radical-form': {
    term: 'radical form',
    definition: 'Written with a root sign (a radical) instead of a fractional exponent.',
    example: 'x^{\\frac{3}{4}} \\text{ in radical form is } \\sqrt[4]{x^{3}}',
    firstTaughtIn: 's2-fractional-exponents',
  },
  'exponent-form': {
    term: 'exponent form',
    definition: 'Written as a power with an exponent, using no root signs.',
    example: '\\sqrt[4]{x^{3}} \\text{ in exponent form is } x^{\\frac{3}{4}}',
    firstTaughtIn: 's2-fractional-exponents',
  },
} as const satisfies Record<string, GlossaryEntry>;

export type TermId = keyof typeof glossary;
