import type { ReactNode } from 'react';

/** Small mono label on a glass pill, so it stays readable directly over the fractal. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`glass label-mono inline-block rounded-full px-3.5 py-1.5 ${className}`}>
      {children}
    </p>
  );
}
