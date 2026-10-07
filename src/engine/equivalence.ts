/**
 * Value equivalence. Constants compare exactly when both are rational, otherwise to 11
 * significant digits. Expressions compare by seeded random sampling over the stated domain:
 * a point where one side is defined and the other is not counts as a difference, so domain
 * restrictions are respected (with x > 0 stated, √(x²) equals x; without it, it does not).
 */
import { variablesOf, type Node } from './ast';
import { compile, exact, value } from './evaluate';
import { Rng } from './rng';
import type { DomainSpec } from './types';

const DEFAULT_RANGE: readonly [number, number] = [-4.7, 4.3];
const NEEDED = 20;
const MAX_SAMPLES = 160;

export function close(a: number, b: number, relative = 1e-9): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= relative * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Equal values for two constant expressions. */
export function sameNumber(a: Node, b: Node): boolean {
  const ea = exact(a);
  const eb = exact(b);
  if (ea && eb) return ea.eq(eb);
  return close(value(a), value(b), 1e-11);
}

/** Equal values for two expressions at every sampled point of the domain. */
export function sameExpression(a: Node, b: Node, domain?: DomainSpec, seed = 0x1ee7): boolean {
  const vars = new Set([...variablesOf(a), ...variablesOf(b)]);
  if (domain) for (const v of Object.keys(domain.ranges)) vars.add(v);
  vars.delete('e');
  if (vars.size === 0) return sameNumber(a, b);
  const fa = compile(a, vars);
  const fb = compile(b, vars);
  const rng = new Rng(seed);
  const names = [...vars];
  let compared = 0;
  for (let i = 0; i < MAX_SAMPLES && compared < NEEDED * 2; i++) {
    const env: Record<string, number> = {};
    for (const name of names) {
      const [lo, hi] = domain?.ranges[name] ?? DEFAULT_RANGE;
      env[name] = domain?.integer?.includes(name)
        ? rng.int(Math.ceil(lo), Math.floor(hi))
        : lo + (hi - lo) * rng.float();
    }
    const va = fa(env);
    const vb = fb(env);
    const da = Number.isFinite(va);
    const db = Number.isFinite(vb);
    if (!da && !db) continue;
    if (da !== db) return false;
    if (!close(va, vb)) return false;
    compared++;
  }
  return compared >= NEEDED;
}
