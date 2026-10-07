/**
 * The answer checker: parse → interpret by answer kind → compare values → check form → match
 * misconceptions. See ARCHITECTURE section 7.
 */
import { ParseError, some, variablesOf, type Node, type RelOp } from './ast';
import { parseLatex } from './ce-adapter';
import { sameExpression, sameNumber, close } from './equivalence';
import { exact, value } from './evaluate';
import { formIssue } from './forms';
import { Q } from './rational';
import type { AnswerSpec, CheckResult, MisconceptionAnswer } from './types';

/** An answer understood in terms of its kind. */
type Interpreted =
  | { t: 'node'; node: Node }
  | { t: 'values'; nodes: Node[] }
  | { t: 'intervals'; intervals: Interval[]; endpoints: Node[] }
  | { t: 'tuples'; tuples: Node[][] };

interface Interval {
  lo: number;
  loClosed: boolean;
  hi: number;
  hiClosed: boolean;
}

/** The learner's answer has the wrong overall shape (for example a list where one value is asked). */
class ShapeError extends Error {}

const SUPPORTED = new Set([
  'number',
  'expression',
  'solution-set',
  'inequality',
  'ordered-pairs',
  'formula',
]);

const isConstant = (n: Node) =>
  variablesOf(n).size === 0 || [...variablesOf(n)].every((v) => v === 'e');

function single(node: Node, what: string): Node {
  if (node.k === 'rel' || node.k === 'list' || node.k === 'or' || node.k === 'pm') {
    throw new ShapeError(`Give a single ${what}.`);
  }
  if (node.k === 'text' || node.k === 'empty') throw new ShapeError(`Give a ${what}.`);
  return node;
}

/* ---------- Solution sets ---------- */

/** Replaces every ± with + (sign 1) or − (sign −1), the same choice throughout. */
function choosePm(node: Node, sign: 1 | -1): Node {
  if (node.k === 'pm') {
    const right = choosePm(node.right, sign);
    return {
      k: 'add',
      args: [choosePm(node.left, sign), sign === 1 ? right : { k: 'neg', arg: right }],
    };
  }
  switch (node.k) {
    case 'add':
    case 'mul':
      return { ...node, args: node.args.map((a) => choosePm(a, sign)) };
    case 'div':
      return { ...node, num: choosePm(node.num, sign), den: choosePm(node.den, sign) };
    case 'neg':
    case 'sqrt':
    case 'abs':
      return { ...node, arg: choosePm(node.arg, sign) };
    case 'pow':
      return { ...node, base: choosePm(node.base, sign), exp: choosePm(node.exp, sign) };
    default:
      return node;
  }
}

const hasPm = (node: Node) => some(node, (n) => n.k === 'pm');

function expandPm(node: Node): Node[] {
  return hasPm(node) ? [choosePm(node, 1), choosePm(node, -1)] : [node];
}

function collectValues(node: Node, variable: string | undefined): Node[] {
  switch (node.k) {
    case 'empty':
      return [];
    case 'text':
      if (/^\s*no (real )?solutions?\s*$/i.test(node.value)) return [];
      throw new ShapeError('Write the solutions as values, for example x = 2 or x = −3.');
    case 'list':
    case 'or':
      return node.items.flatMap((n) => collectValues(n, variable));
    case 'rel': {
      if (node.op !== '=')
        throw new ShapeError('Write each solution as an equation, such as x = 2.');
      let named: string;
      let other: Node;
      if (node.left.k === 'sym') {
        named = node.left.name;
        other = node.right;
      } else if (node.right.k === 'sym') {
        named = node.right.name;
        other = node.left;
      } else {
        throw new ShapeError('Write each solution as variable = value.');
      }
      if (variable && named !== variable) throw new ShapeError(`Give the value of ${variable}.`);
      return collectValues(other, variable);
    }
    default:
      if (!isConstant(node)) throw new ShapeError('Each solution should be a number.');
      return expandPm(node);
  }
}

function sameValueSets(a: Node[], b: Node[]): boolean {
  const dedupe = (xs: Node[]) => xs.filter((x, i) => xs.findIndex((y) => sameNumber(x, y)) === i);
  const da = dedupe(a);
  const db = dedupe(b);
  return da.length === db.length && da.every((x) => db.some((y) => sameNumber(x, y)));
}

/* ---------- Inequalities ---------- */

type Op = '<' | '<=' | '>' | '>=';

function simpleInterval(op: Op, bound: number): Interval {
  switch (op) {
    case '<':
      return { lo: -Infinity, loClosed: false, hi: bound, hiClosed: false };
    case '<=':
      return { lo: -Infinity, loClosed: false, hi: bound, hiClosed: true };
    case '>':
      return { lo: bound, loClosed: false, hi: Infinity, hiClosed: false };
    case '>=':
      return { lo: bound, loClosed: true, hi: Infinity, hiClosed: false };
  }
}

const FLIP: Record<Op, Op> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };

function collectIntervals(node: Node, variable: string, endpoints: Node[]): Interval[] {
  if (node.k === 'or') return node.items.flatMap((n) => collectIntervals(n, variable, endpoints));
  if (node.k === 'empty') return [];
  if (node.k !== 'rel') throw new ShapeError(`Write the answer as an inequality in ${variable}.`);
  const isVar = (n: Node) => n.k === 'sym' && n.name === variable;
  const chain = flattenChain(node);
  if (chain.length === 5) {
    const [a, op1, x, op2, b] = chain as [Node, Op | '=' | '!=', Node, Op | '=' | '!=', Node];
    if (
      !isVar(x) ||
      op1 === '=' ||
      op1 === '!=' ||
      op2 === '=' ||
      op2 === '!=' ||
      !isConstant(a) ||
      !isConstant(b)
    ) {
      throw new ShapeError(
        `Write the chain with ${variable} in the middle, for example -2 < ${variable} < 3.`,
      );
    }
    const ascending = (op1 === '<' || op1 === '<=') && (op2 === '<' || op2 === '<=');
    const descending = (op1 === '>' || op1 === '>=') && (op2 === '>' || op2 === '>=');
    if (!ascending && !descending)
      throw new ShapeError('Both signs in a chained inequality must point the same way.');
    endpoints.push(a, b);
    const va = value(a);
    const vb = value(b);
    return ascending
      ? [{ lo: va, loClosed: op1 === '<=', hi: vb, hiClosed: op2 === '<=' }]
      : [{ lo: vb, loClosed: op2 === '>=', hi: va, hiClosed: op1 === '>=' }];
  }
  if (chain.length > 5) throw new ShapeError('Use at most two inequality signs in a chain.');
  if (node.op === '=') throw new ShapeError('Use an inequality sign, not an equals sign.');
  let op: Op | '!=';
  let boundNode: Node;
  if (isVar(node.left)) {
    op = node.op;
    boundNode = node.right;
  } else if (isVar(node.right)) {
    op = node.op === '!=' ? '!=' : FLIP[node.op];
    boundNode = node.left;
  } else {
    throw new ShapeError(
      `Write the answer with ${variable} on its own, for example ${variable} < 3.`,
    );
  }
  if (!isConstant(boundNode)) throw new ShapeError('The other side should be a number.');
  endpoints.push(boundNode);
  const bound = value(boundNode);
  if (op === '!=') {
    return [
      { lo: -Infinity, loClosed: false, hi: bound, hiClosed: false },
      { lo: bound, loClosed: false, hi: Infinity, hiClosed: false },
    ];
  }
  return [simpleInterval(op, bound)];
}

/** a < x ≤ b as [a, '<', x, '<=', b], whichever way the parser nested it. */
function flattenChain(node: Node): (Node | RelOp)[] {
  if (node.k !== 'rel') return [node];
  return [...flattenChain(node.left), node.op, ...flattenChain(node.right)];
}

/** Sorted, merged union of intervals. */
function normalise(intervals: Interval[]): Interval[] {
  const sorted = intervals
    .filter((i) => i.lo < i.hi || (close(i.lo, i.hi) && i.loClosed && i.hiClosed))
    .sort((a, b) => a.lo - b.lo);
  const out: Interval[] = [];
  for (const cur of sorted) {
    const last = out.at(-1);
    const touches =
      last && (last.hi > cur.lo || (close(last.hi, cur.lo) && (last.hiClosed || cur.loClosed)));
    if (last && touches) {
      if (close(cur.hi, last.hi)) {
        last.hiClosed = last.hiClosed || cur.hiClosed;
      } else if (cur.hi > last.hi) {
        last.hi = cur.hi;
        last.hiClosed = cur.hiClosed;
      }
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

const sameEnd = (a: number, b: number) => (a === b ? true : close(a, b, 1e-11));

function sameIntervals(a: Interval[], b: Interval[]): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  return (
    na.length === nb.length &&
    na.every((x, i) => {
      const y = nb[i] as Interval;
      return (
        sameEnd(x.lo, y.lo) &&
        sameEnd(x.hi, y.hi) &&
        (x.lo === -Infinity || x.loClosed === y.loClosed) &&
        (x.hi === Infinity || x.hiClosed === y.hiClosed)
      );
    })
  );
}

/* ---------- Ordered pairs ---------- */

function collectTuples(node: Node, variables: readonly string[]): Node[][] {
  const n = variables.length;
  if (node.k === 'list' && node.tuple) {
    if (node.items.length !== n)
      throw new ShapeError(
        `Each solution needs ${n} values, in the order (${variables.join(', ')}).`,
      );
    if (!node.items.every(isConstant)) throw new ShapeError('Each value should be a number.');
    return [node.items];
  }
  if (node.k === 'list' && node.items.every((i) => i.k === 'rel')) {
    const tuple: (Node | undefined)[] = Array.from({ length: n });
    for (const item of node.items) {
      if (item.op !== '=' || item.left.k !== 'sym')
        throw new ShapeError('Write each value as, for example, x = 2.');
      const at = variables.indexOf(item.left.name);
      if (at < 0) throw new ShapeError(`Use the variables ${variables.join(' and ')}.`);
      if (!isConstant(item.right)) throw new ShapeError('Each value should be a number.');
      tuple[at] = item.right;
    }
    if (tuple.some((t) => !t))
      throw new ShapeError(`Give a value for each of ${variables.join(', ')}.`);
    return [tuple as Node[]];
  }
  if (node.k === 'list' || node.k === 'or')
    return node.items.flatMap((i) => collectTuples(i, variables));
  if (node.k === 'empty') return [];
  throw new ShapeError(
    `Write each solution as a pair, for example (${variables.map(() => '1').join(', ')}).`,
  );
}

function sameTupleSets(a: Node[][], b: Node[][]): boolean {
  const eq = (x: Node[], y: Node[]) =>
    x.length === y.length && x.every((v, i) => sameNumber(v, y[i] as Node));
  return (
    a.length === b.length &&
    a.every((x) => b.some((y) => eq(x, y))) &&
    b.every((y) => a.some((x) => eq(x, y)))
  );
}

/* ---------- Formulae ---------- */

function formulaSide(node: Node, subject: string): Node {
  if (node.k !== 'rel' || node.op !== '=')
    throw new ShapeError(`Write the answer as ${subject} = …`);
  const isSubject = (n: Node) => n.k === 'sym' && n.name === subject;
  const other = isSubject(node.left) ? node.right : isSubject(node.right) ? node.left : null;
  if (!other)
    throw new ShapeError(`Make ${subject} the subject: it should stand alone on one side.`);
  if (variablesOf(other).has(subject))
    throw new ShapeError(`${subject} must not appear on the other side.`);
  return other;
}

/* ---------- Interpretation and comparison ---------- */

function interpret(node: Node, spec: AnswerSpec, canonical: boolean): Interpreted {
  switch (spec.kind) {
    case 'number': {
      const n = single(node, 'number');
      if (!isConstant(n)) throw new ShapeError('Give a number, not an expression with letters.');
      return { t: 'node', node: n };
    }
    case 'expression':
      return { t: 'node', node: single(node, 'expression') };
    case 'solution-set':
      return { t: 'values', nodes: collectValues(node, spec.variable) };
    case 'inequality': {
      const endpoints: Node[] = [];
      const intervals = collectIntervals(node, spec.variable ?? 'x', endpoints);
      return { t: 'intervals', intervals, endpoints };
    }
    case 'ordered-pairs':
      return { t: 'tuples', tuples: collectTuples(node, spec.variables ?? ['x', 'y']) };
    case 'formula':
      return { t: 'node', node: canonical ? node : formulaSide(node, spec.variable ?? 'y') };
    default:
      throw new Error(`Answer kind '${spec.kind}' is not supported until its stage is built`);
  }
}

function same(a: Interpreted, b: Interpreted, spec: AnswerSpec): boolean {
  if (a.t === 'node' && b.t === 'node') {
    if (spec.kind === 'number') return sameNumber(a.node, b.node);
    return sameExpression(a.node, b.node, spec.domain);
  }
  if (a.t === 'values' && b.t === 'values') return sameValueSets(a.nodes, b.nodes);
  if (a.t === 'intervals' && b.t === 'intervals') return sameIntervals(a.intervals, b.intervals);
  if (a.t === 'tuples' && b.t === 'tuples') return sameTupleSets(a.tuples, b.tuples);
  return false;
}

function formNodes(a: Interpreted): Node[] {
  switch (a.t) {
    case 'node':
      return [a.node];
    case 'values':
      return a.nodes;
    case 'intervals':
      return a.endpoints;
    case 'tuples':
      return a.tuples.flat();
  }
}

/**
 * Rounding check: correct only for exactly the canonical value rounded as asked. A value that
 * rounds to it but is written to a different accuracy is the right value in the wrong form.
 */
function accuracyIssue(
  learner: Node,
  canonical: Node,
  accuracy: NonNullable<AnswerSpec['accuracy']>,
): { verdict: 'correct' } | { verdict: 'wrong-form'; issue: string } | { verdict: 'incorrect' } {
  const round = (x: number) =>
    'sf' in accuracy ? x.toPrecision(accuracy.sf) : x.toFixed(accuracy.dp);
  const target = Q.fromDecimal(round(value(canonical)));
  const what =
    'sf' in accuracy ? `${accuracy.sf} significant figures` : `${accuracy.dp} decimal places`;
  if (!Q.fromDecimal(round(value(learner))).eq(target)) return { verdict: 'incorrect' };
  const stripped = learner.k === 'neg' ? learner.arg : learner;
  if (stripped.k !== 'num')
    return { verdict: 'wrong-form', issue: `Give the answer as a decimal, to ${what}.` };
  return exact(learner)?.eq(target)
    ? { verdict: 'correct' }
    : { verdict: 'wrong-form', issue: `Round your answer to ${what}.` };
}

const parseOrNull = (latex: string): Node | null => {
  try {
    return parseLatex(latex);
  } catch {
    return null;
  }
};

/**
 * Checks a learner's LaTeX answer against the spec. `misconceptions` are the wrong answers that
 * known faulty rules produce for this problem; a match is reported by id.
 */
export function check(
  input: string,
  spec: AnswerSpec,
  misconceptions: readonly MisconceptionAnswer[] = [],
): CheckResult {
  if (!SUPPORTED.has(spec.kind)) {
    throw new Error(`Answer kind '${spec.kind}' is not supported until its stage is built`);
  }
  const canonicalNode = parseLatex(spec.canonical);
  const expected = interpret(canonicalNode, spec, true);

  let node: Node;
  try {
    node = parseLatex(input);
  } catch (error) {
    if (error instanceof ParseError) {
      return {
        verdict: 'unparseable',
        formIssues: [],
        feedback: "I couldn't read that answer. Check the preview.",
      };
    }
    throw error;
  }

  let given: Interpreted;
  try {
    given = interpret(node, spec, false);
  } catch (error) {
    if (error instanceof ShapeError)
      return { verdict: 'incorrect', formIssues: [], feedback: error.message };
    throw error;
  }

  if (spec.accuracy && spec.kind === 'number' && given.t === 'node' && expected.t === 'node') {
    const result = accuracyIssue(given.node, expected.node, spec.accuracy);
    if (result.verdict === 'correct')
      return { verdict: 'correct', formIssues: [], feedback: 'Correct.' };
    if (result.verdict === 'wrong-form') {
      return {
        verdict: 'right-value-wrong-form',
        formIssues: [result.issue],
        feedback: result.issue,
      };
    }
  } else if (same(given, expected, spec)) {
    const issues = [
      ...new Set(
        spec.form
          .flatMap((req) => formNodes(given).map((n) => formIssue(req, n)))
          .filter((x): x is string => x !== null),
      ),
    ];
    if (issues.length === 0) return { verdict: 'correct', formIssues: [], feedback: 'Correct.' };
    return {
      verdict: 'right-value-wrong-form',
      formIssues: issues,
      feedback: `The value is right. ${issues.join(' ')}`,
    };
  }

  for (const m of misconceptions) {
    const wrongNode = parseOrNull(m.answer);
    if (!wrongNode) continue;
    try {
      if (same(given, interpret(wrongNode, spec, false), spec)) {
        return {
          verdict: 'incorrect',
          formIssues: [],
          misconceptionId: m.id,
          feedback: 'Not quite.',
        };
      }
    } catch {
      // A misconception answer of a different shape cannot match.
    }
  }
  return { verdict: 'incorrect', formIssues: [], feedback: 'Not quite.' };
}
