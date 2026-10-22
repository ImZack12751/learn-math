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
  'order-of-operations': {
    term: 'order of operations',
    definition:
      'The agreed order for working out a calculation: brackets, then powers, then multiplication and division from left to right, then addition and subtraction from left to right.',
    example: '2 + 3 \\times 4 = 2 + 12 = 14',
    firstTaughtIn: 's1-order-of-operations',
  },
  factor: {
    term: 'factor',
    definition:
      'A whole number that divides into another exactly, with no remainder. The factors of 12 are 1, 2, 3, 4, 6 and 12.',
    example: '12 = 3 \\times 4',
    firstTaughtIn: 's1-factors-multiples-primes',
  },
  multiple: {
    term: 'multiple',
    definition:
      'The result of multiplying a number by a whole number. The multiples of 4 are 4, 8, 12, 16 and so on.',
    firstTaughtIn: 's1-factors-multiples-primes',
  },
  'prime-number': {
    term: 'prime number',
    definition:
      'A whole number greater than 1 whose only factors are 1 and itself. The first few are 2, 3, 5, 7, 11 and 13. The number 1 is not prime.',
    firstTaughtIn: 's1-factors-multiples-primes',
  },
  'prime-factorisation': {
    term: 'prime factorisation',
    definition:
      'A number written as a product of prime numbers. Every whole number greater than 1 has exactly one, apart from the order of the factors.',
    example: '72 = 2^{3} \\times 3^{2}',
    firstTaughtIn: 's1-factors-multiples-primes',
  },
  hcf: {
    term: 'highest common factor (HCF)',
    definition: 'The largest whole number that is a factor of each of the given numbers.',
    example: '\\text{HCF of } 12 \\text{ and } 18 \\text{ is } 6',
    firstTaughtIn: 's1-factors-multiples-primes',
  },
  lcm: {
    term: 'lowest common multiple (LCM)',
    definition: 'The smallest whole number that is a multiple of each of the given numbers.',
    example: '\\text{LCM of } 6 \\text{ and } 8 \\text{ is } 24',
    firstTaughtIn: 's1-factors-multiples-primes',
  },
  fraction: {
    term: 'fraction',
    definition:
      'A number written as one whole number over another. The bottom says how many equal pieces the whole is cut into; the top says how many of those pieces there are.',
    example: '\\frac{3}{4}',
    firstTaughtIn: 's1-fractions-equivalent',
  },
  'equivalent-fractions': {
    term: 'equivalent fractions',
    definition:
      'Fractions that are written differently but have the same value, such as one half and two quarters. Multiplying or dividing the top and the bottom by the same number gives an equivalent fraction.',
    example: '\\frac{1}{2} = \\frac{2}{4} = \\frac{3}{6}',
    firstTaughtIn: 's1-fractions-equivalent',
  },
  'common-denominator': {
    term: 'common denominator',
    definition:
      'A denominator shared by two or more fractions. The lowest common denominator is the lowest common multiple of their denominators.',
    firstTaughtIn: 's1-fractions-equivalent',
  },
  'simplest-form': {
    term: 'simplest form',
    definition:
      'A fraction is in its simplest form when its numerator and denominator have no common factor other than 1. Also called lowest terms.',
    example: '\\frac{18}{24} \\text{ in simplest form is } \\frac{3}{4}',
    firstTaughtIn: 's1-simplifying-fractions',
  },
  'proper-fraction': {
    term: 'proper fraction',
    definition:
      'A fraction whose numerator is smaller than its denominator, so its value is less than 1.',
    example: '\\frac{3}{4}',
    firstTaughtIn: 's1-mixed-numbers',
  },
  'improper-fraction': {
    term: 'improper fraction',
    definition:
      'A fraction whose numerator is equal to or bigger than its denominator, so its value is at least 1.',
    example: '\\frac{11}{4}',
    firstTaughtIn: 's1-mixed-numbers',
  },
  'mixed-number': {
    term: 'mixed number',
    definition: 'A whole number and a proper fraction written together, meaning their sum.',
    example: '2\\frac{3}{4} = 2 + \\frac{3}{4}',
    firstTaughtIn: 's1-mixed-numbers',
  },
  'place-value': {
    term: 'place value',
    definition:
      'The value of a digit from its position. Each column is worth ten times the column to its right: thousands, hundreds, tens, ones, then tenths, hundredths, thousandths.',
    example: '\\text{in } 3.25 \\text{ the } 2 \\text{ means two tenths}',
    firstTaughtIn: 's1-decimals',
  },
  decimal: {
    term: 'decimal',
    definition:
      'A number written with a decimal point. Digits after the point count tenths, hundredths, thousandths and so on.',
    example: '0.375 = \\frac{375}{1000}',
    firstTaughtIn: 's1-decimals',
  },
  percentage: {
    term: 'percentage',
    definition: 'A number of hundredths, written with the sign %. Per cent means out of a hundred.',
    example: '35\\% = \\frac{35}{100} = 0.35',
    firstTaughtIn: 's1-percentages',
  },
  multiplier: {
    term: 'multiplier',
    definition:
      'The single number you multiply by to make a percentage change. An increase of 15% has multiplier 1.15; a decrease of 15% has multiplier 0.85.',
    firstTaughtIn: 's1-percentages',
  },
  ratio: {
    term: 'ratio',
    definition:
      'A comparison of two or more amounts of the same kind, written with colons. The ratio 2 : 3 means that for every 2 of the first there are 3 of the second.',
    example: '12 : 18 = 2 : 3',
    firstTaughtIn: 's1-ratio-proportion',
  },
  'direct-proportion': {
    term: 'direct proportion',
    definition:
      'Two quantities are in direct proportion when multiplying one by a number multiplies the other by the same number. Twice as many items cost twice as much.',
    firstTaughtIn: 's1-ratio-proportion',
  },
  rate: {
    term: 'rate',
    definition:
      'A comparison of two quantities with different units, such as kilometres per hour or pounds per kilogram. Per means for each.',
    firstTaughtIn: 's1-rates-units',
  },
  speed: {
    term: 'speed',
    definition:
      'How far something travels in each unit of time. Speed equals distance divided by time, measured for example in kilometres per hour (km/h).',
    firstTaughtIn: 's1-rates-units',
  },
  rounding: {
    term: 'rounding',
    definition:
      'Replacing a number with a simpler one that is close to it, keeping only some of its digits. If the first digit dropped is 5 or more, the last kept digit goes up by one.',
    example: '3.476 \\approx 3.48',
    firstTaughtIn: 's1-estimation',
  },
  'decimal-places': {
    term: 'decimal places',
    definition: 'The number of digits after the decimal point. 3.48 has two decimal places.',
    firstTaughtIn: 's1-estimation',
  },
  'significant-figures': {
    term: 'significant figures',
    definition:
      'The digits of a number counted from the first non-zero digit. In 0.04567 the first significant figure is the 4.',
    example: '0.04567 \\approx 0.046 \\text{ to 2 significant figures}',
    firstTaughtIn: 's1-estimation',
  },
  estimate: {
    term: 'estimate',
    definition:
      'An approximate answer found by rounding the numbers first, used to check that an exact answer is sensible.',
    firstTaughtIn: 's1-estimation',
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
