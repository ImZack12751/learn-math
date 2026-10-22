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
  'negative-size-ordering': {
    name: 'Ordering negative numbers by their size',
    faultyRule: '-7 > -3',
    why: 'Further left on the number line means smaller. A negative number with a bigger size is further left, so it is smaller.',
    topic: 's1-integers-number-line',
    section: 'ordering',
  },
  'distance-subtract-sizes': {
    name: 'Subtracting the sizes when the numbers are on opposite sides of zero',
    faultyRule: '\\text{from } -4 \\text{ to } 3 \\text{ is } 4 - 3 = 1 \\text{ step}',
    why: 'Going from a negative number to a positive one passes through zero: count up to zero, then on from zero, and add the two parts.',
    topic: 's1-integers-number-line',
    section: 'distance',
  },
  'move-wrong-direction': {
    name: 'Moving the wrong way along the number line',
    faultyRule: '\\text{moving right from } -2 \\text{ by } 5 \\text{ gives } -7',
    why: 'Right is always towards bigger numbers and left towards smaller ones, whichever side of zero you start on.',
    topic: 's1-integers-number-line',
    section: 'moving',
  },
  'subtract-negative-as-negative': {
    name: 'Subtracting a negative as if it were a negative',
    faultyRule: 'a - (-b) = a - b',
    why: 'Taking away a debt leaves you better off: subtracting a negative number adds its size.',
    topic: 's1-negative-operations',
    section: 'subtracting-negatives',
  },
  'negative-times-negative-negative': {
    name: 'Thinking two negatives multiply to give a negative',
    faultyRule: '\\left(-a\\right) \\times \\left(-b\\right) = -ab',
    why: 'Multiplying by a negative reverses the direction on the number line. Reversing twice brings you back to the positive side.',
    topic: 's1-negative-operations',
    section: 'multiplying-negatives',
  },
  'hcf-lcm-confused': {
    name: 'Mixing up the highest common factor and the lowest common multiple',
    faultyRule: '\\text{HCF of } 6 \\text{ and } 8 = 24',
    why: 'A factor divides into a number, so a common factor is never bigger than the numbers. A multiple is the number times something, so a common multiple is never smaller than them.',
    topic: 's1-factors-multiples-primes',
    section: 'hcf-and-lcm',
  },
  'lcm-as-product': {
    name: 'Multiplying the two numbers to get the lowest common multiple',
    faultyRule: '\\text{LCM of } 6 \\text{ and } 8 = 6 \\times 8',
    why: 'The product is always a common multiple, but when the numbers share a factor there is a smaller one. Shared primes are only counted once.',
    topic: 's1-factors-multiples-primes',
    section: 'hcf-and-lcm',
  },
  'add-same-to-top-and-bottom': {
    name: 'Adding the same number to the top and the bottom',
    faultyRule: '\\frac{a}{b} = \\frac{a + n}{b + n}',
    why: 'Equivalent fractions come from multiplying or dividing the top and the bottom by the same number. Adding the same amount to both changes the size of the fraction.',
    topic: 's1-fractions-equivalent',
    section: 'equivalent-fractions',
  },
  'larger-denominator-larger-fraction': {
    name: 'Thinking a bigger denominator means a bigger fraction',
    faultyRule: '\\frac{1}{8} > \\frac{1}{4}',
    why: 'The denominator counts how many pieces the whole is cut into. More pieces means smaller pieces.',
    topic: 's1-fractions-equivalent',
    section: 'comparing',
  },
  'divide-one-part-only': {
    name: 'Dividing only one part of the fraction',
    faultyRule: '\\frac{18}{24} = \\frac{18 \\div 6}{24}',
    why: 'A fraction keeps its value only when the numerator and the denominator are both divided, or both multiplied, by the same number.',
    topic: 's1-simplifying-fractions',
    section: 'simplifying',
  },
  'fraction-upside-down': {
    name: 'Writing the fraction the wrong way up',
    faultyRule: '\\text{15 out of 40} = \\frac{40}{15}',
    why: 'The whole goes on the bottom, because it is what is being split up. The part goes on top.',
    topic: 's1-simplifying-fractions',
    section: 'part-of-a-whole',
  },
  'fraction-mixed-units': {
    name: 'Using different units on the top and the bottom',
    faultyRule: '45 \\text{ cm of } 3 \\text{ m} = \\frac{45}{3}',
    why: 'A fraction compares two amounts of the same kind of thing. Change both amounts into the same unit first.',
    topic: 's1-simplifying-fractions',
    section: 'part-of-a-whole',
  },
  'add-numerators-and-denominators': {
    name: 'Adding the tops and the bottoms of fractions',
    faultyRule: '\\frac{a}{b} + \\frac{c}{d} = \\frac{a + c}{b + d}',
    why: 'Fractions can only be added when they count the same size of piece, so the denominators must match first.',
    topic: 's1-add-subtract-fractions',
    section: 'common-denominators',
  },
  'left-to-right-ignoring-precedence': {
    name: 'Working strictly from left to right',
    faultyRule: '2 + 3 \\times 4 = 5 \\times 4 = 20',
    why: 'Multiplication is done before addition, wherever it appears: 3 times 4 is a single amount that is then added to 2.',
    topic: 's1-order-of-operations',
    section: 'the-order',
  },
  'change-denominator-only': {
    name: 'Changing the denominator without changing the numerator',
    faultyRule: '\\frac{1}{4} + \\frac{1}{6} = \\frac{1}{12} + \\frac{1}{12}',
    why: 'Making the pieces smaller means you need more of them. Whatever the denominator is multiplied by, the numerator must be multiplied by too.',
    topic: 's1-add-subtract-fractions',
    section: 'common-denominators',
  },
  'multiply-top-and-bottom-by-whole': {
    name: 'Multiplying both the top and the bottom by a whole number',
    faultyRule: '3 \\times \\frac{2}{5} = \\frac{3 \\times 2}{3 \\times 5}',
    why: 'Multiplying the top and the bottom by the same number gives an equivalent fraction, so the value does not change at all. Three lots of two fifths is six fifths.',
    topic: 's1-multiply-divide-fractions',
    section: 'multiplying',
  },
  'divide-without-flipping': {
    name: 'Multiplying instead of dividing',
    faultyRule: '\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{c}{d}',
    why: 'Dividing by a fraction is multiplying by its reciprocal. The second fraction must be turned upside down first.',
    topic: 's1-multiply-divide-fractions',
    section: 'dividing',
  },
  'flip-first-fraction': {
    name: 'Turning the wrong fraction upside down',
    faultyRule: '\\frac{a}{b} \\div \\frac{c}{d} = \\frac{b}{a} \\times \\frac{c}{d}',
    why: 'Only the number you are dividing by is replaced by its reciprocal. The first fraction is the amount being shared out, and it stays as it is.',
    topic: 's1-multiply-divide-fractions',
    section: 'dividing',
  },
  'mixed-to-improper-add': {
    name: 'Adding the whole number to the numerator',
    faultyRule: '2\\frac{3}{4} = \\frac{2 + 3}{4}',
    why: 'Each whole is worth as many pieces as the denominator, so the whole number must be multiplied by the denominator before the numerator is added.',
    topic: 's1-mixed-numbers',
    section: 'converting',
  },
  'multiply-mixed-parts-separately': {
    name: 'Multiplying the whole numbers and the fractions separately',
    faultyRule: '1\\frac{1}{2} \\times 2\\frac{1}{3} = 2\\frac{1}{6}',
    why: 'A mixed number is a sum, a whole number plus a fraction. Multiplying two sums needs every part times every part, so convert to improper fractions instead.',
    topic: 's1-mixed-numbers',
    section: 'calculating',
  },
  'fraction-digits-as-decimal': {
    name: 'Writing the numerator and the denominator as the digits of a decimal',
    faultyRule: '\\frac{3}{8} = 3.8',
    why: 'A fraction is a division: three eighths is 3 divided by 8, which is less than 1. The digits after a decimal point count tenths, hundredths and so on.',
    topic: 's1-decimals',
    section: 'fractions-to-decimals',
  },
  'decimal-wrong-power-of-ten': {
    name: 'Using the wrong power of ten',
    faultyRule: '0.35 = \\frac{35}{10}',
    why: 'The last digit of 0.35 is in the hundredths column, so 0.35 is 35 hundredths. The number of decimal places tells you the power of ten.',
    topic: 's1-decimals',
    section: 'decimals-to-fractions',
  },
  'decimal-add-misaligned': {
    name: 'Lining up the last digits instead of the decimal points',
    faultyRule: '3.5 + 1.25 = 1.60',
    why: 'Digits can only be added when they have the same place value: tenths with tenths, hundredths with hundredths. Lining up the points does that.',
    topic: 's1-decimals',
    section: 'adding-decimals',
  },
  'decimal-multiply-place': {
    name: 'Placing the point as if adding, when multiplying decimals',
    faultyRule: '0.3 \\times 0.4 = 1.2',
    why: 'Tenths times tenths are hundredths, so the answer has as many decimal places as the two numbers have altogether.',
    topic: 's1-decimals',
    section: 'multiplying-decimals',
  },
  'percentage-as-number': {
    name: 'Using the percentage as an ordinary number',
    faultyRule: '35\\% \\text{ of } 80 = 35 \\times 80',
    why: 'Per cent means out of a hundred, so 35% is 35 hundredths. Divide by 100 before multiplying.',
    topic: 's1-percentages',
    section: 'percentage-of-an-amount',
  },
  'percent-change-add-percent': {
    name: 'Adding the percentage as if it were an amount',
    faultyRule: '80 \\text{ increased by } 15\\% = 80 + 15',
    why: 'A percentage change is a fraction of the original amount, not a fixed number. Find 15% of 80 first, or multiply by the multiplier 1.15.',
    topic: 's1-percentages',
    section: 'increase-and-decrease',
  },
  'reverse-percentage-of-new': {
    name: 'Taking the percentage of the new amount to undo a change',
    faultyRule: '\\text{original} = 72 - 20\\% \\text{ of } 72',
    why: 'The change was a percentage of the original, which is unknown. Divide the new amount by the multiplier to undo the change exactly.',
    topic: 's1-percentages',
    section: 'reverse-percentages',
  },
  'ratio-order-reversed': {
    name: 'Writing the parts of a ratio in the wrong order',
    faultyRule: '\\text{boys} : \\text{girls} = 2 : 3 \\text{ written as } 3 : 2',
    why: 'The order of a ratio matches the order of the things being compared. Swapping the parts describes a different situation.',
    topic: 's1-ratio-proportion',
    section: 'what-a-ratio-is',
  },
  'share-divide-by-part': {
    name: 'Dividing the amount by one number in the ratio',
    faultyRule: '\\pounds 60 \\text{ in the ratio } 2 : 3 \\Rightarrow 60 \\div 3',
    why: 'The ratio 2 : 3 splits the amount into 2 + 3 = 5 equal parts. Divide by the total number of parts to find one part.',
    topic: 's1-ratio-proportion',
    section: 'sharing-in-a-ratio',
  },
  'proportion-add-difference': {
    name: 'Adding the difference instead of scaling',
    faultyRule: '5 \\text{ cost } 3.40 \\Rightarrow 8 \\text{ cost } 3.40 + 3',
    why: 'In direct proportion, quantities are multiplied by the same number, not increased by the same amount. Find the cost of one, then multiply.',
    topic: 's1-ratio-proportion',
    section: 'direct-proportion',
  },
  'multiply-base-by-exponent': {
    name: 'Multiplying the base by the exponent',
    faultyRule: 'a^{n} = a \\times n',
    why: 'An exponent counts how many times the base is multiplied by itself, not what to multiply it by.',
    topic: 's1-order-of-operations',
    section: 'powers',
  },
  'minus-sign-and-powers': {
    name: 'Mixing up a negative base with a minus sign in front of a power',
    faultyRule: '-3^{2} = \\left(-3\\right)^{2}',
    why: 'Without brackets the power belongs to the number only, and the minus sign is applied afterwards. With brackets the minus sign is part of the base.',
    topic: 's1-order-of-operations',
    section: 'powers-and-negatives',
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
  'fractional-exponent-ignore-numerator': {
    name: 'Taking the root but forgetting the power',
    faultyRule: 'a^{\\frac{m}{n}} = \\sqrt[n]{a}',
    why: 'The denominator gives the root, and the numerator still says what power to raise it to. Both parts matter.',
    topic: 's2-fractional-exponents',
    section: 'general-fractional-exponents',
  },
  'swap-root-and-power': {
    name: 'Swapping the root and the power',
    faultyRule: 'a^{\\frac{m}{n}} = \\sqrt[m]{a^{n}}',
    why: 'The denominator is always the root and the numerator is always the power: the bottom number goes on the root sign.',
    topic: 's2-fractional-exponents',
    section: 'radical-and-exponent-form',
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
