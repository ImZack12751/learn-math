/**
 * Display settings. Kept in localStorage (not IndexedDB) because they must be read synchronously
 * at start-up, so the right theme paints on the very first frame. Export and import include them.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FractalKind } from '../fractal/types';
import { DEFAULT_THEME_ID } from '../themes/registry';

export type MotionPreference = 'system' | 'full' | 'reduced';

interface SettingsState {
  themeId: string;
  motion: MotionPreference;
  fractalKind: FractalKind;
  setTheme: (id: string) => void;
  setMotion: (motion: MotionPreference) => void;
  setFractalKind: (kind: FractalKind) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      motion: 'system',
      fractalKind: 'julia',
      setTheme: (themeId) => {
        set({ themeId });
      },
      setMotion: (motion) => {
        set({ motion });
      },
      setFractalKind: (fractalKind) => {
        set({ fractalKind });
      },
    }),
    { name: 'iterate:settings', version: 1 },
  ),
);
