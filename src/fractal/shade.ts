/**
 * Turns a point sample into a final luminance. Mirrors the second half of
 * `shaders/fractal.frag.glsl`, so build-time images match the live renderer.
 */
import { sampleRamp, type PointSample } from './math';
import type { FractalStyle } from './types';

export interface ShadeContext {
  /** Size of one output pixel in the complex plane. */
  pixel: number;
  /** Screen position relative to the centre, in units of the viewport height. */
  uv: readonly [number, number];
  boost: number;
  ripple: number;
  /** Uniform noise in [0, 1) for grain. */
  noise: number;
}

export function shade(s: PointSample, style: FractalStyle, ctx: ShadeContext): number {
  const end = sampleRamp(style.ramp, 1);
  const start = sampleRamp(style.ramp, 0);
  let lum: number;
  if (s.t < 0) {
    // Soft texture inside the set: points whose orbit passes close to 0 glow faintly.
    const k = Math.min(1, s.trap * 2.5);
    lum =
      style.interior + (end - style.interior) * style.interiorDetail * (1 - k * k * (3 - 2 * k));
  } else {
    const t = Math.pow(s.t, 1 - 0.3 * ctx.boost);
    lum = sampleRamp(style.ramp, t);
    if (Number.isFinite(s.de)) {
      const g = Math.exp(-s.de / (ctx.pixel * 6));
      lum += (end - lum) * style.glow * g;
    }
    if (s.root >= 0) lum = start + (lum - start) * (0.8 + 0.1 * s.root);
  }
  const r = Math.hypot(ctx.uv[0], ctx.uv[1]);
  lum += (end - start) * style.halo * Math.exp(-r * r * 3);
  const v = Math.min(1, Math.max(0, (r - 0.35) / 0.75));
  lum += (start - lum) * style.vignette * v * v * (3 - 2 * v);
  if (ctx.ripple >= 0) {
    const ring = Math.exp(-(((r - ctx.ripple * 1.4) / 0.22) ** 2)) * (1 - ctx.ripple);
    lum += (start - lum) * (ring * 0.45 + 0.12 * (1 - ctx.ripple));
  }
  lum += (ctx.noise - 0.5) * style.grain;
  return Math.min(1, Math.max(0, lum));
}
