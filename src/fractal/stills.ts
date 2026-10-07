/**
 * Settings for build-time images, shared by the render script and the UI that loads them.
 */
import { DEFAULT_JULIA_C, BASE_ZOOM, depthToIterations, framing, viewAt } from './math';
import type { FractalKind, FractalStyle, FrameParams } from './types';

/** Bump to force every generated image to re-render. */
export const RENDER_VERSION = 2;

/** Thumbnails are rendered once, light-on-dark; each theme adapts them with a CSS filter. */
export const THUMBNAIL_STYLE: FractalStyle = {
  ramp: [
    [0, 0.03],
    [0.3, 0.06],
    [0.52, 0.2],
    [0.72, 0.47],
    [0.88, 0.76],
    [1, 0.9],
  ],
  interior: 0.05,
  interiorDetail: 0.12,
  glow: 0.3,
  grain: 0,
  vignette: 0.55,
  halo: 0.04,
  ink: '#040405',
  paper: '#f4f4f2',
};

export const THUMBNAIL_SIZE = 512;
export const STILL_SIZE = { width: 1600, height: 1000 } as const;

export function thumbnailParams(c: FrameParams['c']): FrameParams {
  return {
    kind: 'julia',
    center: [0, 0],
    halfHeight: 1.45,
    c,
    relax: [1, 0],
    maxIter: 240,
    boost: 0,
    ripple: -1,
    grainSeed: 0,
  };
}

export function stillParams(kind: FractalKind): FrameParams {
  return {
    kind,
    ...viewAt(framing(kind, DEFAULT_JULIA_C), BASE_ZOOM),
    c: DEFAULT_JULIA_C,
    relax: [1, 0],
    maxIter: depthToIterations(0),
    boost: 0,
    ripple: -1,
    grainSeed: 7,
  };
}

/** Public URL paths (relative to the app base). */
export const thumbnailPath = (topicId: string, size: 256 | 512) =>
  `generated/thumbs/${topicId}${size === 256 ? '-256' : ''}.webp`;
export const stillPath = (themeId: string, kind: FractalKind) =>
  `generated/stills/${themeId}-${kind}.webp`;
