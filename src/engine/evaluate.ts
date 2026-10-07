/**
 * Evaluation of engine trees: exact rational values where possible, and compiled real-valued
 * functions for numeric sampling. Compiled closures evaluate in well under a microsecond, which
 * keeps the 1,000-seed generator suite fast.
 */
import type { Node } from './ast';
import { exactRoot, Q } from './rational';

/** Exact value of a constant expression when it is rational, otherwise null. */
export function exact(node: Node): Q | null {
  try {
    return exactOrThrow(node);
  } catch {
    return null;
  }
}

class NotRational extends Error {}

function exactOrThrow(node: Node): Q {
  switch (node.k) {
    case 'num':
      return node.q;
    case 'add':
      return node.args.reduce((acc, a) => acc.add(exactOrThrow(a)), Q.of(0));
    case 'mul':
      return node.args.reduce((acc, a) => acc.mul(exactOrThrow(a)), Q.of(1));
    case 'div':
      return exactOrThrow(node.num).div(exactOrThrow(node.den));
    case 'neg':
      return exactOrThrow(node.arg).neg();
    case 'mixed':
      return exactOrThrow(node.whole).add(exactOrThrow(node.frac));
    case 'abs': {
      const v = exactOrThrow(node.arg);
      return v.n < 0n ? v.neg() : v;
    }
    case 'pow': {
      const base = exactOrThrow(node.base);
      const exp = exactOrThrow(node.exp);
      if (exp.isInteger) {
        if (base.isZero && exp.n <= 0n) throw new NotRational();
        if (exp.n > 64n || exp.n < -64n) throw new NotRational();
        return base.pow(Number(exp.n));
      }
      if (exp.d > 12n || exp.n > 64n || exp.n < -64n) throw new NotRational();
      const root = exactRoot(base, Number(exp.d));
      if (!root || (root.isZero && exp.n < 0n)) throw new NotRational();
      return root.pow(Number(exp.n));
    }
    case 'sqrt': {
      const root = exactRoot(exactOrThrow(node.arg), 2);
      if (!root) throw new NotRational();
      return root;
    }
    case 'root': {
      const index = exactOrThrow(node.index);
      if (!index.isInteger || index.n < 2n || index.n > 12n) throw new NotRational();
      const root = exactRoot(exactOrThrow(node.arg), Number(index.n));
      if (!root) throw new NotRational();
      return root;
    }
    default:
      throw new NotRational();
  }
}

export type Env = Readonly<Record<string, number>>;
export type Compiled = (env: Env) => number;

/** Real k-th root, including odd roots of negative numbers. */
function realRoot(x: number, k: number): number {
  if (x < 0 && k % 2 === 1) return -Math.pow(-x, 1 / k);
  return Math.pow(x, 1 / k);
}

/**
 * Compiles a tree to a real-valued function of its variables. Undefined points (division by
 * zero, even roots of negatives, logs of non-positives) return NaN. The symbol `e` means Euler's
 * number unless it is one of the given variables.
 */
export function compile(node: Node, variables: ReadonlySet<string> = new Set()): Compiled {
  switch (node.k) {
    case 'num': {
      const v = node.q.toNumber();
      return () => v;
    }
    case 'sym': {
      const name = node.name;
      if (name === 'e' && !variables.has('e')) return () => Math.E;
      return (env) => env[name] ?? NaN;
    }
    case 'const': {
      const v = node.name === 'pi' ? Math.PI : Math.E;
      return () => v;
    }
    case 'add': {
      const fs = node.args.map((a) => compile(a, variables));
      return (env) => fs.reduce((s, f) => s + f(env), 0);
    }
    case 'mul': {
      const fs = node.args.map((a) => compile(a, variables));
      return (env) => fs.reduce((p, f) => p * f(env), 1);
    }
    case 'div': {
      const n = compile(node.num, variables);
      const d = compile(node.den, variables);
      return (env) => {
        const den = d(env);
        return den === 0 ? NaN : n(env) / den;
      };
    }
    case 'neg': {
      const f = compile(node.arg, variables);
      return (env) => -f(env);
    }
    case 'mixed': {
      const w = compile(node.whole, variables);
      const fr = compile(node.frac, variables);
      return (env) => w(env) + fr(env);
    }
    case 'abs': {
      const f = compile(node.arg, variables);
      return (env) => Math.abs(f(env));
    }
    case 'sqrt': {
      const f = compile(node.arg, variables);
      return (env) => {
        const x = f(env);
        return x < 0 ? NaN : Math.sqrt(x);
      };
    }
    case 'root': {
      const f = compile(node.arg, variables);
      const k = exact(node.index);
      if (k && k.isInteger) {
        const index = Number(k.n);
        return (env) => realRoot(f(env), index);
      }
      const g = compile(node.index, variables);
      return (env) => Math.pow(f(env), 1 / g(env));
    }
    case 'pow': {
      const base = compile(node.base, variables);
      const constExp = exact(node.exp);
      // A constant rational exponent p/q with q odd is defined for negative bases.
      if (constExp && !constExp.isInteger && constExp.d % 2n === 1n) {
        const p = Number(constExp.n);
        const q = Number(constExp.d);
        return (env) => {
          const r = realRoot(base(env), q);
          return r === 0 && p < 0 ? NaN : Math.pow(r, p);
        };
      }
      const exp = compile(node.exp, variables);
      return (env) => {
        const b = base(env);
        const x = exp(env);
        if (b === 0 && x <= 0) return NaN;
        return Math.pow(b, x);
      };
    }
    case 'fn': {
      const f = compile(node.arg, variables);
      switch (node.name) {
        case 'ln':
          return (env) => {
            const x = f(env);
            return x > 0 ? Math.log(x) : NaN;
          };
        case 'log': {
          const b = node.base ? compile(node.base, variables) : () => 10;
          return (env) => {
            const x = f(env);
            const base = b(env);
            return x > 0 && base > 0 && base !== 1 ? Math.log(x) / Math.log(base) : NaN;
          };
        }
        case 'exp':
          return (env) => Math.exp(f(env));
        case 'sin':
          return (env) => Math.sin(f(env));
        case 'cos':
          return (env) => Math.cos(f(env));
        case 'tan':
          return (env) => Math.tan(f(env));
      }
      break;
    }
    case 'pm':
    case 'rel':
    case 'list':
    case 'or':
    case 'text':
    case 'empty':
      break;
  }
  throw new Error(`Cannot evaluate a ${node.k}`);
}

/** Numeric value of a constant expression (NaN when undefined). */
export function value(node: Node): number {
  return compile(node)({});
}
