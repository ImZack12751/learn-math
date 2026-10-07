import { describe, expect, it } from 'vitest';
import { renderRgb } from './cpu';
import { fingerprint, fnv1a } from './fingerprint';
import { FractalLoop } from './loop';
import {
  BASE_ZOOM,
  cmul,
  DEFAULT_JULIA_C,
  depthToIterations,
  depthToZoom,
  framing,
  juliaFocus,
  MAX_ZOOM,
  MIN_HALF_HEIGHT,
  sampleRamp,
  viewAt,
} from './math';
import { stillParams, THUMBNAIL_STYLE, thumbnailParams } from './stills';
import { FRACTAL_KINDS } from './types';

describe('fingerprint', () => {
  it('matches the published FNV-1a test vector and is deterministic', () => {
    expect(fnv1a('a')).toBe(0xe40c292c);
    expect(fingerprint('s2-fractional-exponents')).toEqual(fingerprint('s2-fractional-exponents'));
  });
});

describe('fractal maths', () => {
  it('interpolates the ramp through its stops', () => {
    const ramp = [
      [0, 0],
      [0.5, 0.2],
      [1, 1],
    ] as const;
    expect(sampleRamp(ramp, 0)).toBe(0);
    expect(sampleRamp(ramp, 0.5)).toBeCloseTo(0.2);
    expect(sampleRamp(ramp, 1)).toBe(1);
    expect(sampleRamp(ramp, 0.75)).toBeCloseTo(0.6);
    expect(sampleRamp(ramp, 2)).toBe(1);
  });

  it('zooms toward a point that is a fixed point of z² + c (on the Julia set)', () => {
    const b = juliaFocus(DEFAULT_JULIA_C);
    const next = cmul(b, b);
    expect(next[0] + DEFAULT_JULIA_C[0]).toBeCloseTo(b[0], 12);
    expect(next[1] + DEFAULT_JULIA_C[1]).toBeCloseTo(b[1], 12);
  });

  it('maps depth 0..1 monotonically onto 1.5× .. 1000× and never past the precision cap', () => {
    expect(depthToZoom(0)).toBeCloseTo(BASE_ZOOM);
    expect(depthToZoom(1)).toBeCloseTo(MAX_ZOOM);
    expect(depthToZoom(5)).toBeCloseTo(MAX_ZOOM);
    let last = 0;
    for (let d = 0; d <= 1; d += 0.05) {
      expect(depthToZoom(d)).toBeGreaterThan(last);
      last = depthToZoom(d);
    }
    expect(depthToIterations(0)).toBe(96);
    expect(depthToIterations(1)).toBe(320);
  });

  it('never makes the view smaller than the float32 precision floor', () => {
    for (const kind of FRACTAL_KINDS) {
      const v = viewAt(framing(kind, DEFAULT_JULIA_C), 1e9);
      expect(v.halfHeight).toBeGreaterThanOrEqual(MIN_HALF_HEIGHT);
    }
  });

  it('finds structure at the deepest view of every kind (not a blank frame)', () => {
    for (const kind of FRACTAL_KINDS) {
      const params = { ...stillParams(kind), ...viewAt(framing(kind, DEFAULT_JULIA_C), MAX_ZOOM) };
      const rgb = renderRgb(48, 30, { ...params, maxIter: 320 }, THUMBNAIL_STYLE, 1);
      const values = Array.from(rgb);
      const spread = Math.max(...values) - Math.min(...values);
      expect(spread, kind).toBeGreaterThan(60);
    }
  });

  it('renders thumbnails with visible detail', () => {
    const rgb = renderRgb(32, 32, thumbnailParams(fingerprint('s1-decimals')), THUMBNAIL_STYLE, 1);
    const values = Array.from(rgb);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(100);
  });
});

describe('animation loop', () => {
  it('caps the frame rate by mode', () => {
    const loop = new FractalLoop();
    loop.mode = 'ambient';
    loop.recordFrame(1000);
    expect(loop.due(1010)).toBe(false);
    expect(loop.due(1034)).toBe(true);
    loop.mode = 'hero';
    expect(loop.due(1016)).toBe(true);
  });

  it('lowers resolution when frames run late and recovers when they are on time', () => {
    const loop = new FractalLoop();
    loop.mode = 'ambient';
    const start = loop.scale;
    let now = 0;
    for (let i = 0; i < 40; i++) loop.recordFrame((now += 70));
    expect(loop.scale).toBeLessThan(start);
    expect(loop.scale).toBeGreaterThanOrEqual(0.5);
    const low = loop.scale;
    for (let i = 0; i < 600; i++) loop.recordFrame((now += 33.4));
    expect(loop.scale).toBeGreaterThan(low);
    expect(loop.scale).toBeLessThanOrEqual(1);
  });

  it('pulses: correct boosts briefly, wrong runs a ripple once', () => {
    const loop = new FractalLoop();
    loop.frame(0, 0);
    loop.pulse('correct', 100);
    expect(loop.frame(200, 0).boost).toBeGreaterThan(0.5);
    expect(loop.frame(2000, 0).boost).toBe(0);
    loop.pulse('wrong', 3000);
    expect(loop.frame(3100, 0).ripple).toBeGreaterThan(0);
    expect(loop.frame(4000, 0).ripple).toBe(-1);
  });

  it('eases toward a new depth rather than jumping', () => {
    const loop = new FractalLoop();
    loop.frame(0, 0);
    loop.setDepth(1);
    const shallow = loop.frame(100, 0).maxIter;
    expect(shallow).toBeLessThan(depthToIterations(1));
    let last = shallow;
    for (let t = 200; t < 20000; t += 100) last = loop.frame(t, 0).maxIter;
    expect(last).toBe(depthToIterations(1));
  });
});
