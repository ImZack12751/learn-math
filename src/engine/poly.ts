/**
 * Multivariate polynomials with exact rational coefficients, used by the form checks
 * ("factorised", "expanded"). A tree that is not a polynomial converts to null.
 */
import type { Node } from './ast';
import { exact } from './evaluate';
import { gcd, Q } from './rational';

/** Monomial key: variables with exponents, sorted, e.g. "x^2*y". The constant term is "". */
export type Poly = Map<string, Q>;

function parseKey(key: string): Map<string, number> {
  const out = new Map<string, number>();
  if (key === '') return out;
  for (const part of key.split('*')) {
    const [v, e] = part.split('^');
    out.set(v ?? '', Number(e ?? '1'));
  }
  return out;
}

function makeKey(powers: Map<string, number>): string {
  return [...powers.entries()]
    .filter(([, e]) => e !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([v, e]) => (e === 1 ? v : `${v}^${e}`))
    .join('*');
}

function mulKeys(a: string, b: string): string {
  const p = parseKey(a);
  for (const [v, e] of parseKey(b)) p.set(v, (p.get(v) ?? 0) + e);
  return makeKey(p);
}

function clean(p: Poly): Poly {
  for (const [k, c] of p) if (c.isZero) p.delete(k);
  return p;
}

export function addPoly(a: Poly, b: Poly): Poly {
  const out = new Map(a);
  for (const [k, c] of b) out.set(k, (out.get(k) ?? Q.of(0)).add(c));
  return clean(out);
}

export function mulPoly(a: Poly, b: Poly): Poly {
  const out: Poly = new Map();
  for (const [ka, ca] of a) {
    for (const [kb, cb] of b) {
      const k = mulKeys(ka, kb);
      out.set(k, (out.get(k) ?? Q.of(0)).add(ca.mul(cb)));
    }
  }
  return clean(out);
}

const constant = (q: Q): Poly => clean(new Map([['', q]]));

/** The polynomial a tree represents, or null if it is not a polynomial with rational coefficients. */
export function toPoly(node: Node): Poly | null {
  switch (node.k) {
    case 'num':
      return constant(node.q);
    case 'sym':
      return new Map([[node.name, Q.of(1)]]);
    case 'add': {
      let acc: Poly = new Map();
      for (const a of node.args) {
        const p = toPoly(a);
        if (!p) return null;
        acc = addPoly(acc, p);
      }
      return acc;
    }
    case 'mul': {
      let acc = constant(Q.of(1));
      for (const a of node.args) {
        const p = toPoly(a);
        if (!p) return null;
        acc = mulPoly(acc, p);
      }
      return acc;
    }
    case 'neg': {
      const p = toPoly(node.arg);
      return p ? mulPoly(p, constant(Q.of(-1))) : null;
    }
    case 'div': {
      const p = toPoly(node.num);
      const d = exact(node.den);
      if (!p || !d || d.isZero) return null;
      return mulPoly(p, constant(Q.of(1).div(d)));
    }
    case 'pow': {
      const e = exact(node.exp);
      if (!e || !e.isInteger || e.n < 0n || e.n > 12n) {
        const value = exact(node);
        return value ? constant(value) : null;
      }
      const base = toPoly(node.base);
      if (!base) return null;
      let acc = constant(Q.of(1));
      for (let i = 0n; i < e.n; i++) acc = mulPoly(acc, base);
      return acc;
    }
    case 'mixed':
    case 'sqrt':
    case 'root':
    case 'abs': {
      const value = exact(node);
      return value ? constant(value) : null;
    }
    default:
      return null;
  }
}

export function isConstantPoly(p: Poly): boolean {
  return [...p.keys()].every((k) => k === '');
}

export function variablesOfPoly(p: Poly): string[] {
  const vs = new Set<string>();
  for (const k of p.keys()) for (const v of parseKey(k).keys()) vs.add(v);
  return [...vs].sort();
}

export function totalDegree(p: Poly): number {
  let d = 0;
  for (const k of p.keys())
    d = Math.max(
      d,
      [...parseKey(k).values()].reduce((s, e) => s + e, 0),
    );
  return d;
}

/** Degree in one variable. */
export function degreeIn(p: Poly, v: string): number {
  let d = 0;
  for (const k of p.keys()) d = Math.max(d, parseKey(k).get(v) ?? 0);
  return d;
}

/** Greatest common factor of the integer coefficients after clearing denominators. */
export function content(p: Poly): bigint {
  let g = 0n;
  for (const c of p.values()) g = gcd(g, c.n);
  return g;
}

/** Variables that divide every term (a common variable factor). */
export function commonVariables(p: Poly): string[] {
  if (p.size < 2) return [];
  const keys = [...p.keys()].map(parseKey);
  return variablesOfPoly(p).filter((v) => keys.every((k) => (k.get(v) ?? 0) > 0));
}

/** Coefficient of a monomial key. */
export const coef = (p: Poly, key: string) => p.get(key) ?? Q.of(0);

export const monomialKey = (powers: Record<string, number>) =>
  makeKey(new Map(Object.entries(powers)));
