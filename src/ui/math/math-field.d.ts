import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/** JSX typing for MathLive's <math-field> custom element. */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        'math-virtual-keyboard-policy'?: 'auto' | 'manual' | 'sandboxed';
        'read-only'?: string | undefined;
      };
    }
  }
}
