/**
 * Progress summary read by the landing page and topic headers.
 *
 * Checkpoint (a) has no learning records yet, so this reports the true state of a fresh install:
 * nothing mastered, nothing due, no streak. Checkpoint (d) replaces the body of this hook with
 * Dexie queries; its callers do not change.
 */
import type { TopicId } from '../content/curriculum';

export interface ProgressSummary {
  /** Retention-weighted mastery per topic, 0..1; missing means untouched. */
  mastery: ReadonlyMap<TopicId, number>;
  reviewsDue: number;
  streakDays: number;
  /** The topic to continue with, or null before any study. */
  continueTopic: TopicId | null;
}

const fresh: ProgressSummary = {
  mastery: new Map(),
  reviewsDue: 0,
  streakDays: 0,
  continueTopic: null,
};

export function useProgressSummary(): ProgressSummary {
  return fresh;
}
