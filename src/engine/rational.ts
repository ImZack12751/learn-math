/** Exact rational arithmetic on bigints. Always stored in lowest terms with a positive denominator. */

const abs = (n: bigint) => (n < 0n ? -n : n);

export function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export class Q {
  readonly n: bigint;
  readonly d: bigint;

  private constructor(n: bigint, d: bigint) {
    this.n = n;
    this.d = d;
  }

  static of(n: bigint | number, d: bigint | number = 1n): Q {
    let num = BigInt(n);
    let den = BigInt(d);
    if (den === 0n) throw new RangeError('Division by zero');
    if (den < 0n) {
      num = -num;
      den = -den;
    }
    const g = gcd(num, den) || 1n;
    return new Q(num / g, den / g);
  }

  /** Parses an exact decimal such as "-3.25" or "1.2e-3" (no rounding). */
  static fromDecimal(text: string): Q {
    const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text.trim());
    if (!m || (m[2] === '' && (m[3] ?? '') === '')) throw new Error(`Not a decimal: ${text}`);
    const sign = m[1] === '-' ? -1n : 1n;
    const whole = m[2] ?? '';
    const frac = m[3] ?? '';
    const exp = Number(m[4] ?? '0');
    let num = BigInt(whole + frac || '0') * sign;
    let den = 10n ** BigInt(frac.length);
    if (exp > 0) num *= 10n ** BigInt(exp);
    if (exp < 0) den *= 10n ** BigInt(-exp);
    return Q.of(num, den);
  }

  /** Exact value of a number with a repeating block, e.g. "0.1(6)" for 0.1666… */
  static fromRepeating(text: string): Q {
    const m = /^([+-]?)(\d*)\.(\d*)\((\d+)\)$/.exec(text.trim());
    if (!m) throw new Error(`Not a repeating decimal: ${text}`);
    const sign = m[1] === '-' ? -1n : 1n;
    const whole = BigInt(m[2] || '0');
    const fixed = m[3] ?? '';
    const rep = m[4] ?? '';
    const shiftAll = 10n ** BigInt(fixed.length + rep.length);
    const shiftFixed = 10n ** BigInt(fixed.length);
    const a = BigInt(fixed + rep);
    const b = BigInt(fixed || '0');
    const fraction = Q.of(a - b, shiftAll - shiftFixed);
    return Q.of(whole).add(fraction).mul(Q.of(sign));
  }

  add(o: Q): Q {
    return Q.of(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o: Q): Q {
    return Q.of(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o: Q): Q {
    return Q.of(this.n * o.n, this.d * o.d);
  }
  div(o: Q): Q {
    if (o.n === 0n) throw new RangeError('Division by zero');
    return Q.of(this.n * o.d, this.d * o.n);
  }
  neg(): Q {
    return Q.of(-this.n, this.d);
  }
  /** Integer powers only. */
  pow(k: number): Q {
    if (!Number.isInteger(k)) throw new Error('Q.pow needs an integer exponent');
    if (k < 0) return Q.of(1).div(this.pow(-k));
    return Q.of(this.n ** BigInt(k), this.d ** BigInt(k));
  }
  eq(o: Q): boolean {
    return this.n === o.n && this.d === o.d;
  }
  cmp(o: Q): number {
    const diff = this.n * o.d - o.n * this.d;
    return diff === 0n ? 0 : diff < 0n ? -1 : 1;
  }
  get isInteger(): boolean {
    return this.d === 1n;
  }
  get isZero(): boolean {
    return this.n === 0n;
  }
  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }
  toString(): string {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
  /** LaTeX with the sign in front: `-\frac{3}{4}`. */
  toLatex(): string {
    if (this.d === 1n) return String(this.n);
    const sign = this.n < 0n ? '-' : '';
    return `${sign}\\frac{${abs(this.n)}}{${this.d}}`;
  }
}

/** Exact k-th root of a rational when it is rational, otherwise null. */
export function exactRoot(q: Q, k: number): Q | null {
  if (q.n < 0n && k % 2 === 0) return null;
  const root = (x: bigint): bigint | null => {
    const negative = x < 0n;
    const v = negative ? -x : x;
    let r = BigInt(Math.round(Math.pow(Number(v), 1 / k)));
    for (const c of [r - 1n, r, r + 1n]) {
      if (c >= 0n && c ** BigInt(k) === v) {
        r = c;
        return negative ? -r : r;
      }
    }
    return null;
  };
  const n = root(q.n);
  const d = root(q.d);
  return n === null || d === null ? null : Q.of(n, d);
}
