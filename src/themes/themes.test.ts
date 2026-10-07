import { describe, expect, it } from 'vitest';
import { MAX_RAMP_STOPS } from '../fractal/types';
import { contrast, fractalExtremes, over, parseColor } from './contrast';
import { themes } from './registry';

const rgb = (hex: string) => parseColor(hex).rgb;
/** Opacity of the page-background bands behind the header and footer (.band-* in index.css). */
const BAND_OPACITY = 0.92;

describe.each(themes.map((t) => [t.id, t] as const))('theme %s', (_id, theme) => {
  const c = theme.colors;
  const panelsOverFractal = fractalExtremes(theme).map((bg) =>
    over(rgb(c.panel), theme.panel.opacity, bg),
  );
  const scrimsOverFractal = fractalExtremes(theme).map((bg) => over(rgb(c.bg), theme.scrim, bg));

  it('keeps all text at AA (4.5:1) on panels over any part of the fractal', () => {
    for (const surface of [...panelsOverFractal, rgb(c.bg)]) {
      for (const text of [c.fg, c.fgMuted, c.fgFaint]) {
        expect(contrast(rgb(text), surface)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps small header and footer text at AA on the edge bands over any part of the fractal', () => {
    for (const bg of fractalExtremes(theme)) {
      const surface = over(rgb(c.bg), BAND_OPACITY, bg);
      for (const text of [c.fg, c.fgMuted, c.fgFaint]) {
        expect(contrast(rgb(text), surface)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(rgb(c.lineStrong), surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps large hero text at AA large (3:1) on its scrim over any part of the fractal', () => {
    for (const surface of scrimsOverFractal) {
      expect(contrast(rgb(c.fg), surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(rgb(c.fgMuted), surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps control borders and focus rings at 3:1', () => {
    for (const surface of [...panelsOverFractal, rgb(c.bg)]) {
      expect(contrast(rgb(c.lineStrong), surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(rgb(c.focus), surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(rgb(c.accent), surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps text on the accent at AA', () => {
    expect(contrast(rgb(c.accentFg), rgb(c.accent))).toBeGreaterThanOrEqual(4.5);
  });

  it('is monochrome: every colour is grey or a faint neutral tint', () => {
    const all = [...Object.values(c), theme.fractal.ink, theme.fractal.paper];
    for (const hex of all) {
      const [r, g, b] = rgb(hex);
      expect(Math.max(r, g, b) - Math.min(r, g, b), hex).toBeLessThanOrEqual(0.05);
    }
  });

  it('has a valid fractal ramp', () => {
    const ramp = theme.fractal.ramp;
    expect(ramp.length).toBeGreaterThanOrEqual(2);
    expect(ramp.length).toBeLessThanOrEqual(MAX_RAMP_STOPS);
    expect(ramp[0]?.[0]).toBe(0);
    expect(ramp.at(-1)?.[0]).toBe(1);
    for (let i = 1; i < ramp.length; i++) {
      expect(ramp[i]?.[0]).toBeGreaterThan(ramp[i - 1]?.[0] ?? 1);
    }
  });
});

describe('theme registry', () => {
  it('ships Obsidian (default), Pearl and Eclipse with unique ids', () => {
    expect(themes[0]?.id).toBe('obsidian');
    expect(themes.map((t) => t.id).sort()).toEqual(['eclipse', 'obsidian', 'pearl']);
  });
});
