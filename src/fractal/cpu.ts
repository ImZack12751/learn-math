/**
 * CPU renderer for build-time images (topic thumbnails and fallback stills). Same maths as the
 * shader; supersampled for clean edges because these images are seen up close.
 */
import { hexToRgb, newtonBias, samplePoint } from './math';
import { shade } from './shade';
import type { FractalStyle, FrameParams } from './types';

/** Small deterministic hash for grain, so images are reproducible. */
function hashNoise(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
}

/** Renders RGB pixels (3 bytes each). */
export function renderRgb(
  width: number,
  height: number,
  params: FrameParams,
  style: FractalStyle,
  supersample = 2,
): Uint8Array {
  const out = new Uint8Array(width * height * 3);
  const ink = hexToRgb(style.ink);
  const paper = hexToRgb(style.paper);
  const pixel = (2 * params.halfHeight) / height;
  const sub = 1 / supersample;
  const bias = newtonBias(params.halfHeight);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let total = 0;
      for (let sy = 0; sy < supersample; sy++) {
        for (let sx = 0; sx < supersample; sx++) {
          const fx = x + (sx + 0.5) * sub;
          const fy = y + (sy + 0.5) * sub;
          const ux = (fx - width / 2) / height;
          const uy = (height / 2 - fy) / height;
          const p = [
            params.center[0] + ux * 2 * params.halfHeight,
            params.center[1] + uy * 2 * params.halfHeight,
          ] as const;
          const s = samplePoint(params.kind, p, params.c, params.relax, params.maxIter, bias);
          total += shade(s, style, {
            pixel,
            uv: [ux, uy],
            boost: params.boost,
            ripple: params.ripple,
            noise: hashNoise(x, y, params.grainSeed),
          });
        }
      }
      const lum = total / (supersample * supersample);
      const i = (y * width + x) * 3;
      for (let k = 0; k < 3; k++) {
        const a = ink[k] ?? 0;
        const b = paper[k] ?? 1;
        out[i + k] = Math.round(255 * (a + (b - a) * lum));
      }
    }
  }
  return out;
}
