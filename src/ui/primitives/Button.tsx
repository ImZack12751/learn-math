import { Link } from 'react-router';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'ghost';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-medium tracking-[0.01em] transition-[background-color,border-color,color,transform] duration-300 ease-theme active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'sheen bg-accent text-accent-fg hover:brightness-110',
  ghost:
    'border border-line-strong text-fg hover:border-fg hover:bg-[color-mix(in_srgb,var(--c-fg)_8%,transparent)]',
};

/** Class names for anything styled as a button (for example an in-page anchor). */
export const buttonClass = (variant: Variant = 'primary', extra = '') =>
  `${base} ${variants[variant]} ${extra}`;

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  className = '',
  ...rest
}: CommonProps & ComponentProps<'button'>) {
  return <button type="button" className={buttonClass(variant, className)} {...rest} />;
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClass(variant, className)} {...rest} />;
}
