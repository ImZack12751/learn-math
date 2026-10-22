/**
 * Small helpers shared by the topic generators: rich-text runs, number notation and the whole
 * number facts (prime factors, HCF, LCM) that Stage 1 builds on. Pure functions only.
 */
import { Q } from '../../engine/rational';

export const text = (v: string) => ({ t: 'text', v }) as const;
export const math = (v: string) => ({ t: 'math', v }) as const;

/** An integer for display, bracketed when negative so signs never run together: `\left(-3\right)`. */
export const signed = (n: number) => (n < 0 ? `\\left(${n}\\right)` : String(n));

/** A number in running text, with a proper minus sign: "−3". */
export const words = (n: number | Q): string => {
  const s = n instanceof Q ? plainQ(n) : String(n);
  return s.replace(/^-/, '−');
};

/** A rational in running text: "8", "3/4" or "−3/4". */
export const plainQ = (q: Q) => (q.isInteger ? q.toString() : `${q.n}/${q.d}`);

/** Thin-space thousands separators for whole numbers of five or more digits: `12\,500`. */
export function groupTex(digits: string): string {
  const [whole = '', frac] = digits.split('.');
  const negative = whole.startsWith('-');
  const w = negative ? whole.slice(1) : whole;
  const grouped = w.length >= 5 ? w.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : w;
  return `${negative ? '-' : ''}${grouped}${frac === undefined ? '' : `.${frac}`}`;
}

/** True when the rational has a terminating decimal expansion (denominator 2ᵃ5ᵇ). */
export function terminates(q: Q): boolean {
  let d = q.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n;
}

/** The exact decimal digits of a terminating rational, with no trailing zeros: "0.375", "-12.5". */
export function decimalString(q: Q): string {
  if (!terminates(q)) throw new Error(`${q.toString()} does not terminate`);
  const negative = q.n < 0n;
  const n = negative ? -q.n : q.n;
  let places = 0;
  let scale = 1n;
  while ((n * scale) % q.d !== 0n) {
    scale *= 10n;
    places++;
  }
  const digits = ((n * scale) / q.d).toString().padStart(places + 1, '0');
  const whole = digits.slice(0, digits.length - places);
  const frac = digits.slice(digits.length - places);
  return `${negative ? '-' : ''}${whole}${places > 0 ? `.${frac}` : ''}`;
}

/** A terminating rational as LaTeX decimal: `0.375`, `12\,500`. */
export const decimalTex = (q: Q) => groupTex(decimalString(q));

/** A terminating rational as running text: "0.375", "−12.5". */
export const decimalWords = (q: Q) => decimalString(q).replace(/^-/, '−');

export function gcdInt(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

export const lcmInt = (a: number, b: number) => Math.abs(a * b) / gcdInt(a, b);

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
  return true;
}

/** Prime factors in increasing order, repeated: 72 → [2, 2, 2, 3, 3]. */
export function primeFactors(n: number): number[] {
  const out: number[] = [];
  let rest = n;
  for (let p = 2; p * p <= rest; p++) {
    while (rest % p === 0) {
      out.push(p);
      rest /= p;
    }
  }
  if (rest > 1) out.push(rest);
  return out;
}

/** Prime factors grouped with their exponents, in increasing order: 72 → [[2, 3], [3, 2]]. */
export function primePowers(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (const p of primeFactors(n)) {
    const last = out.at(-1);
    if (last && last[0] === p) last[1]++;
    else out.push([p, 1]);
  }
  return out;
}

/** A product of prime powers in index form: `2^{3} \times 3^{2}`. */
export const indexFormTex = (powers: readonly (readonly [number, number])[]) =>
  powers.map(([p, k]) => (k === 1 ? String(p) : `${p}^{${k}}`)).join(' \\times ');

/** Primes written out one by one: `2 \times 2 \times 2 \times 3`. */
export const repeatedTex = (factors: readonly number[]) => factors.join(' \\times ');
