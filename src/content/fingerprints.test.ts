import { describe, expect, it } from 'vitest';
import { fingerprint } from '../fractal/fingerprint';
import { samplePoint } from '../fractal/math';
import { topics } from './curriculum';

describe('topic fractal fingerprints', () => {
  it('are distinct for every topic in the curriculum', () => {
    const seen = new Set(topics.map((t) => fingerprint(t.id).join(',')));
    expect(seen.size).toBe(topics.length);
  });

  it('sit just outside the main cardioid, where Julia sets are detailed', () => {
    for (const t of topics) {
      const c = fingerprint(t.id);
      expect(Math.hypot(...c)).toBeLessThan(0.8);
      // Near the boundary the orbit of 0 either stays bounded or escapes slowly; far outside it
      // escapes at once and the Julia set is sparse dust.
      const s = samplePoint('mandelbrot', c, [0, 0], [1, 0], 100);
      expect(s.t === -1 || s.t > 0.4, t.id).toBe(true);
    }
  });
});
