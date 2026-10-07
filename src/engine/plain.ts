/**
 * Plain-text answers (the fallback input) to LaTeX. Accepts what people type on a keyboard:
 * `x^(1/2)`, `sqrt(12)`, `2/4`, `3x+2`, `-2<x<=3`, `x=2 or x=-3`, `(2,3)`, `log_2(8)`, `|x-1|`,
 * `2 1/3` for a mixed number. Implicit multiplication binds like explicit multiplication, left to
 * right, so `1/2x` means one half of x; the live preview shows the reading.
 */
import { ParseError, type Node, type RelOp, num } from './ast';
import { toLatex } from './latex';
import { Q } from './rational';

type Token = { t: 'num'; v: string } | { t: 'id'; v: string } | { t: 'op'; v: string };

const FUNCS = new Set(['sqrt', 'cbrt', 'root', 'abs', 'ln', 'log', 'sin', 'cos', 'tan', 'exp']);
const WORDS = new Set([...FUNCS, 'pi', 'or']);

const SYMBOL_OPS: [string, string][] = [
  ['<=', '<='],
  ['>=', '>='],
  ['!=', '!='],
  ['+/-', '±'],
  ['+-', '±'],
  ['≤', '<='],
  ['≥', '>='],
  ['≠', '!='],
  ['×', '*'],
  ['·', '*'],
  ['÷', '/'],
  ['−', '-'],
  ['√', 'sqrt'],
  ['π', 'pi'],
];

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i] ?? '';
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const sym = SYMBOL_OPS.find(([s]) => input.startsWith(s, i));
    if (sym) {
      const [s, v] = sym;
      tokens.push(v === 'sqrt' || v === 'pi' ? { t: 'id', v } : { t: 'op', v });
      i += s.length;
      continue;
    }
    const number = /^(\d+(\.\d+)?|\.\d+)/.exec(input.slice(i));
    if (number) {
      tokens.push({ t: 'num', v: number[0] });
      i += number[0].length;
      continue;
    }
    const word = /^[A-Za-z]+/.exec(input.slice(i));
    if (word) {
      let w = word[0];
      // Known words win; anything else is a run of single-letter variables (xy = x times y).
      while (w.length > 0) {
        const known = [...WORDS]
          .filter((k) => w.toLowerCase().startsWith(k))
          .sort((a, b) => b.length - a.length)[0];
        if (known) {
          tokens.push({ t: 'id', v: known });
          w = w.slice(known.length);
        } else {
          tokens.push({ t: 'id', v: w[0] ?? '' });
          w = w.slice(1);
        }
      }
      i += word[0].length;
      continue;
    }
    if ('+-*/^()[],=<>|±_'.includes(ch)) {
      tokens.push({ t: 'op', v: ch });
      i++;
      continue;
    }
    throw new ParseError(`Unexpected character “${ch}”`);
  }
  return tokens;
}

class Parser {
  private i = 0;
  private absDepth = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.i];
  }
  private isOp(v: string): boolean {
    const t = this.peek();
    return t?.t === 'op' && t.v === v;
  }
  private take(): Token {
    const t = this.tokens[this.i++];
    if (!t) throw new ParseError('The answer ends too early');
    return t;
  }
  private expect(v: string) {
    if (!this.isOp(v)) throw new ParseError(`Expected “${v}”`);
    this.i++;
  }

  parse(): Node {
    const node = this.list();
    if (this.peek()) throw new ParseError('Unexpected text at the end');
    return node;
  }

  private list(): Node {
    const items = [this.or()];
    while (this.isOp(',')) {
      this.i++;
      items.push(this.or());
    }
    return items.length === 1 ? (items[0] as Node) : { k: 'list', items, tuple: false };
  }

  private or(): Node {
    const items = [this.relation()];
    while (this.peek()?.t === 'id' && this.peek()?.v === 'or') {
      this.i++;
      items.push(this.relation());
    }
    return items.length === 1 ? (items[0] as Node) : { k: 'or', items };
  }

  private relation(): Node {
    let left = this.sum();
    const ops: Record<string, RelOp> = {
      '=': '=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      '!=': '!=',
    };
    // Chains such as -2 < x <= 3 become nested relations, as Compute Engine produces them.
    for (let t = this.peek(); t?.t === 'op' && ops[t.v]; t = this.peek()) {
      this.i++;
      left = { k: 'rel', op: ops[t.v] as RelOp, left, right: this.sum() };
    }
    return left;
  }

  private sum(): Node {
    const first = this.isOp('±') ? null : this.term();
    let node: Node = first ?? num(Q.of(0));
    const args: Node[] = [node];
    for (;;) {
      if (this.isOp('+')) {
        this.i++;
        args.push(this.term());
      } else if (this.isOp('-')) {
        this.i++;
        args.push({ k: 'neg', arg: this.term() });
      } else if (this.isOp('±')) {
        this.i++;
        const left: Node = args.length === 1 ? (args[0] as Node) : { k: 'add', args: [...args] };
        node = { k: 'pm', left, right: this.term() };
        args.length = 0;
        args.push(node);
      } else break;
    }
    return args.length === 1 ? (args[0] as Node) : { k: 'add', args };
  }

  private startsPrimary(): boolean {
    const t = this.peek();
    if (!t) return false;
    if (t.t === 'num') return true;
    if (t.t === 'id') return t.v !== 'or';
    return t.v === '(' || t.v === '[' || (t.v === '|' && this.absDepth === 0);
  }

  private term(): Node {
    let node = this.unary();
    for (;;) {
      if (this.isOp('*')) {
        this.i++;
        node = { k: 'mul', args: [node, this.unary()] };
      } else if (this.isOp('/')) {
        this.i++;
        node = { k: 'div', num: node, den: this.unary() };
      } else if (this.startsPrimary()) {
        const mixed = this.mixedFraction(node);
        node = mixed ?? { k: 'mul', args: [node, this.unary()] };
      } else break;
    }
    return node;
  }

  /** "2 1/3": a whole number followed by a fraction of whole numbers is a mixed number. */
  private mixedFraction(whole: Node): Node | null {
    const [a, slash, b] = [this.tokens[this.i], this.tokens[this.i + 1], this.tokens[this.i + 2]];
    const isWhole = (t: Token | undefined) => t?.t === 'num' && !t.v.includes('.');
    if (whole.k !== 'num' || whole.text.includes('.') || !isWhole(a) || !isWhole(b)) return null;
    if (slash?.t !== 'op' || slash.v !== '/') return null;
    this.i += 3;
    const n = (t: Token) => ({ k: 'num', q: Q.fromDecimal(t.v), text: t.v }) as Node;
    return { k: 'mixed', whole, frac: { k: 'div', num: n(a as Token), den: n(b as Token) } };
  }

  private unary(): Node {
    if (this.isOp('-')) {
      this.i++;
      return { k: 'neg', arg: this.unary() };
    }
    if (this.isOp('+')) {
      this.i++;
      return this.unary();
    }
    return this.power();
  }

  private power(): Node {
    const base = this.primary();
    if (this.isOp('^')) {
      this.i++;
      return { k: 'pow', base, exp: this.unary() };
    }
    return base;
  }

  private group(open: string, close: string): Node {
    this.expect(open);
    const inner = this.list();
    this.expect(close);
    return inner.k === 'list' ? { ...inner, tuple: true } : inner;
  }

  private primary(): Node {
    const t = this.take();
    if (t.t === 'num') return { k: 'num', q: Q.fromDecimal(t.v), text: t.v };
    if (t.t === 'op') {
      if (t.v === '(') {
        this.i--;
        return this.group('(', ')');
      }
      if (t.v === '[') {
        this.i--;
        return this.group('[', ']');
      }
      if (t.v === '|') {
        this.absDepth++;
        const inner = this.sum();
        this.absDepth--;
        this.expect('|');
        return { k: 'abs', arg: inner };
      }
      throw new ParseError(`Unexpected “${t.v}”`);
    }
    if (t.v === 'pi') return { k: 'const', name: 'pi' };
    if (!FUNCS.has(t.v)) {
      if (this.isOp('_')) {
        this.i++;
        const sub = this.take();
        return { k: 'sym', name: `${t.v}_${sub.v}` };
      }
      return { k: 'sym', name: t.v };
    }
    return this.func(t.v);
  }

  private argument(): Node {
    if (this.isOp('(')) return this.group('(', ')');
    return this.power();
  }

  private func(name: string): Node {
    if (name === 'log' && this.isOp('_')) {
      this.i++;
      const base = this.primary();
      return { k: 'fn', name: 'log', base, arg: this.argument() };
    }
    const arg = this.argument();
    const parts = arg.k === 'list' ? arg.items : [arg];
    const only = parts[0] as Node;
    switch (name) {
      case 'sqrt':
        return { k: 'sqrt', arg: only };
      case 'cbrt':
        return { k: 'root', arg: only, index: num(Q.of(3)) };
      case 'root': {
        // root(n, x) or root(x, n) are both common; the integer one is the index.
        const [a, b] = parts;
        if (!a || !b) throw new ParseError('root needs an index and a number, e.g. root(3, 8)');
        const aIsIndex =
          a.k === 'num' && a.q.isInteger && !(b.k === 'num' && b.q.isInteger && b.q.cmp(a.q) < 0);
        return aIsIndex ? { k: 'root', index: a, arg: b } : { k: 'root', index: b, arg: a };
      }
      case 'abs':
        return { k: 'abs', arg: only };
      case 'log':
        return parts.length === 2
          ? { k: 'fn', name: 'log', arg: only, base: parts[1] as Node }
          : { k: 'fn', name: 'log', arg: only };
      case 'ln':
      case 'sin':
      case 'cos':
      case 'tan':
      case 'exp':
        return { k: 'fn', name, arg: only };
    }
    throw new ParseError(`Unknown function ${name}`);
  }
}

/** Converts a plain-text answer to LaTeX. Throws ParseError with a readable message. */
export function plainToLatex(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') throw new ParseError('Empty answer');
  if (/^(no (real )?solutions?|none)$/i.test(trimmed)) return '\\varnothing';
  return toLatex(new Parser(tokenize(trimmed)).parse());
}
