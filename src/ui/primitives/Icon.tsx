import type { SVGProps } from 'react';

const paths = {
  check: 'M4.5 12.5l5 5 10-11',
  cross: 'M6 6l12 12M18 6L6 18',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  display: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  streak: 'M12 3c1.5 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  approx: 'M5 9c2-2 4-2 7 0s5 2 7 0M5 15c2-2 4-2 7 0s5 2 7 0',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z',
  info: 'M12 8h.01M11 12h1v5h1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7',
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  /** Accessible label; omit for decorative icons next to text. */
  label?: string;
}

export function Icon({ name, label, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
