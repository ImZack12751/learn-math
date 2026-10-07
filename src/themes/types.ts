import type { FractalStyle } from '../fractal/types';

/**
 * A theme is one file: `src/themes/<id>.theme.ts` default-exporting `defineTheme({...})`.
 * Adding the file is all it takes; the registry discovers it, and `themes.test.ts` checks
 * its contrast in every combination the UI uses.
 *
 * Every colour is greyscale or a near-neutral tint. No hue-based accents.
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  scheme: 'dark' | 'light';
  colors: {
    /** Page background, shown before the fractal paints and behind everything. */
    bg: string;
    /** Body text. */
    fg: string;
    /** Secondary text. */
    fgMuted: string;
    /** Labels and captions (still ≥ 4.5:1 on panels). */
    fgFaint: string;
    /** Hairlines and dividers (decorative). */
    line: string;
    /** Borders of controls (≥ 3:1). */
    lineStrong: string;
    /** Focus ring (≥ 3:1). */
    focus: string;
    /** Frosted panel tint; drawn at `panel.opacity` over the fractal. */
    panel: string;
    /** Faint highlight along a panel's top edge. */
    panelHighlight: string;
    /** Luminous emphasis: primary buttons, meters, active states. */
    accent: string;
    /** Text drawn on `accent`. */
    accentFg: string;
  };
  panel: {
    opacity: number;
    blur: number;
    /** Inner glow strength 0..1. */
    glow: number;
  };
  /** Opacity of the soft scrim behind hero text that sits directly on the fractal. */
  scrim: number;
  fractal: FractalStyle;
  /** CSS filter for topic thumbnails, which are rendered light-on-dark. */
  thumbnailFilter: string;
  motion: {
    ease: readonly [number, number, number, number];
    /** Multiplies every UI animation duration. */
    durationScale: number;
  };
}

export const defineTheme = (theme: Theme): Theme => theme;
