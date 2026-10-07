/** WCAG 2.2 relative luminance and contrast ratio, plus alpha compositing. */
import { hexToRgb, sampleRamp } from '../fractal/math';
import type { Theme } from './types';

type Rgb = readonly [number, number, number];

const channel = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

export function luminance(rgb: Rgb): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function over(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return [
    top[0] * alpha + bottom[0] * (1 - alpha),
    top[1] * alpha + bottom[1] * (1 - alpha),
    top[2] * alpha + bottom[2] * (1 - alpha),
  ];
}

/** Parses #rrggbb or #rrggbbaa into colour and alpha. */
export function parseColor(hex: string): { rgb: Rgb; alpha: number } {
  if (/^#[0-9a-f]{8}$/i.test(hex)) {
    return { rgb: hexToRgb(hex.slice(0, 7)), alpha: parseInt(hex.slice(7), 16) / 255 };
  }
  return { rgb: hexToRgb(hex), alpha: 1 };
}

/**
 * The fractal colours furthest from the panel tint: the extremes the fractal can paint anywhere
 * on screen (any ramp stop, the interior, plus grain). Panels and text are tested against both,
 * so readability does not depend on where the fractal happens to be bright.
 */
export function fractalExtremes(theme: Theme): Rgb[] {
  const f = theme.fractal;
  const end = sampleRamp(f.ramp, 1);
  const textured = f.interior + (end - f.interior) * f.interiorDetail;
  const lums = [...f.ramp.map(([, l]) => l), f.interior, textured, end];
  const lo = Math.max(0, Math.min(...lums) - f.grain / 2);
  const hi = Math.min(1, Math.max(...lums) + f.grain / 2 + f.halo);
  const ink = hexToRgb(f.ink);
  const paper = hexToRgb(f.paper);
  const at = (l: number): Rgb => [
    ink[0] + (paper[0] - ink[0]) * l,
    ink[1] + (paper[1] - ink[1]) * l,
    ink[2] + (paper[2] - ink[2]) * l,
  ];
  return [at(lo), at(hi)];
}
