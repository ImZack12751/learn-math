/**
 * The engine's expression tree. Built from the raw (non-evaluated) MathJSON that Compute Engine's
 * LaTeX parser produces, so the learner's exact form is preserved: `\frac{6}{8}` stays a quotient
 * of 6 and 8, `\sqrt{12}` stays a root of 12.
 */
import { Q } from './rational';

export type RelOp = '=' | '!=' | '<' | '<=' | '>' | '>=';
export type FnName = 'ln' | 'log' | 'exp' | 'sin' | 'cos' | 'tan';

export type Node =
  /** A non-negative number as written. `text` keeps decimals and standard form ("3.2e4"). */
  | { k: 'num'; q: Q; text: string }
  | { k: 'sym'; name: string }
  | { k: 'const'; name: 'pi' | 'e' }
  | { k: 'add'; args: Node[] }
  | { k: 'mul'; args: Node[] }
  | { k: 'div'; num: Node; den: Node }
  | { k: 'neg'; arg: Node }
  | { k: 'pow'; base: Node; exp: Node }
  | { k: 'sqrt'; arg: Node }
  | { k: 'root'; arg: Node; index: Node }
  /** A mixed number such as 2⅓: whole part plus a proper fraction of integers. */
  | { k: 'mixed'; whole: Node; frac: Node }
  | { k: 'abs'; arg: Node }
  | { k: 'fn'; name: FnName; arg: Node; base?: Node }
  | { k: 'pm'; left: Node; right: Node }
  | { k: 'rel'; op: RelOp; left: Node; right: Node }
  | { k: 'list'; items: Node[]; tuple: boolean }
  | { k: 'or'; items: Node[] }
  | { k: 'text'; value: string }
  | { k: 'empty' };

export class ParseError extends Error {}

type Json = unknown;

const RELATIONS: Record<string, RelOp> = {
  Equal: '=',
  NotEqual: '!=',
  Less: '<',
  LessEqual: '<=',
  Greater: '>',
  GreaterEqual: '>=',
};

const FUNCTIONS: Record<string, FnName> = {
  Ln: 'ln',
  Exp: 'exp',
  Sin: 'sin',
  Cos: 'cos',
  Tan: 'tan',
};

export const num = (q: Q): Node => ({ k: 'num', q, text: q.toString() });
export const int = (n: number | bigint): Node => num(Q.of(n));

function numberNode(text: string): Node {
  const clean = text.replace(/\s/g, '');
  if (clean.includes('(')) return { k: 'num', q: Q.fromRepeating(clean), text: clean };
  return { k: 'num', q: Q.fromDecimal(clean), text: clean };
}

function symbolNode(name: string): Node {
  switch (name) {
    case 'Pi':
      return { k: 'const', name: 'pi' };
    case 'ExponentialE':
      return { k: 'const', name: 'e' };
    case 'EmptySet':
      return { k: 'empty' };
    case 'PositiveInfinity':
    case 'NegativeInfinity':
    case 'ComplexInfinity':
    case 'Nothing':
      throw new ParseError(`Unsupported symbol ${name}`);
  }
  if (/^'.*'$/.test(name)) return { k: 'text', value: name.slice(1, -1) };
  return { k: 'sym', name };
}

function isIntegerLiteral(n: Node): boolean {
  return n.k === 'num' && n.q.isInteger && !/[.e]/i.test(n.text);
}

/** `2\frac{1}{3}` written next to each other is a mixed number, not a product. */
function isMixedNumber(parts: Node[]): boolean {
  const [whole, frac] = parts;
  return (
    parts.length === 2 &&
    whole !== undefined &&
    frac !== undefined &&
    isIntegerLiteral(whole) &&
    frac.k === 'div' &&
    isIntegerLiteral(frac.num) &&
    isIntegerLiteral(frac.den)
  );
}

/** A sum with nested sums spliced in: a − b + c parses as ((a − b) + c) but is one sum of three terms. */
function sum(terms: Node[]): Node {
  return { k: 'add', args: terms.flatMap((t) => (t.k === 'add' ? t.args : [t])) };
}

/** Converts raw MathJSON (as produced with no evaluation) into an engine tree. */
export function fromMathJson(json: Json): Node {
  if (typeof json === 'number') {
    if (!Number.isFinite(json)) throw new ParseError('Non-finite number');
    return numberNode(String(json));
  }
  if (typeof json === 'string') return symbolNode(json);
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const o = json as Record<string, unknown>;
    if (typeof o.num === 'string') return numberNode(o.num);
    if (typeof o.sym === 'string') return symbolNode(o.sym);
    if (typeof o.str === 'string') return { k: 'text', value: o.str };
    if (Array.isArray(o.fn)) return fromMathJson(o.fn);
    throw new ParseError('Unrecognised expression');
  }
  if (!Array.isArray(json) || typeof json[0] !== 'string') {
    throw new ParseError('Unrecognised expression');
  }
  const [head, ...rest] = json as [string, ...Json[]];
  const args = () => rest.map(fromMathJson);
  const one = (): Node => {
    if (rest.length !== 1) throw new ParseError(`${head} expects one argument`);
    return fromMathJson(rest[0]);
  };
  const two = (): [Node, Node] => {
    if (rest.length !== 2) throw new ParseError(`${head} expects two arguments`);
    return [fromMathJson(rest[0]), fromMathJson(rest[1])];
  };

  switch (head) {
    case 'Error':
      throw new ParseError('The expression is incomplete or malformed');
    case 'Delimiter': {
      const body = rest[0];
      const sep = rest[1] as { str?: string } | undefined;
      const inner =
        body === undefined ? ({ k: 'list', items: [], tuple: true } as Node) : fromMathJson(body);
      if (inner.k === 'list') return { ...inner, tuple: sep?.str === '(,)' };
      return inner;
    }
    case 'Sequence':
      return { k: 'list', items: args(), tuple: false };
    case 'Add':
      return sum(args());
    case 'Subtract': {
      const [a, b] = two();
      return sum([a, { k: 'neg', arg: b }]);
    }
    case 'Negate':
      return { k: 'neg', arg: one() };
    case 'Multiply':
      return { k: 'mul', args: args() };
    case 'InvisibleOperator': {
      const parts = args();
      if (isMixedNumber(parts))
        return { k: 'mixed', whole: parts[0] as Node, frac: parts[1] as Node };
      // -2⅓ is parsed as (−2) next to ⅓: it means −(2⅓).
      const [first, frac] = parts;
      if (first?.k === 'neg' && frac && isMixedNumber([first.arg, frac])) {
        return { k: 'neg', arg: { k: 'mixed', whole: first.arg, frac } };
      }
      return { k: 'mul', args: parts };
    }
    case 'Divide': {
      const [a, b] = two();
      return { k: 'div', num: a, den: b };
    }
    case 'Rational': {
      const [a, b] = two();
      return { k: 'div', num: a, den: b };
    }
    case 'Power': {
      const [base, exp] = two();
      return { k: 'pow', base, exp };
    }
    case 'Square':
      return { k: 'pow', base: one(), exp: int(2) };
    case 'Sqrt':
      return { k: 'sqrt', arg: one() };
    case 'Root': {
      const [arg, index] = two();
      return { k: 'root', arg, index };
    }
    case 'Abs':
      return { k: 'abs', arg: one() };
    case 'Log': {
      const parts = args();
      if (parts.length === 1) return { k: 'fn', name: 'log', arg: parts[0] as Node };
      if (parts.length === 2)
        return { k: 'fn', name: 'log', arg: parts[0] as Node, base: parts[1] as Node };
      throw new ParseError('Log expects one or two arguments');
    }
    case 'Lb':
      return { k: 'fn', name: 'log', arg: one(), base: int(2) };
    case 'Measurement': {
      const [left, right] = two();
      return { k: 'pm', left, right };
    }
    case 'Or':
      return { k: 'or', items: args() };
  }
  const fn = FUNCTIONS[head];
  if (fn) return { k: 'fn', name: fn, arg: one() };
  const rel = RELATIONS[head];
  if (rel) {
    // a ≤ x ≤ b arrives as one relation with three arguments: fold it into a chain.
    const parts = args();
    if (parts.length < 2) throw new ParseError(`${head} expects two sides`);
    let node: Node = { k: 'rel', op: rel, left: parts[0] as Node, right: parts[1] as Node };
    for (const next of parts.slice(2)) node = { k: 'rel', op: rel, left: node, right: next };
    return node;
  }
  throw new ParseError(`Unsupported operation ${head}`);
}

/** Every variable name used in a tree. */
export function variablesOf(node: Node, out = new Set<string>()): Set<string> {
  forEachChild(node, (child) => variablesOf(child, out));
  if (node.k === 'sym') out.add(node.name);
  return out;
}

export function children(node: Node): Node[] {
  switch (node.k) {
    case 'num':
    case 'sym':
    case 'const':
    case 'text':
    case 'empty':
      return [];
    case 'add':
    case 'mul':
      return node.args;
    case 'div':
      return [node.num, node.den];
    case 'neg':
    case 'sqrt':
    case 'abs':
      return [node.arg];
    case 'pow':
      return [node.base, node.exp];
    case 'root':
      return [node.arg, node.index];
    case 'mixed':
      return [node.whole, node.frac];
    case 'fn':
      return node.base ? [node.arg, node.base] : [node.arg];
    case 'pm':
    case 'rel':
      return [node.left, node.right];
    case 'list':
    case 'or':
      return node.items;
  }
}

export function forEachChild(node: Node, visit: (child: Node) => void) {
  for (const child of children(node)) visit(child);
}

/** True if any node in the tree satisfies the predicate. */
export function some(node: Node, predicate: (n: Node) => boolean): boolean {
  return predicate(node) || children(node).some((c) => some(c, predicate));
}
