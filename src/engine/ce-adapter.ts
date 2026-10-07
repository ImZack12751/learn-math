/**
 * The only module that imports Compute Engine. It uses CE's standalone LaTeX parser, which
 * returns raw MathJSON with no evaluation or canonicalisation, so the learner's form survives
 * (see ARCHITECTURE section 2.1). Upgrading CE means changing this file and re-running the suite.
 */
import { LatexSyntax } from '@cortex-js/compute-engine/latex-syntax';
import { fromMathJson, ParseError, type Node } from './ast';

const syntax = new LatexSyntax();

/** Parses LaTeX into an engine tree. Throws ParseError for incomplete or malformed input. */
export function parseLatex(latex: string): Node {
  const trimmed = latex.trim();
  if (trimmed === '') throw new ParseError('Empty answer');
  return fromMathJson(syntax.parse(trimmed));
}
