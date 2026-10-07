import { useEffect, useState } from 'react';

interface BatteryManager extends EventTarget {
  charging: boolean;
  level: number;
}

/**
 * True when the Battery Status API (Chromium only) reports a discharging battery at or below 20 %.
 * There is no web API for the operating system's battery-saver mode, so this is best effort;
 * the Motion setting is the reliable control (ARCHITECTURE section 6.3).
 */
export function useLowBattery(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    if (!nav.getBattery) return;
    let battery: BatteryManager | null = null;
    const update = () => {
      if (battery) setLow(!battery.charging && battery.level <= 0.2);
    };
    let cancelled = false;
    nav
      .getBattery()
      .then((b) => {
        if (cancelled) return;
        battery = b;
        update();
        b.addEventListener('chargingchange', update);
        b.addEventListener('levelchange', update);
      })
      .catch(() => {
        // Not available in this context; keep the live renderer.
      });
    return () => {
      cancelled = true;
      battery?.removeEventListener('chargingchange', update);
      battery?.removeEventListener('levelchange', update);
    };
  }, []);
  return low;
}
