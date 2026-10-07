import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createFractalController } from '../../fractal/controller';
import { stillPath } from '../../fractal/stills';
import { useSettings } from '../../data/settings';
import { getTheme } from '../../themes/registry';
import { asset } from '../asset';
import { useReducedMotion } from '../theme/useMotion';
import { useFractal } from './FractalProvider';
import { useLowBattery } from './useLowBattery';

/**
 * The single full-screen fractal behind the whole app. Live (WebGL2, in a worker when possible)
 * unless motion is reduced, the battery is low, or WebGL2 is unavailable; then a pre-rendered
 * still for the current theme and fractal kind.
 */
export function FractalBackground() {
  const { controllerRef, mode, depth, setLive, lastPulse } = useFractal();
  const themeId = useSettings((s) => s.themeId);
  const kind = useSettings((s) => s.fractalKind);
  const reduced = useReducedMotion();
  const lowBattery = useLowBattery();
  const [unsupported, setUnsupported] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const wantLive = !reduced && !lowBattery && !unsupported;
  const theme = getTheme(themeId);

  // Latest values for the controller's initial messages, without re-creating it on every change.
  const latest = useRef({ theme, kind, mode, depth });
  useLayoutEffect(() => {
    latest.current = { theme, kind, mode, depth };
  });

  useEffect(() => {
    const container = host.current;
    if (!wantLive || !container) return;
    // A fresh canvas per mount: control of a canvas can be transferred to a worker only once.
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'absolute inset-0 h-full w-full';
    container.prepend(canvas);
    const controller = createFractalController(canvas, (event) => {
      if (event.type === 'unsupported') setUnsupported(true);
      if (event.type === 'ready') setLive(true);
    });
    controllerRef.current = controller;
    const { theme: t, kind: k, mode: m, depth: d } = latest.current;
    const sendSize = () => {
      controller.send({
        type: 'resize',
        width: container.clientWidth,
        height: container.clientHeight,
        dpr: window.devicePixelRatio || 1,
      });
    };
    sendSize();
    controller.send({ type: 'style', style: t.fractal });
    controller.send({ type: 'kind', kind: k });
    controller.send({ type: 'mode', mode: m });
    controller.send({ type: 'depth', depth: d, immediate: true });

    const resize = new ResizeObserver(sendSize);
    resize.observe(container);
    const onVisibility = () => {
      controller.send({ type: 'paused', paused: document.hidden });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      controller.destroy();
      controllerRef.current = null;
      canvas.remove();
      setLive(false);
    };
  }, [wantLive, controllerRef, setLive]);

  useEffect(() => {
    controllerRef.current?.send({ type: 'style', style: theme.fractal });
  }, [theme, controllerRef]);
  useEffect(() => {
    controllerRef.current?.send({ type: 'kind', kind });
  }, [kind, controllerRef]);
  useEffect(() => {
    controllerRef.current?.send({ type: 'mode', mode });
  }, [mode, controllerRef]);
  useEffect(() => {
    controllerRef.current?.send({ type: 'depth', depth });
  }, [depth, controllerRef]);

  // Pointer parallax and the gentle nudge of c, on the landing hero only.
  useEffect(() => {
    if (!wantLive || mode !== 'hero') return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        controllerRef.current?.send({
          type: 'pointer',
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: 1 - (event.clientY / window.innerHeight) * 2,
        });
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      controllerRef.current?.send({ type: 'pointer', x: 0, y: 0 });
    };
  }, [wantLive, mode, controllerRef]);

  // In still mode a pulse is a short brightness change on the image (skipped when motion is reduced).
  const stillPulse = !wantLive && !reduced && lastPulse ? lastPulse : null;

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg"
      data-fractal={wantLive ? 'live' : 'still'}
    >
      {!wantLive && (
        <img
          key={stillPulse ? `${stillPulse.kind}-${stillPulse.at}` : 'still'}
          src={asset(stillPath(themeId, kind))}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={
            stillPulse
              ? {
                  animation: `still-${stillPulse.kind} calc(600ms * var(--dur-scale)) var(--ease)`,
                }
              : undefined
          }
          decoding="async"
        />
      )}
    </div>
  );
}
