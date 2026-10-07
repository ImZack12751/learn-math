import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FractalController } from '../../fractal/controller';
import type { FractalMode, PulseKind } from '../../fractal/loop';

interface FractalContextValue {
  /** Depth shown by the background: the preview while one is set, otherwise progress. */
  depth: number;
  mode: FractalMode;
  /** True when the live renderer is running (false in still mode). */
  live: boolean;
  setLive: (live: boolean) => void;
  setMode: (mode: FractalMode) => void;
  setProgressDepth: (depth: number) => void;
  setPreviewDepth: (depth: number | null) => void;
  /** Feedback pulse on the background. */
  pulse: (kind: PulseKind) => void;
  /** Most recent pulse, for the still-image fallback. */
  lastPulse: { kind: PulseKind; at: number } | null;
  controllerRef: React.RefObject<FractalController | null>;
}

const FractalContext = createContext<FractalContextValue | null>(null);

export function FractalProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<FractalController | null>(null);
  const [mode, setMode] = useState<FractalMode>('ambient');
  const [live, setLive] = useState(false);
  const [progressDepth, setProgressDepth] = useState(0);
  const [previewDepth, setPreviewDepth] = useState<number | null>(null);
  const [lastPulse, setLastPulse] = useState<FractalContextValue['lastPulse']>(null);

  const pulse = useCallback((kind: PulseKind) => {
    controllerRef.current?.send({ type: 'pulse', kind });
    setLastPulse({ kind, at: performance.now() });
  }, []);

  const value = useMemo<FractalContextValue>(
    () => ({
      depth: previewDepth ?? progressDepth,
      mode,
      live,
      setLive,
      setMode,
      setProgressDepth,
      setPreviewDepth,
      pulse,
      lastPulse,
      controllerRef,
    }),
    [previewDepth, progressDepth, mode, live, pulse, lastPulse],
  );

  return <FractalContext.Provider value={value}>{children}</FractalContext.Provider>;
}

export function useFractal(): FractalContextValue {
  const value = useContext(FractalContext);
  if (!value) throw new Error('useFractal must be used inside <FractalProvider>');
  return value;
}
