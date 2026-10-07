import { describe, expect, it } from 'vitest';
import { check } from './check';
import type { AnswerSpec, FormRequirement, Verdict } from './types';

const num = (canonical: string, form: FormRequirement[] = []): AnswerSpec => ({
  kind: 'number',
  canonical,
  form,
});
const expr = (
  canonical: string,
  form: FormRequirement[] = [],
  domain?: AnswerSpec['domain'],
): AnswerSpec => ({
  kind: 'expression',
  canonical,
  form,
  ...(domain ? { domain } : {}),
});

function expectVerdict(spec: AnswerSpec, cases: [string, Verdict][]) {
  for (const [input, verdict] of cases) {
    expect(
      check(input, spec).verdict,
      `${input} vs ${spec.canonical} [${spec.form.join(',')}]`,
    ).toBe(verdict);
  }
}

describe('numbers', () => {
  it('accepts any equal value when no form is asked for', () => {
    expectVerdict(num('\\frac{1}{2}'), [
      ['\\frac{1}{2}', 'correct'],
      ['\\frac{2}{4}', 'correct'],
      ['0.5', 'correct'],
      ['\\frac{-1}{-2}', 'correct'],
      ['2^{-1}', 'correct'],
      ['\\frac{1}{3}', 'incorrect'],
      ['0.50001', 'incorrect'],
      ['-\\frac{1}{2}', 'incorrect'],
    ]);
  });

  it('checks a simplified fraction as well as its value', () => {
    expectVerdict(num('\\frac{3}{4}', ['simplified-fraction']), [
      ['\\frac{3}{4}', 'correct'],
      ['\\frac{6}{8}', 'right-value-wrong-form'],
      ['0.75', 'right-value-wrong-form'],
      ['\\frac{3}{5}', 'incorrect'],
    ]);
    expectVerdict(num('-\\frac{3}{4}', ['simplified-fraction']), [
      ['-\\frac{3}{4}', 'correct'],
      ['\\frac{-3}{4}', 'correct'],
      ['\\frac{3}{-4}', 'correct'],
    ]);
    expectVerdict(num('7', ['simplified-fraction']), [
      ['7', 'correct'],
      ['\\frac{7}{1}', 'right-value-wrong-form'],
      ['\\frac{14}{2}', 'right-value-wrong-form'],
    ]);
  });

  it('reads mixed numbers and checks mixed or improper form when asked', () => {
    expectVerdict(num('\\frac{7}{3}', ['mixed-number']), [
      ['2\\frac{1}{3}', 'correct'],
      ['\\frac{7}{3}', 'right-value-wrong-form'],
      ['2\\frac{2}{6}', 'right-value-wrong-form'],
      ['1\\frac{4}{3}', 'right-value-wrong-form'],
      ['2\\frac{1}{4}', 'incorrect'],
    ]);
    expectVerdict(num('\\frac{7}{3}', ['improper-fraction']), [
      ['\\frac{7}{3}', 'correct'],
      ['2\\frac{1}{3}', 'right-value-wrong-form'],
    ]);
    expectVerdict(num('-\\frac{7}{3}'), [['-2\\frac{1}{3}', 'correct']]);
  });

  it('compares surds exactly and checks simplest surd form', () => {
    expectVerdict(num('2\\sqrt{3}', ['simplest-surd']), [
      ['2\\sqrt{3}', 'correct'],
      ['\\sqrt{3}\\times2', 'correct'],
      ['\\sqrt{12}', 'right-value-wrong-form'],
      ['2\\sqrt{2}', 'incorrect'],
      ['3.4641016151', 'incorrect'],
    ]);
    expectVerdict(num('3', ['simplest-surd']), [['\\sqrt{9}', 'right-value-wrong-form']]);
    expectVerdict(num('2\\sqrt[3]{2}', ['simplest-surd']), [
      ['2\\sqrt[3]{2}', 'correct'],
      ['\\sqrt[3]{16}', 'right-value-wrong-form'],
    ]);
  });

  it('checks a rationalised denominator', () => {
    expectVerdict(num('\\frac{\\sqrt{2}}{2}', ['rationalised-denominator']), [
      ['\\frac{\\sqrt{2}}{2}', 'correct'],
      ['\\frac{1}{2}\\sqrt{2}', 'correct'],
      ['\\frac{1}{\\sqrt{2}}', 'right-value-wrong-form'],
      ['2^{-\\frac{1}{2}}', 'right-value-wrong-form'],
    ]);
  });

  it('evaluates fractional exponents exactly, including odd roots of negatives', () => {
    expectVerdict(num('4', ['integer']), [
      ['4', 'correct'],
      ['8^{\\frac{2}{3}}', 'right-value-wrong-form'],
      ['\\left(\\sqrt[3]{8}\\right)^{2}', 'right-value-wrong-form'],
      ['16^{\\frac{1}{2}}', 'right-value-wrong-form'],
      ['5', 'incorrect'],
    ]);
    expectVerdict(num('-2'), [['\\left(-8\\right)^{\\frac{1}{3}}', 'correct']]);
    expectVerdict(num('\\frac{1}{9}'), [['27^{-\\frac{2}{3}}', 'correct']]);
  });

  it('checks standard form', () => {
    expectVerdict(num('32000', ['standard-form']), [
      ['3.2\\times10^{4}', 'correct'],
      ['3.2 \\times 10^{4}', 'correct'],
      ['32\\times10^{3}', 'right-value-wrong-form'],
      ['32000', 'right-value-wrong-form'],
      ['3.2\\times10^{3}', 'incorrect'],
    ]);
    expectVerdict(num('0.00045', ['standard-form']), [['4.5\\times10^{-4}', 'correct']]);
  });

  it('checks rounding to significant figures and decimal places', () => {
    const sf: AnswerSpec = {
      kind: 'number',
      canonical: '\\sqrt{2}',
      form: [],
      accuracy: { sf: 3 },
    };
    expectVerdict(sf, [
      ['1.41', 'correct'],
      ['1.414', 'right-value-wrong-form'],
      ['\\sqrt{2}', 'right-value-wrong-form'],
      ['1.42', 'incorrect'],
      ['1.4', 'incorrect'],
    ]);
    const dp: AnswerSpec = {
      kind: 'number',
      canonical: '\\frac{2}{3}',
      form: [],
      accuracy: { dp: 2 },
    };
    expectVerdict(dp, [
      ['0.67', 'correct'],
      ['0.66', 'incorrect'],
    ]);
  });

  it('reads recurring decimals exactly', () => {
    expectVerdict(num('\\frac{1}{3}'), [
      ['0.\\overline{3}', 'correct'],
      ['0.333', 'incorrect'],
    ]);
  });

  it('rejects letters where a number is asked for, and reports unreadable input', () => {
    expect(check('2x', num('2')).verdict).toBe('incorrect');
    expect(check('\\frac{1}{}', num('2')).verdict).toBe('unparseable');
    expect(check('', num('2')).verdict).toBe('unparseable');
  });
});

describe('expressions', () => {
  it('accepts equivalent rewrites: reordering, factored or expanded, exponent or radical', () => {
    expectVerdict(expr('x^{2} - x - 6'), [
      ['x^{2} - x - 6', 'correct'],
      ['-6 - x + x^{2}', 'correct'],
      ['(x - 3)(x + 2)', 'correct'],
      ['(x + 2)(x - 3)', 'correct'],
      ['x^{2} + x - 6', 'incorrect'],
      ['x^{2} - 6', 'incorrect'],
    ]);
    expectVerdict(expr('\\sqrt{x}', [], { ranges: { x: [0.1, 9] } }), [
      ['x^{\\frac{1}{2}}', 'correct'],
      ['x^{0.5}', 'correct'],
      ['\\sqrt[4]{x^{2}}', 'correct'],
      ['\\frac{x}{2}', 'incorrect'],
    ]);
    expectVerdict(expr('x^{\\frac{2}{3}}'), [
      ['\\sqrt[3]{x^{2}}', 'correct'],
      ['\\left(\\sqrt[3]{x}\\right)^{2}', 'correct'],
      ['x^{\\frac{3}{2}}', 'incorrect'],
    ]);
  });

  it('respects the stated domain', () => {
    const positive = expr('x', [], { ranges: { x: [0.1, 10] } });
    const all = expr('x', [], { ranges: { x: [-10, 10] } });
    expect(check('\\sqrt{x^{2}}', positive).verdict).toBe('correct');
    expect(check('\\sqrt{x^{2}}', all).verdict).toBe('incorrect');
    expect(check('\\left|x\\right|', all).verdict).toBe('incorrect');
    // Defined on a different set: x/x is undefined at 0 but the sample avoids that point.
    expect(check('\\frac{x^{2}}{x}', all).verdict).toBe('correct');
    // Defined only for x ≥ 0 where x is defined everywhere: a difference.
    expect(check('\\left(\\sqrt{x}\\right)^{2}', all).verdict).toBe('incorrect');
  });

  it('checks expanded, collected and factorised forms', () => {
    expectVerdict(expr('x^{2} + 5x + 6', ['expanded']), [
      ['x^{2} + 5x + 6', 'correct'],
      ['6 + 5x + x^{2}', 'correct'],
      ['(x + 2)(x + 3)', 'right-value-wrong-form'],
      ['x^{2} + 2x + 3x + 6', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('(x + 2)(x + 3)', ['factorised']), [
      ['(x + 2)(x + 3)', 'correct'],
      ['(x + 3)(x + 2)', 'correct'],
      ['x^{2} + 5x + 6', 'right-value-wrong-form'],
      ['x(x + 5) + 6', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('2(x + 2)(x - 2)', ['factorised']), [
      ['2(x + 2)(x - 2)', 'correct'],
      ['2(x - 2)(x + 2)', 'correct'],
      ['(2x + 4)(x - 2)', 'right-value-wrong-form'],
      ['2(x^{2} - 4)', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('3x(2y + 3)', ['factorised']), [
      ['3x(2y + 3)', 'correct'],
      ['x(6y + 9)', 'right-value-wrong-form'],
      ['3(2xy + 3x)', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('(x + 2)(y + 3)', ['factorised']), [
      ['(x + 2)(y + 3)', 'correct'],
      ['x(y + 3) + 2(y + 3)', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('(2x - 3y)(2x + 3y)', ['factorised']), [
      ['(2x + 3y)(2x - 3y)', 'correct'],
      ['4x^{2} - 9y^{2}', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('(x + 1)^{2}', ['factorised']), [
      ['(x + 1)^{2}', 'correct'],
      ['(x + 1)(x + 1)', 'correct'],
    ]);
  });

  it('checks exponent forms', () => {
    expectVerdict(expr('x^{-2}', ['positive-exponents'], { ranges: { x: [0.5, 5] } }), [
      ['\\frac{1}{x^{2}}', 'correct'],
      ['x^{-2}', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('x^{\\frac{3}{2}}', ['exponent-form'], { ranges: { x: [0.5, 5] } }), [
      ['x^{\\frac{3}{2}}', 'correct'],
      ['x^{1.5}', 'correct'],
      ['\\sqrt{x^{3}}', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('\\sqrt{x^{3}}', ['radical-form'], { ranges: { x: [0.5, 5] } }), [
      ['\\sqrt{x^{3}}', 'correct'],
      ['\\left(\\sqrt{x}\\right)^{3}', 'correct'],
      ['x^{\\frac{3}{2}}', 'right-value-wrong-form'],
    ]);
    expectVerdict(expr('2^{7}', ['single-power']), [
      ['2^{7}', 'correct'],
      ['128', 'right-value-wrong-form'],
      ['2^{3}\\times2^{4}', 'right-value-wrong-form'],
      ['2^{12}', 'incorrect'],
    ]);
  });
});

describe('solution sets', () => {
  const spec: AnswerSpec = { kind: 'solution-set', canonical: '2, -3', variable: 'x', form: [] };
  it('accepts the solutions in any order and common notations', () => {
    expectVerdict(spec, [
      ['x = 2, x = -3', 'correct'],
      ['x = -3 \\text{ or } x = 2', 'correct'],
      ['-3, 2', 'correct'],
      ['x = 2', 'incorrect'],
      ['x = 2, x = 3', 'incorrect'],
      ['y = 2, y = -3', 'incorrect'],
      ['x = 2, x = -3, x = 1', 'incorrect'],
    ]);
  });
  it('expands plus-or-minus and handles no solution', () => {
    const pm: AnswerSpec = { kind: 'solution-set', canonical: '3, -3', variable: 'x', form: [] };
    expectVerdict(pm, [['x = \\pm 3', 'correct']]);
    const surd: AnswerSpec = {
      kind: 'solution-set',
      canonical: '1 + \\sqrt{2}, 1 - \\sqrt{2}',
      variable: 'x',
      form: ['simplest-surd'],
    };
    expectVerdict(surd, [
      ['x = 1 \\pm \\sqrt{2}', 'correct'],
      ['x = 1 \\pm \\sqrt{8}', 'incorrect'],
      ['x = \\frac{2 \\pm \\sqrt{8}}{2}', 'right-value-wrong-form'],
    ]);
    const none: AnswerSpec = {
      kind: 'solution-set',
      canonical: '\\varnothing',
      variable: 'x',
      form: [],
    };
    expectVerdict(none, [
      ['\\varnothing', 'correct'],
      ['\\text{no solution}', 'correct'],
      ['x = 0', 'incorrect'],
    ]);
  });
});

describe('inequalities', () => {
  const spec: AnswerSpec = {
    kind: 'inequality',
    canonical: '-2 < x \\le 3',
    variable: 'x',
    form: [],
  };
  it('compares as intervals', () => {
    expectVerdict(spec, [
      ['-2 < x \\le 3', 'correct'],
      ['3 \\ge x > -2', 'correct'],
      ['-2 \\le x \\le 3', 'incorrect'],
      ['-2 < x < 3', 'incorrect'],
      ['x > -2', 'incorrect'],
    ]);
    const outside: AnswerSpec = {
      kind: 'inequality',
      canonical: 'x < -1 \\text{ or } x > 4',
      variable: 'x',
      form: [],
    };
    expectVerdict(outside, [
      ['x > 4 \\text{ or } x < -1', 'correct'],
      ['-1 > x \\text{ or } 4 < x', 'correct'],
      ['-1 < x < 4', 'incorrect'],
    ]);
    const flip: AnswerSpec = {
      kind: 'inequality',
      canonical: 'x \\ge \\frac{5}{2}',
      variable: 'x',
      form: [],
    };
    expectVerdict(flip, [
      ['x \\ge 2.5', 'correct'],
      ['\\frac{5}{2} \\le x', 'correct'],
      ['x \\le \\frac{5}{2}', 'incorrect'],
      ['x = \\frac{5}{2}', 'incorrect'],
    ]);
  });
});

describe('ordered pairs', () => {
  const spec: AnswerSpec = {
    kind: 'ordered-pairs',
    canonical: '(1, 2), (-1, 0)',
    variables: ['x', 'y'],
    form: [],
  };
  it('accepts pairs in any order, or a single solution as assignments', () => {
    expectVerdict(spec, [
      ['(-1, 0), (1, 2)', 'correct'],
      ['(1, 2)', 'incorrect'],
      ['(2, 1), (0, -1)', 'incorrect'],
    ]);
    const one: AnswerSpec = {
      kind: 'ordered-pairs',
      canonical: '(2, 3)',
      variables: ['x', 'y'],
      form: [],
    };
    expectVerdict(one, [
      ['x = 2, y = 3', 'correct'],
      ['y = 3, x = 2', 'correct'],
      ['(2, 3)', 'correct'],
      ['(3, 2)', 'incorrect'],
    ]);
  });
});

describe('formulae', () => {
  const spec: AnswerSpec = {
    kind: 'formula',
    canonical: '\\sqrt{\\frac{A}{\\pi}}',
    variable: 'r',
    domain: { ranges: { A: [0.5, 20] } },
    form: [],
  };
  it('needs the subject alone on one side and an equivalent other side', () => {
    expectVerdict(spec, [
      ['r = \\sqrt{\\frac{A}{\\pi}}', 'correct'],
      ['\\frac{\\sqrt{A}}{\\sqrt{\\pi}} = r', 'correct'],
      ['r = \\frac{A}{\\pi}', 'incorrect'],
      ['r^{2} = \\frac{A}{\\pi}', 'incorrect'],
      ['r = \\frac{A}{\\pi r}', 'incorrect'],
      ['\\sqrt{\\frac{A}{\\pi}}', 'incorrect'],
    ]);
  });
});

describe('misconceptions', () => {
  it('names the faulty rule behind a wrong answer', () => {
    const spec = num('\\frac{19}{12}', ['simplified-fraction']);
    const rules = [
      { id: 'add-numerators-and-denominators', answer: '\\frac{8}{10}' },
      { id: 'other', answer: '7' },
    ];
    expect(check('\\frac{4}{5}', spec, rules).misconceptionId).toBe(
      'add-numerators-and-denominators',
    );
    expect(check('\\frac{8}{10}', spec, rules).misconceptionId).toBe(
      'add-numerators-and-denominators',
    );
    expect(check('\\frac{1}{2}', spec, rules).misconceptionId).toBeUndefined();
    expect(check('\\frac{19}{12}', spec, rules).verdict).toBe('correct');
  });

  it('matches expression misconceptions by value', () => {
    const spec = expr('x^{2} + 6x + 9', ['expanded']);
    const rules = [{ id: 'square-over-sum', answer: 'x^{2} + 9' }];
    expect(check('9 + x^{2}', spec, rules).misconceptionId).toBe('square-over-sum');
  });
});
