import { useEffect, useRef } from 'react';

const WARMUP_MS = 1000;
const WINDOW_MS = 1000;
/** Below this the page is visibly janky: give up on the live fractal at once. */
const SEVERE_FPS = 20;
/** Below this for two windows in a row: ask the renderer to do less. */
const STRAINED_FPS = 45;

/**
 * Watches the page's own frame rate while the live fractal runs. The brief requires the UI to
 * stay smooth regardless of the background, and on machines without a capable GPU the fractal
 * can hold back the whole page. Calls `onStrain(severe)` when it does.
 */
export function useFrameGuard(active: boolean, onStrain: (severe: boolean) => void) {
  const strain = useRef(onStrain);
  useEffect(() => {
    strain.current = onStrain;
  });

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let windowStart = performance.now() + WARMUP_MS;
    let frames = 0;
    let strainedWindows = 0;
    const reset = () => {
      windowStart = performance.now() + WINDOW_MS;
      frames = 0;
    };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now < windowStart) return;
      frames++;
      if (now - windowStart < WINDOW_MS) return;
      const fps = (frames * 1000) / (now - windowStart);
      windowStart = now;
      frames = 0;
      if (fps < SEVERE_FPS) {
        strain.current(true);
      } else if (fps < STRAINED_FPS) {
        if (++strainedWindows >= 2) {
          strainedWindows = 0;
          strain.current(false);
        }
      } else {
        strainedWindows = 0;
      }
    };
    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', reset);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [active]);
}
