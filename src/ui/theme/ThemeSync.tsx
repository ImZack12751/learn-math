import { useLayoutEffect } from 'react';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { useSettings } from '../../data/settings';
import { getTheme } from '../../themes/registry';
import { applyTheme } from './applyTheme';
import { useReducedMotion } from './useMotion';

/** Keeps <html> in step with the theme and motion settings, live. */
export function ThemeSync({ children }: { children: ReactNode }) {
  const themeId = useSettings((s) => s.themeId);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    applyTheme(getTheme(themeId));
  }, [themeId]);

  useLayoutEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);

  return <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>;
}
