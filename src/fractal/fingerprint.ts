import type { Complex } from './types';

/** 32-bit FNV-1a over UTF-16 code units. */
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A topic's fractal fingerprint: a Julia constant derived deterministically from its id.
 *
 * c is placed just outside the main cardioid of the Mandelbrot set,
 * c(θ) = e^{iθ}/2 − e^{2iθ}/4, scaled by 1.005 to 1.04. Julia sets for c near that boundary are
 * intricate and well filled, so every topic gets a rich, distinct image. θ avoids the cusp at 0,
 * where the sets become sparse.
 */
export function fingerprint(id: string): Complex {
  const h = fnv1a(id);
  const theta = 0.35 + ((h & 0xffff) / 0x10000) * (2 * Math.PI - 0.7);
  const scale = 1.005 + ((h >>> 16) / 0x10000) * 0.035;
  const re = 0.5 * Math.cos(theta) - 0.25 * Math.cos(2 * theta);
  const im = 0.5 * Math.sin(theta) - 0.25 * Math.sin(2 * theta);
  return [re * scale, im * scale];
}
