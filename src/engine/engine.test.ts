import { describe, expect, it } from 'vitest';
import { parseLatex } from './ce-adapter';
import { check } from './check';
import { sumTex, termTex } from './latex';
import { plainToLatex } from './plain';
import { exactRoot, Q } from './rational';
import { deriveSeed, Rng } from './rng';
import { toLatex } from './latex';

describe('Rng', () => {
  it('is reproducible by seed and differs between seeds', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const c = new Rng(43);
    const seqA = Array.from({ length: 20 }, () => a.uint32());
    expect(Array.from({ length: 20 }, () => b.uint32())).toEqual(seqA);
    expect(Array.from({ length: 20 }, () => c.uint32())).not.toEqual(seqA);
  });

  it('keeps integers in range and covers every value', () => {
    const rng = new Rng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = rng.int(-3, 4);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThanOrEqual(4);
      seen.add(v);
    }
    expect(seen.size).toBe(8);
    for (let i = 0; i < 1000; i++) expect(rng.nonZero(1, 5)).not.toBe(0);
    for (let i = 0; i < 1000; i++) expect([0, 2]).not.toContain(rng.intExcept(-2, 2, [0, 2]));
  });

  it('derives distinct seeds for a set', () => {
    const seeds = new Set(Array.from({ length: 1000 }, (_, i) => deriveSeed(123, i)));
    expect(seeds.size).toBe(1000);
  });
});

describe('Q (exact rationals)', () => {
  it('normalises and calculates exactly', () => {
    expect(Q.of(6, -8).toString()).toBe('-3/4');
    expect(Q.of(1, 3).add(Q.of(1, 6)).toString()).toBe('1/2');
    expect(Q.of(2, 3).pow(-2).toString()).toBe('9/4');
    expect(Q.fromDecimal('-3.25').toString()).toBe('-13/4');
    expect(Q.fromDecimal('3.2e4').toString()).toBe('32000');
    expect(Q.fromRepeating('0.1(6)').toString()).toBe('1/6');
    expect(Q.fromRepeating('1.(142857)').toString()).toBe('8/7');
    expect(exactRoot(Q.of(27, 8), 3)?.toString()).toBe('3/2');
    expect(exactRoot(Q.of(-8), 3)?.toString()).toBe('-2');
    expect(exactRoot(Q.of(2), 2)).toBeNull();
    expect(Q.of(-3, 4).toLatex()).toBe('-\\frac{3}{4}');
  });
});

describe('LaTeX builders', () => {
  it('writes terms and sums the conventional way', () => {
    expect(termTex(1, 'x')).toBe('x');
    expect(termTex(-1, 'x')).toBe('-x');
    expect(termTex(Q.of(-2, 3), 'x')).toBe('-\\frac{2}{3}x');
    expect(sumTex(['3x', '-2', '0', '5'])).toBe('3x - 2 + 5');
    expect(sumTex(['0'])).toBe('0');
  });

  it('round-trips parsed answers through the serialiser', () => {
    for (const tex of [
      'x^{2} - 5x + 6',
      '\\frac{3}{4}',
      '2\\sqrt{3}',
      '\\sqrt[3]{x^{2}}',
      '-\\left(x + 1\\right)',
      '2\\frac{1}{3}',
      '-2 < x \\le 3',
      '3.2 \\times 10^{4}',
      '\\left(x + 2\\right)\\left(x - 3\\right)',
      'x = 1 \\pm \\sqrt{2}',
    ]) {
      const once = toLatex(parseLatex(tex));
      expect(toLatex(parseLatex(once)), tex).toBe(once);
    }
  });
});

describe('plain-text input', () => {
  const cases: [string, string][] = [
    ['x^(1/2)', 'x^{\\frac{1}{2}}'],
    ['sqrt(12)', '\\sqrt{12}'],
    ['2sqrt3', '2\\sqrt{3}'],
    ['2/4', '\\frac{2}{4}'],
    ['1/2x', '\\frac{1}{2}x'],
    ['3x^2-2x+1', '3x^{2} - 2x + 1'],
    ['(x+1)(x-2)', '\\left(x + 1\\right)\\left(x - 2\\right)'],
    ['2 1/3', '2\\frac{1}{3}'],
    ['-2<x<=3', '-2 < x \\le 3'],
    ['x=2 or x=-3', 'x = 2 \\text{ or } x = -3'],
    ['x=+-3', 'x = \\pm 3'],
    ['(2,3)', '\\left(2, 3\\right)'],
    ['root(3, 8)', '\\sqrt[3]{8}'],
    ['cbrt(x)^2', '\\left(\\sqrt[3]{x}\\right)^{2}'],
    ['log_2(8)', '\\log_{2} 8'],
    ['|x-1|', '\\left|x - 1\\right|'],
    ['2^-3', '2^{-3}'],
    ['pi r^2', '\\pi r^{2}'],
    ['xy', 'xy'],
    ['no solution', '\\varnothing'],
  ];
  it.each(cases)('%s → %s', (plain, latex) => {
    expect(plainToLatex(plain)).toBe(latex);
  });

  it('feeds the checker: typed answers are judged like MathLive ones', () => {
    const spec = { kind: 'number' as const, canonical: '4', form: ['integer' as const] };
    expect(check(plainToLatex('4'), spec).verdict).toBe('correct');
    expect(check(plainToLatex('8^(2/3)'), spec).verdict).toBe('right-value-wrong-form');
  });

  it('rejects malformed input with a message', () => {
    expect(() => plainToLatex('2x+')).toThrow();
    expect(() => plainToLatex('(x+1')).toThrow();
    expect(() => plainToLatex('x $ 2')).toThrow(/Unexpected character/);
  });
});
