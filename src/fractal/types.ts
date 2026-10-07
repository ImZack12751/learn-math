export type FractalKind = 'julia' | 'mandelbrot' | 'burning-ship' | 'newton';

export const FRACTAL_KINDS: readonly FractalKind[] = [
  'julia',
  'mandelbrot',
  'burning-ship',
  'newton',
];

export type Complex = readonly [re: number, im: number];

/**
 * How a theme paints the fractal. Luminance values are 0..1 and are mapped onto the line
 * between `ink` (luminance 0) and `paper` (luminance 1), so a light theme simply uses a ramp
 * that runs from high to low.
 */
export interface FractalStyle {
  /** 2 to 8 stops of [position 0..1, luminance 0..1], positions increasing. */
  ramp: readonly (readonly [number, number])[];
  /** Luminance inside the set. */
  interior: number;
  /** Strength of the soft orbit-trap texture inside the set, 0..0.3. */
  interiorDetail: number;
  /** Strength of the soft glow along the set boundary, 0..1. */
  glow: number;
  /** Film grain amplitude, 0..0.1. */
  grain: number;
  /** How strongly the edges fade toward the ramp's first stop, 0..1. */
  vignette: number;
  /** Soft radial lift of luminance near the centre, 0..0.2. */
  halo: number;
  ink: string;
  paper: string;
}

/** Everything the renderer needs to draw one frame. */
export interface FrameParams {
  kind: FractalKind;
  center: Complex;
  /** Half the height of the view in the complex plane. */
  halfHeight: number;
  /** Julia constant. */
  c: Complex;
  /** Newton relaxation factor. */
  relax: Complex;
  maxIter: number;
  /** Correct-answer pulse, 0..1. */
  boost: number;
  /** Wrong-answer ripple progress 0..1, or -1 when inactive. */
  ripple: number;
  /** Seed for film grain; changes every frame when animated. */
  grainSeed: number;
}

export const MAX_RAMP_STOPS = 8;
