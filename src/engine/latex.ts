/**
 * LaTeX output: serialising engine trees (for previews) and small builders generators use to
 * write correct, conventional notation (signs, coefficients, fractions).
 */
import type { Node, RelOp } from './ast';
import { Q } from './rational';

const REL: Record<RelOp, string> = {
  '=': '=',
  '!=': '\\ne',
  '<': '<',
  '<=': '\\le',
  '>': '>',
  '>=': '\\ge',
};

function numberLatex(text: string): string {
  const repeating = /^(\d*)\.(\d*)\((\d+)\)$/.exec(text);
  if (repeating) {
    return `${repeating[1] || '0'}.${repeating[2] ?? ''}\\overline{${repeating[3] ?? ''}}`;
  }
  const sci = /^([\d.]+)e([+-]?\d+)$/i.exec(text);
  if (sci) return `${sci[1] ?? ''} \\times 10^{${Number(sci[2])}}`;
  return text;
}

const isAtom = (n: Node) =>
  n.k === 'num' ||
  n.k === 'sym' ||
  n.k === 'const' ||
  n.k === 'abs' ||
  n.k === 'sqrt' ||
  n.k === 'root' ||
  n.k === 'div';

function paren(s: string) {
  return `\\left(${s}\\right)`;
}

/** Does this factor start with a digit when printed (so juxtaposition would merge numbers)? */
const startsWithDigit = (n: Node): boolean =>
  n.k === 'num' || (n.k === 'pow' && startsWithDigit(n.base)) || n.k === 'mixed';

export function toLatex(node: Node): string {
  switch (node.k) {
    case 'num':
      return numberLatex(node.text);
    case 'sym': {
      const m = /^([A-Za-z]+)_(\w+)$/.exec(node.name);
      return m ? `${m[1] ?? ''}_{${m[2] ?? ''}}` : node.name;
    }
    case 'const':
      return node.name === 'pi' ? '\\pi' : '\\mathrm{e}';
    case 'add':
      return node.args
        .map((arg, i) => {
          if (i === 0) return toLatex(arg);
          if (arg.k === 'neg') {
            const inner = toLatex(arg.arg);
            return ` - ${arg.arg.k === 'add' ? paren(inner) : inner}`;
          }
          return ` + ${toLatex(arg)}`;
        })
        .join('');
    case 'mul':
      return node.args.reduce((out, arg, i) => {
        const s = toLatex(arg);
        const wrapped =
          arg.k === 'add' || (arg.k === 'neg' && i > 0) || arg.k === 'pm' ? paren(s) : s;
        if (i === 0) return wrapped;
        const prev = node.args[i - 1];
        if (startsWithDigit(arg) || (prev?.k === 'div' && arg.k === 'div'))
          return `${out} \\times ${wrapped}`;
        // A command such as \pi must not run into a following letter (\pir).
        return /\\[A-Za-z]+$/.test(out) && /^[A-Za-z]/.test(wrapped)
          ? `${out} ${wrapped}`
          : out + wrapped;
      }, '');
    case 'div':
      return `\\frac{${toLatex(node.num)}}{${toLatex(node.den)}}`;
    case 'neg': {
      const inner = toLatex(node.arg);
      return node.arg.k === 'add' || node.arg.k === 'neg' ? `-${paren(inner)}` : `-${inner}`;
    }
    case 'pow': {
      const base = toLatex(node.base);
      const simpleBase =
        ['num', 'sym', 'const', 'abs'].includes(node.base.k) && !/^-|\\times/.test(base);
      const b = simpleBase ? base : paren(base);
      return `${b}^{${toLatex(node.exp)}}`;
    }
    case 'sqrt':
      return `\\sqrt{${toLatex(node.arg)}}`;
    case 'root':
      return `\\sqrt[${toLatex(node.index)}]{${toLatex(node.arg)}}`;
    case 'mixed':
      return `${toLatex(node.whole)}${toLatex(node.frac)}`;
    case 'abs':
      return `\\left|${toLatex(node.arg)}\\right|`;
    case 'fn': {
      const arg = toLatex(node.arg);
      const wrapped = isAtom(node.arg) ? arg : paren(arg);
      if (node.name === 'log') {
        return node.base ? `\\log_{${toLatex(node.base)}} ${wrapped}` : `\\log ${wrapped}`;
      }
      if (node.name === 'exp') return `\\mathrm{e}^{${arg}}`;
      return `\\${node.name} ${wrapped}`;
    }
    case 'pm': {
      const right = toLatex(node.right);
      const isZero = node.left.k === 'num' && node.left.q.isZero;
      return isZero ? `\\pm ${right}` : `${toLatex(node.left)} \\pm ${right}`;
    }
    case 'rel':
      return `${toLatex(node.left)} ${REL[node.op]} ${toLatex(node.right)}`;
    case 'list': {
      const body = node.items.map(toLatex).join(', ');
      return node.tuple ? paren(body) : body;
    }
    case 'or':
      return node.items.map(toLatex).join(' \\text{ or } ');
    case 'text':
      return `\\text{${node.value}}`;
    case 'empty':
      return '\\varnothing';
  }
}

/* ---------- Builders for generators ---------- */

type Rat = Q | number | bigint;
const toQ = (v: Rat) => (v instanceof Q ? v : Q.of(v));

/** A rational as LaTeX: `3`, `-\frac{2}{5}`. */
export const ratTex = (v: Rat) => toQ(v).toLatex();

/** A coefficient times a variable part, with the conventional 1 and −1 omitted: `3x`, `-x`. */
export function termTex(coefficient: Rat, variablePart = ''): string {
  const c = toQ(coefficient);
  if (variablePart === '') return c.toLatex();
  if (c.isZero) return '0';
  if (c.eq(Q.of(1))) return variablePart;
  if (c.eq(Q.of(-1))) return `-${variablePart}`;
  return `${c.toLatex()}${variablePart}`;
}

/**
 * Joins terms into a sum with correct signs: ['3x', '-2', '5'] → `3x - 2 + 5`. Zero terms are
 * dropped; an empty sum is `0`.
 */
export function sumTex(terms: readonly string[]): string {
  const kept = terms.map((t) => t.trim()).filter((t) => t !== '' && t !== '0');
  if (kept.length === 0) return '0';
  return kept
    .map((t, i) => {
      if (i === 0) return t;
      return t.startsWith('-') ? ` - ${t.slice(1)}` : ` + ${t}`;
    })
    .join('');
}

/** A number in brackets when negative, for substitution steps: `3`, `\left(-2\right)`. */
export function bracketIfNegative(v: Rat): string {
  const q = toQ(v);
  return q.n < 0n ? paren(q.toLatex()) : q.toLatex();
}

export const fracTex = (numerator: string, denominator: string) =>
  `\\frac{${numerator}}{${denominator}}`;

export const powTex = (base: string, exponent: string) => `${base}^{${exponent}}`;
