/**
 * Form checks. Each looks at the learner's tree exactly as written (never a simplified copy)
 * and returns a plain-language issue, or null when the form is right.
 */
import { some, type Node } from './ast';
import { exact } from './evaluate';
import {
  coef,
  commonVariables,
  content,
  degreeIn,
  isConstantPoly,
  monomialKey,
  toPoly,
  totalDegree,
  variablesOfPoly,
  type Poly,
} from './poly';
import { gcd, Q } from './rational';
import type { FormRequirement } from './types';

const stripNeg = (n: Node): Node => (n.k === 'neg' ? stripNeg(n.arg) : n);
const isIntLiteral = (n: Node) => n.k === 'num' && n.q.isInteger && !/[.e(]/i.test(n.text);

/** A fraction of integer literals, allowing a minus sign on either part. */
function intFraction(n: Node): { num: bigint; den: bigint } | null {
  if (n.k !== 'div') return null;
  const a = stripNeg(n.num);
  const b = stripNeg(n.den);
  if (!isIntLiteral(a) || !isIntLiteral(b) || a.k !== 'num' || b.k !== 'num') return null;
  return { num: a.q.n, den: b.q.n };
}

function lowestTerms(f: { num: bigint; den: bigint }): string | null {
  if (f.den === 0n) return 'The denominator cannot be zero.';
  if (f.den === 1n) return 'A denominator of 1 is not needed: write the whole number.';
  if (gcd(f.num, f.den) !== 1n) return 'The fraction can be simplified further.';
  return null;
}

function mixedIssue(n: Node): string | null {
  if (n.k !== 'mixed') return null;
  const f = intFraction(n.frac);
  if (!f) return 'Write the fraction part of a mixed number with whole numbers.';
  if (f.num >= f.den) return 'The fraction part of a mixed number must be less than 1.';
  return lowestTerms(f);
}

function fractionForm(node: Node, allowMixed: boolean, requireMixed: boolean): string | null {
  const n = stripNeg(node);
  if (isIntLiteral(n)) return null;
  if (n.k === 'mixed') {
    if (!allowMixed) return 'Give a single (improper) fraction, not a mixed number.';
    return mixedIssue(n);
  }
  const f = intFraction(n);
  if (!f) return 'Give a single fraction with whole numbers on top and bottom.';
  const issue = lowestTerms(f);
  if (issue) return issue;
  if (requireMixed && f.num > f.den) return 'Write this as a mixed number.';
  return null;
}

/** Square-free check for √n, and k-th-power-free for the k-th root. */
function hasPowerFactor(n: bigint, k: number): boolean {
  const kk = BigInt(k);
  for (let p = 2n; p ** kk <= n; p++) if (n % p ** kk === 0n) return true;
  return false;
}

function surdIssue(node: Node): string | null {
  let issue: string | null = null;
  some(node, (n) => {
    if (issue) return true;
    const radicand = n.k === 'sqrt' ? n.arg : n.k === 'root' ? n.arg : null;
    if (!radicand) return false;
    const index = n.k === 'root' ? exact(n.index) : Q.of(2);
    const k = index?.isInteger ? Number(index.n) : 2;
    const value = exact(radicand);
    if (radicand.k === 'div' || (value && !value.isInteger)) {
      issue = 'Simplest surd form has no fraction inside the root.';
    } else if (value && value.isInteger) {
      const v = value.n < 0n ? -value.n : value.n;
      if (v <= 1n || exact(n)) issue = 'This root has an exact value: write it as a number.';
      else if (hasPowerFactor(v, k))
        issue = `Take every ${k === 2 ? 'square' : `${k}th power`} factor outside the root.`;
    }
    return issue !== null;
  });
  return issue;
}

const isRadical = (n: Node) =>
  n.k === 'sqrt' ||
  n.k === 'root' ||
  (n.k === 'pow' &&
    (() => {
      const e = exact(n.exp);
      return e !== null && !e.isInteger;
    })());

function denominatorRadical(node: Node): boolean {
  return some(node, (n) => {
    if (n.k === 'div') return some(n.den, isRadical);
    if (n.k === 'pow') {
      // A negative exponent puts the base underneath: 2^(−1/2) is 1/√2.
      const e = exact(n.exp);
      return e !== null && e.n < 0n && (!e.isInteger || some(n.base, isRadical));
    }
    return false;
  });
}

/** Is this term a single monomial as written (number, letters, powers; no brackets around sums)? */
function isMonomialTerm(n: Node): boolean {
  switch (n.k) {
    case 'num':
    case 'sym':
    case 'const':
      return true;
    case 'neg':
      return isMonomialTerm(n.arg);
    case 'pow':
      return (n.base.k === 'sym' || n.base.k === 'num') && exact(n.exp) !== null;
    case 'mul':
      return n.args.every(isMonomialTerm);
    case 'div':
      return isMonomialTerm(n.num) && exact(n.den) !== null;
    default:
      return false;
  }
}

function collectedIssue(node: Node): string | null {
  const terms = node.k === 'add' ? node.args : [node];
  if (!terms.every(isMonomialTerm)) return 'Multiply out every bracket.';
  const seen = new Set<string>();
  for (const t of terms) {
    const p = toPoly(t);
    if (!p) return 'Multiply out every bracket.';
    for (const k of p.keys()) {
      if (seen.has(k)) return 'Collect the like terms.';
      seen.add(k);
    }
    if (p.size === 0 && terms.length > 1) return 'Remove terms that equal zero.';
  }
  return null;
}

/* ---------- Factorised ---------- */

function isPerfectSquare(q: Q): boolean {
  if (q.n < 0n) return false;
  const root = (x: bigint) => {
    const r = BigInt(Math.round(Math.sqrt(Number(x))));
    return [r - 1n, r, r + 1n].some((c) => c >= 0n && c * c === x);
  };
  return root(q.n) && root(q.d);
}

const onlyKeys = (p: Poly, allowed: string[]) => [...p.keys()].every((k) => allowed.includes(k));

/** Rational roots of a univariate polynomial via the rational root theorem. */
function hasRationalRoot(p: Poly, v: string): boolean {
  const deg = degreeIn(p, v);
  const coeffs: Q[] = [];
  for (let i = 0; i <= deg; i++) coeffs.push(coef(p, i === 0 ? '' : monomialKey({ [v]: i })));
  const lcm = coeffs.reduce((m, c) => (m * c.d) / gcd(m, c.d), 1n);
  const ints = coeffs.map((c) => (c.n * lcm) / c.d);
  const a0 = ints[0] ?? 0n;
  const an = ints[deg] ?? 1n;
  if (a0 === 0n) return true;
  const divisors = (x: bigint) => {
    const out: bigint[] = [];
    const ax = x < 0n ? -x : x;
    for (let d = 1n; d * d <= ax && d < 10000n; d++) {
      if (ax % d === 0n) out.push(d, ax / d);
    }
    return out;
  };
  for (const p0 of divisors(a0)) {
    for (const q0 of divisors(an)) {
      for (const s of [1n, -1n]) {
        const r = Q.of(s * p0, q0);
        let acc = Q.of(0);
        for (let i = deg; i >= 0; i--) acc = acc.mul(r).add(Q.of(ints[i] ?? 0n));
        if (acc.isZero) return true;
      }
    }
  }
  return false;
}

/** Why a single factor could be factorised further, or null if it cannot (as far as Stage 3 goes). */
function factorIssue(p: Poly): string | null {
  if (isConstantPoly(p) || p.size === 1) return null;
  if (content(p) !== 1n) return 'A common number factor can still be taken out.';
  if (commonVariables(p).length > 0) return 'A common letter factor can still be taken out.';
  const vars = variablesOfPoly(p);
  const deg = totalDegree(p);
  if (vars.length === 1) {
    const v = vars[0] as string;
    if (deg >= 2 && hasRationalRoot(p, v)) return 'One of the brackets can be factorised further.';
    return null;
  }
  if (vars.length === 2 && deg === 2) {
    const [x, y] = vars as [string, string];
    const xx = coef(p, monomialKey({ [x]: 2 }));
    const xy = coef(p, monomialKey({ [x]: 1, [y]: 1 }));
    const yy = coef(p, monomialKey({ [y]: 2 }));
    // a·x² + b·xy + c·y² factorises over the rationals exactly when b² − 4ac is a perfect square.
    if (
      onlyKeys(p, [`${x}^2`, `${x}*${y}`, `${y}^2`]) &&
      isPerfectSquare(xy.mul(xy).sub(Q.of(4).mul(xx).mul(yy)))
    ) {
      return 'One of the brackets can be factorised further.';
    }
    // a·xy + b·x + c·y + d (a ≠ 0) factorises exactly when a·d = b·c.
    if (onlyKeys(p, ['', x, y, `${x}*${y}`]) && !xy.isZero) {
      if (xy.mul(coef(p, '')).eq(coef(p, x).mul(coef(p, y)))) {
        return 'One of the brackets can be factorised further.';
      }
    }
  }
  return null;
}

/** The factors of a product as written: (2x)(x + 1)² → [2x, x + 1, x + 1]. */
function writtenFactors(node: Node): Node[] {
  const n = stripNeg(node);
  if (n.k === 'mul') return n.args.flatMap(writtenFactors);
  if (n.k === 'pow') {
    const e = exact(n.exp);
    if (e?.isInteger && e.n > 1n && n.base.k === 'add')
      return Array.from({ length: Number(e.n) }, () => n.base);
  }
  return [n];
}

function factorisedIssue(node: Node): string | null {
  const factors = writtenFactors(node);
  const nonConstant = factors.filter((f) => {
    const p = toPoly(f);
    return !(p && isConstantPoly(p));
  });
  if (nonConstant.length === 0) return null;
  if (factors.length === 1 && stripNeg(node).k === 'add') {
    return 'Write the expression as a product of brackets or factors.';
  }
  for (const f of factors) {
    const p = toPoly(f);
    if (!p) return 'Each factor should be a polynomial.';
    const issue = factorIssue(p);
    if (issue) return issue;
  }
  return null;
}

/* ---------- Dispatcher ---------- */

export function formIssue(req: FormRequirement, node: Node): string | null {
  switch (req) {
    case 'integer':
      return isIntLiteral(stripNeg(node)) ? null : 'Give a whole number.';
    case 'simplified-fraction':
      return fractionForm(node, true, false);
    case 'improper-fraction':
      return fractionForm(node, false, false);
    case 'mixed-number':
      return fractionForm(node, true, true);
    case 'decimal': {
      const n = stripNeg(node);
      return n.k === 'num' && !n.text.includes('(') ? null : 'Give the answer as a decimal.';
    }
    case 'collected':
    case 'expanded':
      return collectedIssue(node);
    case 'factorised':
      return factorisedIssue(node);
    case 'simplest-surd':
      return surdIssue(node);
    case 'rationalised-denominator':
      return denominatorRadical(node) ? 'Rationalise the denominator: no roots underneath.' : null;
    case 'positive-exponents':
      return some(node, (n) => n.k === 'pow' && (exact(n.exp)?.n ?? 0n) < 0n)
        ? 'Write every exponent as a positive number.'
        : null;
    case 'single-power': {
      const n = stripNeg(node);
      const ok = n.k === 'sym' || (n.k === 'pow' && (n.base.k === 'sym' || n.base.k === 'num'));
      return ok ? null : 'Write the answer as a single power.';
    }
    case 'power-term':
      return powerTermIssue(node);
    case 'exponent-form':
      return some(node, (n) => n.k === 'sqrt' || n.k === 'root')
        ? 'Write the answer using exponents, without root signs.'
        : null;
    case 'radical-form':
      return some(node, (n) => n.k === 'pow' && !(exact(n.exp)?.isInteger ?? true))
        ? 'Write the answer with a root sign instead of a fractional exponent.'
        : null;
    case 'standard-form':
      return standardFormIssue(node);
  }
}

/** k·xⁿ: an optional number times one letter, or one power of one letter. */
function powerTermIssue(node: Node): string | null {
  const isLetterPower = (n: Node) =>
    n.k === 'sym' || (n.k === 'pow' && n.base.k === 'sym' && exact(n.exp) !== null);
  const n = stripNeg(node);
  if (isLetterPower(n)) return null;
  if (n.k === 'mul' && n.args.length === 2) {
    const [k, x] = n.args as [Node, Node];
    if (exact(k) !== null && !some(k, (c) => c.k === 'sym') && isLetterPower(x)) return null;
  }
  return 'Write the answer as a number times a single power, like 3x to a power.';
}

function standardFormIssue(node: Node): string | null {
  const n = stripNeg(node);
  const message = 'Write the number as a × 10ⁿ with 1 ≤ a < 10.';
  if (n.k === 'num') {
    const m = /^(\d+(?:\.\d+)?)e[+-]?\d+$/i.exec(n.text);
    if (!m) return message;
    const a = Number(m[1]);
    return a >= 1 && a < 10 ? null : message;
  }
  if (n.k === 'pow') {
    const base = exact(n.base);
    return base?.eq(Q.of(10)) && exact(n.exp)?.isInteger ? null : message;
  }
  if (n.k === 'mul' && n.args.length === 2) {
    const [a, b] = n.args as [Node, Node];
    const mant = exact(a);
    const okMantissa =
      a.k === 'num' && mant !== null && mant.toNumber() >= 1 && mant.toNumber() < 10;
    const okPower = b.k === 'pow' && exact(b.base)?.eq(Q.of(10)) && exact(b.exp)?.isInteger;
    return okMantissa && okPower ? null : message;
  }
  return message;
}
