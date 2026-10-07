import type { ComponentProps } from 'react';

/** Frosted-glass surface. Readable over any part of the fractal (see themes.test.ts). */
export function Panel({ className = '', ...rest }: ComponentProps<'div'>) {
  return <div className={`glass rounded-2xl ${className}`} {...rest} />;
}
