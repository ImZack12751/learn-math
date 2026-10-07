import { describe, expect, it } from 'vitest';
import { getStage, stageClosure, stages, topics } from './curriculum';

describe('curriculum', () => {
  it('has nine stages with ids 1 to 9 in order', () => {
    expect(stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('has unique topic ids prefixed with their stage', () => {
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of topics) expect(t.id.startsWith(`s${t.stage}-`)).toBe(true);
  });

  it('only references prerequisites that exist and come earlier', () => {
    const position = new Map(topics.map((t, i) => [t.id, i]));
    for (const t of topics) {
      for (const p of t.prerequisites) {
        const at = position.get(p);
        expect(at, `${t.id} -> ${p} is unknown`).toBeDefined();
        expect(at, `${t.id} -> ${p} comes later`).toBeLessThan(position.get(t.id) ?? -1);
      }
    }
  });

  it('only crosses stages along stage prerequisites', () => {
    const stageOf = new Map(topics.map((t) => [t.id, t.stage]));
    for (const t of topics) {
      const allowed = stageClosure(t.stage);
      for (const p of t.prerequisites) {
        const ps = stageOf.get(p);
        if (ps === undefined || ps === t.stage) continue;
        expect(allowed.has(ps), `${t.id} -> ${p} crosses into stage ${ps}`).toBe(true);
      }
    }
  });

  it('records the stage order rules from the brief', () => {
    expect([...stageClosure(7)].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(stageClosure(6).has(7)).toBe(false);
    expect(getStage(9).optional).toBe(true);
  });

  it('gives every topic in the build scope a summary and time estimate', () => {
    for (const t of topics.filter((x) => x.stage <= 3)) {
      expect(t.summary, t.id).toBeTruthy();
      expect(t.minutes, t.id).toBeGreaterThan(0);
    }
  });
});
