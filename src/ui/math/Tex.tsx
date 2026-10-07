import katex from 'katex';
import { useMemo } from 'react';

interface TexProps {
  tex: string;
  display?: boolean;
  className?: string;
}

/**
 * Typeset maths with the bundled KaTeX. Output includes MathML so screen readers announce the
 * mathematics. Errors throw: every expression in the app is authored or generated, so a parse
 * error is a bug to fix, not something to show the learner.
 */
export function Tex({ tex, display = false, className }: TexProps) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: display,
        output: 'htmlAndMathml',
        throwOnError: true,
        strict: 'error',
      }),
    [tex, display],
  );
  const Tag = display ? 'div' : 'span';
  // KaTeX output is generated from our own trusted source strings.
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
