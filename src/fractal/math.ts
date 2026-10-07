/**
 * Pure fractal maths shared by the WebGL shader (mirrored in GLSL), the CPU renderer used for
 * build-time images, and the animation loop. Keep this file and `shaders/fractal.frag.glsl` in step.
 */
import type { Complex, FractalKind, FractalStyle } from './types';

export const ESCAPE_RADIUS = 64;
/** Fixed normalisation so the image does not dim when the iteration budget grows with depth. */
export const SMOOTH_NORMALISER = 256;
export const NEWTON_TOLERANCE = 1e-3;

export const cmul = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];

export const cdiv = (a: Complex, b: Complex): Complex => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};

export const cabs = (a: Complex): number => Math.hypot(a[0], a[1]);

/** Principal square root. */
export const csqrt = (a: Complex): Complex => {
  const r = cabs(a);
  const re = Math.sqrt((r + a[0]) / 2);
  const im = Math.sign(a[1] || 1) * Math.sqrt(Math.max(0, (r - a[0]) / 2));
  return [re, im];
};

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`Expected #rrggbb, got ${hex}`);
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Luminance at position t on the theme ramp (smooth between stops). */
export function sampleRamp(ramp: FractalStyle['ramp'], t: number): number {
  const x = Math.min(1, Math.max(0, t));
  const first = ramp[0];
  if (!first) throw new Error('Empty ramp');
  let prev = first;
  if (x <= prev[0]) return prev[1];
  for (let i = 1; i < ramp.length; i++) {
    const next = ramp[i];
    if (!next) break;
    if (x <= next[0]) {
      const span = Math.max(next[0] - prev[0], 1e-5);
      return prev[1] + (next[1] - prev[1]) * smoothstep((x - prev[0]) / span);
    }
    prev = next;
  }
  return prev[1];
}

/** The three cube roots of unity: the roots the Newton fractal for z³ − 1 converges to. */
export const NEWTON_ROOTS: readonly Complex[] = [
  [1, 0],
  [-0.5, Math.sqrt(3) / 2],
  [-0.5, -Math.sqrt(3) / 2],
];

export interface PointSample {
  /** Ramp position 0..1, or -1 for a point inside the set. */
  t: number;
  /** Distance estimate to the boundary (escape-time kinds), Infinity when unknown. */
  de: number;
  /** Newton root index, -1 for other kinds. */
  root: number;
  /** Closest approach of the orbit to 0 (an orbit trap), used to texture the set's interior. */
  trap: number;
}

/** Escape-time / convergence sample for one point of the plane. */
export function samplePoint(
  kind: FractalKind,
  p: Complex,
  c: Complex,
  relax: Complex,
  maxIter: number,
  bias = 0,
): PointSample {
  if (kind === 'newton') return sampleNewton(p, relax, maxIter, bias);
  let zx = kind === 'julia' ? p[0] : 0;
  let zy = kind === 'julia' ? p[1] : 0;
  const cx = kind === 'julia' ? c[0] : p[0];
  // The Burning Ship is conventionally drawn with the imaginary axis flipped, so the ship sits upright.
  const cy = kind === 'julia' ? c[1] : kind === 'burning-ship' ? -p[1] : p[1];
  let dx = kind === 'julia' ? 1 : 0;
  let dy = 0;
  const bailout = ESCAPE_RADIUS * ESCAPE_RADIUS;
  let trap = Infinity;
  for (let n = 0; n < maxIter; n++) {
    if (kind === 'burning-ship') {
      zx = Math.abs(zx);
      zy = Math.abs(zy);
    }
    const ndx = 2 * (zx * dx - zy * dy) + (kind === 'julia' ? 0 : 1);
    const ndy = 2 * (zx * dy + zy * dx);
    dx = ndx;
    dy = ndy;
    const nzx = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = nzx;
    const r2 = zx * zx + zy * zy;
    trap = Math.min(trap, r2);
    if (r2 > bailout) {
      const logZ = 0.5 * Math.log(r2);
      const nu = n + 2 - Math.log2(logZ / Math.log(ESCAPE_RADIUS));
      const t = Math.log2(1 + Math.max(0, nu)) / Math.log2(1 + SMOOTH_NORMALISER);
      // The folding in the Burning Ship breaks the derivative, so it gets no distance estimate.
      const de =
        kind === 'burning-ship'
          ? Infinity
          : (0.5 * Math.sqrt(r2) * logZ) / Math.max(Math.hypot(dx, dy), 1e-30);
      return { t: Math.min(1, t), de, root: -1, trap: 0 };
    }
  }
  return { t: -1, de: 0, root: -1, trap: Math.sqrt(trap) };
}

function sampleNewton(p: Complex, relax: Complex, maxIter: number, bias: number): PointSample {
  let z: Complex = p;
  const limit = Math.min(maxIter, 64);
  for (let n = 0; n < limit; n++) {
    const z2 = cmul(z, z);
    const z3 = cmul(z2, z);
    const step = cmul(relax, cdiv([z3[0] - 1, z3[1]], [3 * z2[0], 3 * z2[1]]));
    z = [z[0] - step[0], z[1] - step[1]];
    for (let k = 0; k < NEWTON_ROOTS.length; k++) {
      const root = NEWTON_ROOTS[k];
      if (!root) continue;
      const d = Math.hypot(z[0] - root[0], z[1] - root[1]);
      if (d < NEWTON_TOLERANCE) {
        const nu = n + 1 - Math.log2(Math.log(Math.max(d, 1e-30)) / Math.log(NEWTON_TOLERANCE));
        return {
          t: 1 - Math.exp(-Math.max(0, nu - bias) * 0.16),
          de: Infinity,
          root: k,
          trap: 0,
        };
      }
    }
  }
  return { t: -1, de: 0, root: -1, trap: 0 };
}

/** View framing per kind: where the view starts and which boundary point depth zooms toward. */
export interface Framing {
  center: Complex;
  halfHeight: number;
  focus: Complex;
}

/** The repelling fixed point of z² + c. It lies on the Julia set for every c. */
export function juliaFocus(c: Complex): Complex {
  const root = csqrt([0.25 - c[0], -c[1]]);
  return [0.5 + root[0], root[1]];
}

export function framing(kind: FractalKind, c: Complex): Framing {
  switch (kind) {
    case 'julia':
      return { center: [0, 0], halfHeight: 1.25, focus: juliaFocus(c) };
    case 'mandelbrot':
      return { center: [-0.6, 0], halfHeight: 1.2, focus: [-0.743643887, 0.131825904] };
    case 'burning-ship':
      // Framed on the small ships left of the main hull. The focus sits in the mast lattice next
      // to a boundary point found by refining toward the slowest-escaping point nearby.
      return { center: [-1.757, 0.034], halfHeight: 0.075, focus: [-1.7840861, 0.0127089] };
    case 'newton':
      // −∛½ is a preimage of the critical point 0, so it lies on the basin boundary.
      return { center: [0, 0], halfHeight: 1.4, focus: [-Math.cbrt(0.5), 0] };
  }
}

/**
 * Float32 precision limit. The GPU renders with 32-bit floats (about 1.2 × 10⁻⁷ relative
 * precision), which turn visibly blocky once a pixel spans less than ~10⁻⁶ of the plane. The view
 * is never allowed to be smaller than this half-height: at 1,000 px that is a pixel of
 * 2.4 × 10⁻⁶, a safety margin of about 10× (ARCHITECTURE section 6.4).
 */
export const MIN_HALF_HEIGHT = 1.2e-3;
export const MAX_ZOOM = 1000;
export const BASE_ZOOM = 1.5;

/** Centre and half-height for a zoom factor ≥ 1, gliding from the framing centre to its focus. */
export function viewAt(f: Framing, zoom: number): { center: Complex; halfHeight: number } {
  const halfHeight = Math.max(MIN_HALF_HEIGHT, f.halfHeight / zoom);
  const k = 1 - halfHeight / f.halfHeight;
  return {
    center: [
      f.center[0] + (f.focus[0] - f.center[0]) * k,
      f.center[1] + (f.focus[1] - f.center[1]) * k,
    ],
    halfHeight,
  };
}

/**
 * Newton convergence slows near the basin boundary as the view deepens: measured mean iterations
 * grow by about 2.85 per doubling of zoom from the base view. Subtracting this keeps brightness
 * steady at any depth.
 */
export const newtonBias = (halfHeight: number) => 2.85 * Math.max(0, Math.log2(0.936 / halfHeight));

/** Depth (overall mastery 0..1) to zoom factor: 1.5× at the start, 1000× when everything is mastered. */
export function depthToZoom(depth: number): number {
  const d = Math.min(1, Math.max(0, depth));
  return Math.min(MAX_ZOOM, BASE_ZOOM * Math.pow(MAX_ZOOM / BASE_ZOOM, d));
}

/** Iteration budget grows with depth so finer detail resolves as the view goes deeper. */
export function depthToIterations(depth: number): number {
  const d = Math.min(1, Math.max(0, depth));
  return Math.round(96 + 224 * d);
}

/** Slow orbit of the Julia constant: a small closed Lissajous loop around c₀. */
export function driftOffset(seconds: number, radius = 0.012): Complex {
  const w = (2 * Math.PI) / 90;
  return [radius * Math.cos(w * seconds), radius * Math.sin(1.3 * w * seconds)];
}

/** Zoom "breathing": ±3 % over 40 seconds. */
export function breathe(seconds: number): number {
  return 1 + 0.03 * Math.sin((2 * Math.PI * seconds) / 40);
}

export const DEFAULT_JULIA_C: Complex = [-0.7269, 0.1889];
