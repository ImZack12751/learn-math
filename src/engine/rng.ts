/**
 * Seeded random numbers (sfc32). Every generator draws only through an Rng, so a seed reproduces
 * exactly the same problem for a given generator version.
 */
export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    // splitmix32 expands one 32-bit seed into four well-mixed state words.
    let s = seed >>> 0;
    const next = () => {
      s = (s + 0x9e3779b9) >>> 0;
      let z = s;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
      return (z ^ (z >>> 16)) >>> 0;
    };
    this.a = next();
    this.b = next();
    this.c = next();
    this.d = next();
    for (let i = 0; i < 12; i++) this.uint32();
  }

  uint32(): number {
    const t = (((this.a + this.b) >>> 0) + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) >>> 0;
    return t;
  }

  /** Uniform in [0, 1). */
  float(): number {
    return this.uint32() / 0x100000000;
  }

  /** Uniform integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`Bad integer range [${min}, ${max}]`);
    }
    return min + Math.floor(this.float() * (max - min + 1));
  }

  /** Uniform integer in [min, max] excluding the listed values. */
  intExcept(min: number, max: number, exclude: readonly number[]): number {
    const allowed: number[] = [];
    for (let v = min; v <= max; v++) if (!exclude.includes(v)) allowed.push(v);
    return this.pick(allowed);
  }

  /** Non-zero integer with absolute value in [lo, hi], random sign. */
  nonZero(lo: number, hi: number): number {
    return this.int(lo, hi) * this.sign();
  }

  sign(): 1 | -1 {
    return this.float() < 0.5 ? 1 : -1;
  }

  bool(probability = 0.5): boolean {
    return this.float() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick from an empty list');
    return items[Math.floor(this.float() * items.length)] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.float() * (i + 1));
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }
}

/** A seed for problem `index` of a set, derived from a session seed. */
export function deriveSeed(base: number, index: number): number {
  return (Math.imul(base ^ 0x5bd1e995, 0x01000193) + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
}
