/**
 * Overall depth: retention-weighted mastery across the whole nine-stage curriculum, 0..1.
 * Measured against every topic (planned ones included), so depth keeps growing across the full
 * journey and never drops when a new stage is released (ARCHITECTURE section 6.5).
 */
export function overallDepth(mastery: ReadonlyMap<string, number>, totalTopics: number): number {
  if (totalTopics <= 0) return 0;
  let sum = 0;
  for (const value of mastery.values()) sum += Math.min(1, Math.max(0, value));
  return Math.min(1, sum / totalTopics);
}
