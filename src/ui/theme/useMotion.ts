import { useSyncExternalStore } from 'react';
import { useSettings } from '../../data/settings';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', callback);
  return () => {
    media.removeEventListener('change', callback);
  };
}

const systemPrefersReduced = () => window.matchMedia(QUERY).matches;

/** True when motion should be reduced: by the Settings choice, or by the OS when set to System. */
export function useReducedMotion(): boolean {
  const preference = useSettings((s) => s.motion);
  const system = useSyncExternalStore(subscribe, systemPrefersReduced, () => false);
  return preference === 'reduced' || (preference === 'system' && system);
}
