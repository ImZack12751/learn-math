import { describe, expect, it } from 'vitest';
import { overallDepth } from './depth';

describe('overallDepth', () => {
  it('is 0 with no progress and 1 when everything is fully retained', () => {
    expect(overallDepth(new Map(), 151)).toBe(0);
    const all = new Map(Array.from({ length: 10 }, (_, i) => [`t${i}`, 1]));
    expect(overallDepth(all, 10)).toBe(1);
  });

  it('weights by retention and clamps bad values', () => {
    const m = new Map([
      ['a', 0.5],
      ['b', 2],
      ['c', -1],
    ]);
    expect(overallDepth(m, 4)).toBeCloseTo(0.375);
    expect(overallDepth(m, 0)).toBe(0);
  });
});
