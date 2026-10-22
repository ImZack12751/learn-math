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
  integer: {
    term: 'integer',
    definition:
      'A whole number that may be positive, negative or zero, such as 4, 0 or −7. Integers have no fraction or decimal part.',
    example: '\\ldots, -2, -1, 0, 1, 2, \\ldots',
    firstTaughtIn: 's1-integers-number-line',
  },
  'number-line': {
    term: 'number line',
    definition:
      'A straight line with numbers marked at equal steps. Numbers increase to the right and decrease to the left, with zero in between.',
    firstTaughtIn: 's1-integers-number-line',
  },
  'negative-number': {
    term: 'negative number',
    definition:
      'A number less than zero, written with a minus sign in front, such as −3. On the number line it sits to the left of zero.',
    example: '-3 < 0',
    firstTaughtIn: 's1-integers-number-line',
  },
  sum: {
    term: 'sum',
    definition: 'The result of adding numbers together.',
    example: '\\text{the sum of } 3 \\text{ and } 4 \\text{ is } 7',
    firstTaughtIn: 's1-negative-operations',
  },
  difference: {
    term: 'difference',
    definition: 'The result of subtracting one number from another.',
    example: '\\text{the difference of } 9 \\text{ and } 4 \\text{ is } 5',
    firstTaughtIn: 's1-negative-operations',
  },
  product: {
    term: 'product',
    definition: 'The result of multiplying numbers together.',
    example: '\\text{the product of } 3 \\text{ and } 4 \\text{ is } 12',
    firstTaughtIn: 's1-negative-operations',
  },
  quotient: {
    term: 'quotient',
    definition: 'The result of dividing one number by another.',
    example: '\\text{the quotient of } 12 \\text{ and } 4 \\text{ is } 3',
    firstTaughtIn: 's1-negative-operations',
  },
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
    firstTaughtIn: 's1-order-of-operations',
  },
  exponent: {
    term: 'exponent',
    definition:
      'The small raised number in a power. A whole-number exponent says how many copies of the base are multiplied together. Also called an index or a power.',
    example: '\\text{in } 2^{5} \\text{ the exponent is } 5',
    firstTaughtIn: 's1-order-of-operations',
  },
  power: {
    term: 'power',
    definition: 'A base with an exponent, such as 2 to the power 5, or the value it stands for.',
    example: '2^{5} = 32',
    firstTaughtIn: 's1-order-of-operations',
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
