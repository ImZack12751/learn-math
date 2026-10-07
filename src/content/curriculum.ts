/**
 * The curriculum: nine stages, every topic and the prerequisite graph.
 *
 * Stages 1 to 3 are the approved build scope (CONTENT_GUIDE section 8). Stages 4 to 9 are
 * recorded now so the stage map, depth readout and diagnostic have their full shape; their
 * topic lists and prerequisites are provisional until each stage is built and reviewed.
 *
 * Study order inside a stage is the array order. `curriculum.test.ts` checks that every
 * prerequisite comes earlier and that the graph is acyclic.
 */

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type TopicId = string;

export interface TopicEntry {
  id: TopicId;
  title: string;
  /** One line for cards and the command palette. Required once a topic is built. */
  summary?: string;
  prerequisites: TopicId[];
  /** Estimated study time for the topic page and its first practice set. */
  minutes?: number;
}

export interface StageEntry {
  id: StageId;
  title: string;
  tagline: string;
  prerequisiteStages: StageId[];
  optional: boolean;
  topics: TopicEntry[];
}

export interface Topic extends TopicEntry {
  stage: StageId;
  /** 1-based position within the stage. */
  order: number;
}

const t = (
  id: TopicId,
  title: string,
  prerequisites: TopicId[] = [],
  summary?: string,
  minutes?: number,
): TopicEntry => ({
  id,
  title,
  prerequisites,
  ...(summary === undefined ? {} : { summary }),
  ...(minutes === undefined ? {} : { minutes }),
});

export const stages: readonly StageEntry[] = [
  {
    id: 1,
    title: 'Arithmetic',
    tagline: 'Numbers, fractions, percentages and proportion, rebuilt from the ground up.',
    prerequisiteStages: [],
    optional: false,
    topics: [
      t(
        's1-integers-number-line',
        'Integers and the number line',
        [],
        'Whole numbers, negatives and where they sit on the line.',
        30,
      ),
      t(
        's1-negative-operations',
        'Operations with negative numbers',
        ['s1-integers-number-line'],
        'Adding, subtracting, multiplying and dividing with negatives.',
        40,
      ),
      t(
        's1-order-of-operations',
        'Order of operations',
        ['s1-negative-operations'],
        'Which operation comes first, and why. Powers as repeated multiplication.',
        40,
      ),
      t(
        's1-factors-multiples-primes',
        'Factors, multiples, primes, HCF and LCM',
        ['s1-order-of-operations'],
        'Breaking numbers into prime building blocks.',
        50,
      ),
      t(
        's1-fractions-equivalent',
        'Fractions as parts; equivalent fractions',
        ['s1-factors-multiples-primes'],
        'What a fraction means, and why different fractions can be equal.',
        40,
      ),
      t(
        's1-simplifying-fractions',
        'Simplifying fractions',
        ['s1-fractions-equivalent'],
        'Writing a fraction with the smallest possible numbers.',
        30,
      ),
      t(
        's1-add-subtract-fractions',
        'Adding and subtracting fractions',
        ['s1-simplifying-fractions'],
        'Common denominators, and why they are needed.',
        45,
      ),
      t(
        's1-multiply-divide-fractions',
        'Multiplying and dividing fractions',
        ['s1-simplifying-fractions', 's1-negative-operations'],
        'Fractions of fractions, and dividing by flipping.',
        45,
      ),
      t(
        's1-mixed-numbers',
        'Mixed numbers and improper fractions',
        ['s1-add-subtract-fractions', 's1-multiply-divide-fractions'],
        'Moving between the two forms and calculating with both.',
        40,
      ),
      t(
        's1-decimals',
        'Decimals and conversions',
        ['s1-simplifying-fractions'],
        'Place value, and converting between decimals and fractions.',
        45,
      ),
      t(
        's1-percentages',
        'Percentages',
        ['s1-decimals', 's1-multiply-divide-fractions'],
        'Percentages of amounts, increase and decrease, and reverse percentages.',
        60,
      ),
      t(
        's1-ratio-proportion',
        'Ratio and proportion',
        ['s1-simplifying-fractions', 's1-multiply-divide-fractions'],
        'Sharing in a ratio and scaling quantities in proportion.',
        50,
      ),
      t(
        's1-rates-units',
        'Rates and unit conversion',
        ['s1-ratio-proportion', 's1-decimals'],
        'Speed, unit rates and converting between units.',
        45,
      ),
      t(
        's1-estimation',
        'Estimation and sense-checking',
        ['s1-decimals', 's1-order-of-operations'],
        'Rounding sensibly and catching answers that cannot be right.',
        35,
      ),
    ],
  },
  {
    id: 2,
    title: 'Algebra foundations',
    tagline: 'Letters for numbers, the laws of exponents, and solving equations step by step.',
    prerequisiteStages: [1],
    optional: false,
    topics: [
      t(
        's2-variables-expressions',
        'Variables, terms and expressions',
        ['s1-order-of-operations', 's1-negative-operations'],
        'What a letter stands for, and the parts of an expression.',
        35,
      ),
      t(
        's2-like-terms',
        'Collecting like terms',
        ['s2-variables-expressions'],
        'Combining terms that are the same kind of thing.',
        30,
      ),
      t(
        's2-substitution',
        'Substitution',
        ['s2-variables-expressions', 's1-multiply-divide-fractions'],
        'Replacing letters with numbers and evaluating.',
        35,
      ),
      t(
        's2-exponent-laws',
        'Integer exponent laws',
        ['s2-like-terms'],
        'Multiplying, dividing and raising powers, and why the laws work.',
        50,
      ),
      t(
        's2-zero-negative-exponents',
        'Zero and negative exponents',
        ['s2-exponent-laws', 's1-multiply-divide-fractions'],
        'What a zero or negative exponent must mean for the laws to hold.',
        45,
      ),
      t(
        's2-standard-form',
        'Scientific notation (standard form)',
        ['s2-zero-negative-exponents', 's1-decimals'],
        'Writing very large and very small numbers compactly.',
        40,
      ),
      t(
        's2-roots',
        'Square roots and nth roots',
        ['s2-exponent-laws', 's1-factors-multiples-primes'],
        'Undoing powers: square roots, cube roots and beyond.',
        40,
      ),
      t(
        's2-surds',
        'Simplifying surds',
        ['s2-roots'],
        'Exact roots, and taking out square factors.',
        45,
      ),
      t(
        's2-fractional-exponents',
        'Fractional exponents',
        ['s2-zero-negative-exponents', 's2-roots'],
        'Exponents like one half and two thirds, and converting between radical and exponent form.',
        55,
      ),
      t(
        's2-combined-exponent-laws',
        'Combining all exponent laws',
        ['s2-fractional-exponents', 's2-surds'],
        'Simplifying expressions that need every law at once.',
        50,
      ),
      t(
        's2-expanding-single-brackets',
        'Expanding single brackets',
        ['s2-like-terms', 's1-negative-operations'],
        'Multiplying out a bracket, and taking out a single common factor.',
        45,
      ),
      t(
        's2-one-two-step-equations',
        'One-step and two-step equations',
        ['s2-like-terms'],
        'Keeping an equation balanced while undoing operations.',
        40,
      ),
      t(
        's2-multi-step-equations',
        'Multi-step equations',
        ['s2-expanding-single-brackets', 's2-one-two-step-equations'],
        'Brackets and variables on both sides.',
        50,
      ),
      t(
        's2-equations-with-fractions',
        'Equations with fractions',
        ['s2-multi-step-equations', 's1-add-subtract-fractions'],
        'Clearing denominators safely.',
        45,
      ),
      t(
        's2-rearranging-1',
        'Changing the subject: one operation, then many',
        ['s2-multi-step-equations'],
        'Making a different letter the subject of a formula.',
        45,
      ),
      t(
        's2-rearranging-2',
        'Changing the subject: powers and roots',
        ['s2-rearranging-1', 's2-roots'],
        'Undoing squares and roots inside formulae.',
        45,
      ),
      t(
        's2-rearranging-3',
        'Changing the subject: harder cases',
        ['s2-rearranging-2', 's2-expanding-single-brackets'],
        'The subject appears twice, or sits in a denominator or a root.',
        55,
      ),
      t(
        's2-forming-equations',
        'Forming equations from word problems',
        ['s2-multi-step-equations', 's2-equations-with-fractions'],
        'Turning a situation into an equation, then solving it.',
        50,
      ),
    ],
  },
  {
    id: 3,
    title: 'Intermediate algebra',
    tagline:
      'Quadratics, algebraic fractions, simultaneous equations and a first look at logarithms.',
    prerequisiteStages: [2],
    optional: false,
    topics: [
      t(
        's3-double-brackets',
        'Double brackets and special products',
        ['s2-expanding-single-brackets', 's2-exponent-laws'],
        'Expanding two brackets, perfect squares and the difference of two squares.',
        50,
      ),
      t(
        's3-factorise-common-grouping',
        'Factorising: common factor and grouping',
        ['s3-double-brackets'],
        'Taking out the highest common factor, and factorising in pairs.',
        45,
      ),
      t(
        's3-factorise-trinomials',
        'Factorising trinomials',
        ['s3-factorise-common-grouping'],
        'Reversing double-bracket expansion.',
        55,
      ),
      t(
        's3-difference-of-squares',
        'Difference of two squares',
        ['s3-double-brackets', 's3-factorise-common-grouping'],
        'Recognising and factorising a squared minus a squared.',
        35,
      ),
      t(
        's3-quadratics-factorising',
        'Solving quadratics by factorising',
        ['s3-factorise-trinomials', 's3-difference-of-squares', 's2-multi-step-equations'],
        'If a product is zero, one factor must be zero.',
        50,
      ),
      t(
        's3-completing-square',
        'Completing the square',
        ['s3-quadratics-factorising', 's2-surds'],
        'Rewriting a quadratic around a perfect square.',
        55,
      ),
      t(
        's3-quadratic-formula',
        'The quadratic formula and the discriminant',
        ['s3-completing-square'],
        'A formula for every quadratic, and how many solutions to expect.',
        55,
      ),
      t(
        's3-alg-fractions-simplify',
        'Algebraic fractions: simplify, multiply and divide',
        ['s3-factorise-trinomials', 's3-difference-of-squares', 's1-multiply-divide-fractions'],
        'Cancelling factors, never terms.',
        50,
      ),
      t(
        's3-alg-fractions-add',
        'Algebraic fractions: add and subtract',
        ['s3-alg-fractions-simplify', 's1-add-subtract-fractions'],
        'Common denominators with letters.',
        50,
      ),
      t(
        's3-equations-alg-fractions',
        'Equations with algebraic fractions',
        ['s3-alg-fractions-add', 's3-quadratics-factorising'],
        'Clearing algebraic denominators and checking the answers.',
        55,
      ),
      t(
        's3-radical-equations',
        'Radical equations and extraneous solutions',
        ['s3-quadratics-factorising', 's2-rearranging-2'],
        'Squaring both sides, and why answers must be checked.',
        50,
      ),
      t(
        's3-absolute-value-equations',
        'Absolute value equations',
        ['s1-integers-number-line', 's2-multi-step-equations'],
        'Distance from zero, and the two cases it creates.',
        45,
      ),
      t(
        's3-simultaneous-linear',
        'Simultaneous equations: substitution and elimination',
        ['s2-multi-step-equations', 's2-rearranging-1'],
        'Two equations, two unknowns, one shared solution.',
        55,
      ),
      t(
        's3-simultaneous-linear-quadratic',
        'Simultaneous equations: linear with quadratic',
        ['s3-simultaneous-linear', 's3-quadratics-factorising'],
        'Where a line meets a curve.',
        55,
      ),
      t(
        's3-linear-inequalities',
        'Linear inequalities',
        ['s2-multi-step-equations'],
        'Solving inequalities, and when the sign must flip.',
        45,
      ),
      t(
        's3-quadratic-inequalities',
        'Quadratic inequalities',
        ['s3-linear-inequalities', 's3-quadratics-factorising'],
        'Using the roots to find where a quadratic is positive or negative.',
        50,
      ),
      t(
        's3-exp-log-intro',
        'Exponentials and logarithms',
        ['s2-combined-exponent-laws'],
        'A logarithm asks: which exponent gives this number?',
        50,
      ),
      t(
        's3-log-laws',
        'Log laws',
        ['s3-exp-log-intro'],
        'The laws of logarithms, derived from the exponent laws.',
        50,
      ),
      t(
        's3-exp-log-equations',
        'Solving exponential and log equations',
        ['s3-log-laws', 's2-rearranging-1'],
        'Bringing an unknown down from an exponent.',
        55,
      ),
    ],
  },
  {
    id: 4,
    title: 'Functions and graphs',
    tagline: 'Lines, functions, transformations and the graphs that model the world.',
    prerequisiteStages: [3],
    optional: false,
    topics: [
      t('s4-pythagoras', "Pythagoras' theorem", ['s2-surds', 's2-rearranging-2']),
      t('s4-coordinates', 'Coordinates: gradient, midpoint and distance', [
        's4-pythagoras',
        's2-substitution',
      ]),
      t('s4-straight-lines', 'Equations of lines; parallel and perpendicular', [
        's4-coordinates',
        's2-rearranging-1',
      ]),
      t('s4-function-notation', 'Function notation, domain and range', [
        's2-substitution',
        's3-linear-inequalities',
      ]),
      t('s4-graphing-linear-quadratic', 'Graphing linear and quadratic functions', [
        's4-straight-lines',
        's4-function-notation',
        's3-completing-square',
      ]),
      t('s4-transformations', 'Transformations of graphs', ['s4-graphing-linear-quadratic']),
      t('s4-composite-functions', 'Composite functions', ['s4-function-notation']),
      t('s4-inverse-functions', 'Inverse functions', [
        's4-composite-functions',
        's2-rearranging-3',
      ]),
      t('s4-polynomial-division', 'Polynomial division; remainder and factor theorems', [
        's3-factorise-trinomials',
        's4-function-notation',
      ]),
      t('s4-polynomial-graphs', 'Polynomial graphs and end behaviour', [
        's4-polynomial-division',
        's4-graphing-linear-quadratic',
      ]),
      t('s4-rational-functions', 'Rational functions and asymptotes', [
        's4-polynomial-graphs',
        's3-alg-fractions-simplify',
      ]),
      t('s4-exp-log-functions', 'Exponential and logarithmic functions', [
        's4-transformations',
        's4-inverse-functions',
        's3-exp-log-equations',
      ]),
      t('s4-piecewise-functions', 'Piecewise functions', [
        's4-graphing-linear-quadratic',
        's3-absolute-value-equations',
      ]),
      t('s4-modelling', 'Modelling with functions', [
        's4-exp-log-functions',
        's4-piecewise-functions',
      ]),
    ],
  },
  {
    id: 5,
    title: 'Trigonometry',
    tagline: 'Triangles, the unit circle, identities and periodic motion.',
    prerequisiteStages: [4],
    optional: false,
    topics: [
      t('s5-right-triangle-trig', 'Right-triangle trigonometry', [
        's4-pythagoras',
        's1-ratio-proportion',
      ]),
      t('s5-unit-circle-radians', 'The unit circle and radians', [
        's5-right-triangle-trig',
        's4-coordinates',
      ]),
      t('s5-exact-values', 'Exact values', ['s5-unit-circle-radians', 's2-surds']),
      t('s5-trig-graphs', 'Graphs of sine, cosine and tangent', [
        's5-exact-values',
        's4-transformations',
      ]),
      t('s5-reciprocal-functions', 'Reciprocal trigonometric functions', ['s5-trig-graphs']),
      t('s5-pythagorean-identities', 'Pythagorean identities', [
        's5-exact-values',
        's5-reciprocal-functions',
      ]),
      t('s5-compound-angles', 'Angle-sum identities', ['s5-pythagorean-identities']),
      t('s5-double-half-angle', 'Double-angle and half-angle identities', ['s5-compound-angles']),
      t('s5-inverse-trig', 'Inverse trigonometric functions', [
        's5-trig-graphs',
        's4-inverse-functions',
      ]),
      t('s5-trig-equations', 'Solving trigonometric equations', [
        's5-inverse-trig',
        's5-double-half-angle',
        's3-quadratics-factorising',
      ]),
      t('s5-sine-cosine-rules', 'The sine and cosine rules', [
        's5-right-triangle-trig',
        's5-exact-values',
      ]),
      t('s5-triangle-area', 'Area of a triangle', ['s5-sine-cosine-rules']),
      t('s5-applications', 'Applications: bearings and harmonic motion', [
        's5-triangle-area',
        's5-trig-graphs',
      ]),
    ],
  },
  {
    id: 6,
    title: 'Advanced algebra and precalculus',
    tagline:
      'Complex numbers, series, vectors, matrices and counting. Take the topics in any order.',
    prerequisiteStages: [5],
    optional: false,
    topics: [
      t('s6-complex-arithmetic', 'Complex numbers: arithmetic', ['s3-quadratic-formula']),
      t('s6-argand-polar', 'The Argand diagram and polar form', [
        's6-complex-arithmetic',
        's5-inverse-trig',
      ]),
      t('s6-de-moivre', "De Moivre's theorem", ['s6-argand-polar', 's5-compound-angles']),
      t('s6-roots-of-unity', 'Roots of unity', ['s6-de-moivre']),
      t('s6-polynomial-roots', 'Polynomial roots and the fundamental theorem of algebra', [
        's6-complex-arithmetic',
        's4-polynomial-division',
      ]),
      t('s6-arithmetic-sequences', 'Arithmetic sequences and series', ['s2-forming-equations']),
      t('s6-geometric-sequences', 'Geometric sequences and series', [
        's6-arithmetic-sequences',
        's3-exp-log-equations',
      ]),
      t('s6-sigma-notation', 'Sigma notation', ['s6-arithmetic-sequences']),
      t('s6-infinite-geometric-series', 'Infinite geometric series', [
        's6-geometric-sequences',
        's6-sigma-notation',
        's3-linear-inequalities',
      ]),
      t('s6-counting', 'Counting, permutations and combinations', ['s1-factors-multiples-primes']),
      t('s6-binomial-theorem', 'The binomial theorem', [
        's6-counting',
        's6-sigma-notation',
        's3-double-brackets',
      ]),
      t('s6-induction', 'Mathematical induction', ['s6-sigma-notation']),
      t('s6-partial-fractions', 'Partial fractions', [
        's3-alg-fractions-add',
        's4-polynomial-division',
      ]),
      t('s6-conic-sections', 'Conic sections', ['s3-completing-square', 's4-straight-lines']),
      t('s6-parametric-polar-curves', 'Parametric and polar curves', [
        's5-trig-graphs',
        's4-function-notation',
      ]),
      t('s6-vectors', 'Vectors in 2D and 3D', ['s5-right-triangle-trig', 's4-coordinates']),
      t('s6-dot-cross-product', 'Dot and cross product', ['s6-vectors', 's5-sine-cosine-rules']),
      t('s6-lines-planes', 'Lines and planes', ['s6-dot-cross-product']),
      t('s6-matrices', 'Matrices and determinants', ['s3-simultaneous-linear']),
      t('s6-matrix-systems', 'Solving systems with matrices', ['s6-matrices']),
      t('s6-probability', 'Probability basics', ['s6-counting', 's1-percentages']),
      t('s6-distributions', 'Probability distributions basics', [
        's6-probability',
        's6-binomial-theorem',
      ]),
    ],
  },
  {
    id: 7,
    title: 'Differential calculus',
    tagline: 'Limits, derivatives and the mathematics of change.',
    prerequisiteStages: [4, 5],
    optional: false,
    topics: [
      t('s7-limit-idea', 'The idea of a limit', ['s4-rational-functions']),
      t('s7-limit-laws', 'Limit laws and one-sided limits', [
        's7-limit-idea',
        's4-piecewise-functions',
      ]),
      t('s7-limits-at-infinity', 'Limits at infinity', ['s7-limit-laws']),
      t('s7-continuity', 'Continuity', ['s7-limit-laws']),
      t('s7-first-principles', 'The derivative from first principles', [
        's7-limit-idea',
        's3-double-brackets',
        's4-straight-lines',
      ]),
      t('s7-derivative-rules', 'Power, sum, product and quotient rules', ['s7-first-principles']),
      t('s7-chain-rule', 'The chain rule', ['s7-derivative-rules', 's4-composite-functions']),
      t('s7-transcendental-derivatives', 'Derivatives of trig, exponential and log functions', [
        's7-chain-rule',
        's5-compound-angles',
        's4-exp-log-functions',
      ]),
      t('s7-implicit-differentiation', 'Implicit differentiation', [
        's7-transcendental-derivatives',
      ]),
      t('s7-inverse-derivatives', 'Derivatives of inverse functions', [
        's7-implicit-differentiation',
        's5-inverse-trig',
      ]),
      t('s7-higher-derivatives', 'Higher derivatives', ['s7-derivative-rules']),
      t('s7-tangents-normals', 'Tangents and normals', ['s7-derivative-rules']),
      t('s7-related-rates', 'Related rates', ['s7-implicit-differentiation']),
      t('s7-curve-sketching', 'Curve sketching: monotonicity, concavity, inflection', [
        's7-higher-derivatives',
        's7-transcendental-derivatives',
      ]),
      t('s7-optimisation', 'Optimisation', ['s7-curve-sketching']),
      t('s7-mean-value-theorem', 'The mean value theorem', [
        's7-continuity',
        's7-derivative-rules',
      ]),
      t('s7-lhopital', "L'Hôpital's rule", [
        's7-transcendental-derivatives',
        's7-limits-at-infinity',
      ]),
      t('s7-linear-approximation', 'Linear approximation', ['s7-tangents-normals']),
    ],
  },
  {
    id: 8,
    title: 'Integral calculus and series',
    tagline: 'Accumulation, area, volume, differential equations and infinite series.',
    prerequisiteStages: [6, 7],
    optional: false,
    topics: [
      t('s8-antiderivatives', 'Antiderivatives', ['s7-transcendental-derivatives']),
      t('s8-riemann-sums', 'Area under a curve and Riemann sums', [
        's8-antiderivatives',
        's6-sigma-notation',
      ]),
      t('s8-fundamental-theorem', 'The definite integral and the fundamental theorem', [
        's8-riemann-sums',
      ]),
      t('s8-substitution', 'Integration by substitution', [
        's8-fundamental-theorem',
        's7-chain-rule',
      ]),
      t('s8-by-parts', 'Integration by parts', ['s8-substitution']),
      t('s8-trig-integrals', 'Trig integrals and trig substitution', [
        's8-by-parts',
        's5-double-half-angle',
      ]),
      t('s8-partial-fraction-integration', 'Integration with partial fractions', [
        's8-substitution',
        's6-partial-fractions',
      ]),
      t('s8-improper-integrals', 'Improper integrals', [
        's8-fundamental-theorem',
        's7-limits-at-infinity',
      ]),
      t('s8-area-between-curves', 'Areas between curves', ['s8-fundamental-theorem']),
      t('s8-volumes', 'Volumes: discs, washers and shells', ['s8-area-between-curves']),
      t('s8-arc-length', 'Arc length and surface area', ['s8-volumes', 's8-trig-integrals']),
      t('s8-kinematics', 'Kinematics and applications', ['s8-fundamental-theorem']),
      t('s8-separable-odes', 'Separable differential equations and slope fields', [
        's8-substitution',
      ]),
      t('s8-sequences-limits', 'Sequences and their limits', [
        's6-infinite-geometric-series',
        's7-limits-at-infinity',
      ]),
      t('s8-convergence-tests-1', 'Convergence: divergence, comparison and integral tests', [
        's8-sequences-limits',
        's8-improper-integrals',
      ]),
      t('s8-convergence-tests-2', 'Convergence: ratio, root and alternating series tests', [
        's8-convergence-tests-1',
      ]),
      t('s8-power-series', 'Power series', ['s8-convergence-tests-2']),
      t('s8-radius-of-convergence', 'Radius of convergence', ['s8-power-series']),
      t('s8-taylor-series', 'Taylor and Maclaurin series', [
        's8-radius-of-convergence',
        's7-higher-derivatives',
      ]),
      t('s8-parametric-polar-calculus', 'Parametric and polar calculus', [
        's8-fundamental-theorem',
        's6-parametric-polar-curves',
      ]),
    ],
  },
  {
    id: 9,
    title: 'Advanced',
    tagline:
      'An optional stretch: differential equations, linear algebra, multivariable calculus and proof.',
    prerequisiteStages: [6, 8],
    optional: true,
    topics: [
      t('s9-first-order-odes', 'First-order linear differential equations', [
        's8-separable-odes',
        's8-by-parts',
      ]),
      t('s9-second-order-odes', 'Second-order linear differential equations', [
        's9-first-order-odes',
        's6-complex-arithmetic',
      ]),
      t('s9-laplace', 'Laplace transforms: an introduction', [
        's9-second-order-odes',
        's8-improper-integrals',
      ]),
      t('s9-vector-spaces', 'Vector spaces', ['s6-matrix-systems', 's6-vectors']),
      t('s9-linear-maps', 'Linear maps', ['s9-vector-spaces']),
      t('s9-eigen', 'Eigenvalues and eigenvectors', ['s9-linear-maps', 's6-polynomial-roots']),
      t('s9-diagonalisation', 'Diagonalisation', ['s9-eigen']),
      t('s9-partial-derivatives', 'Partial derivatives', ['s7-chain-rule']),
      t('s9-gradient', 'Gradient and directional derivatives', [
        's9-partial-derivatives',
        's6-dot-cross-product',
      ]),
      t('s9-multiple-integrals', 'Multiple integrals', [
        's9-partial-derivatives',
        's8-substitution',
      ]),
      t('s9-line-surface-integrals', 'Line and surface integrals', [
        's9-multiple-integrals',
        's9-gradient',
        's8-parametric-polar-calculus',
      ]),
      t('s9-vector-calculus-theorems', "Green's, Stokes' and divergence theorems", [
        's9-line-surface-integrals',
        's6-lines-planes',
      ]),
      t('s9-proof-analysis', 'Proof and real analysis ideas', [
        's6-induction',
        's8-convergence-tests-2',
      ]),
    ],
  },
];

export const topics: readonly Topic[] = stages.flatMap((stage) =>
  stage.topics.map((entry, i) => ({ ...entry, stage: stage.id, order: i + 1 })),
);

const byId = new Map(topics.map((topic) => [topic.id, topic]));

export function getTopic(id: TopicId): Topic | undefined {
  return byId.get(id);
}

export function getStage(id: StageId): StageEntry {
  const stage = stages.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown stage ${id}`);
  return stage;
}

/** Every stage that must come before `id`, directly or indirectly. */
export function stageClosure(id: StageId): Set<StageId> {
  const seen = new Set<StageId>();
  const visit = (s: StageId) => {
    for (const p of getStage(s).prerequisiteStages) {
      if (!seen.has(p)) {
        seen.add(p);
        visit(p);
      }
    }
  };
  visit(id);
  return seen;
}
