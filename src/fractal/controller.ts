/**
 * Main-thread entry point to the fractal engine. Moves rendering into a worker via
 * OffscreenCanvas when the browser supports it, so shader work never competes with the UI thread;
 * otherwise runs the same host on the main thread.
 */
import { FractalHost, type HostEvent, type HostMessage } from './host';

export interface FractalController {
  send(message: HostMessage): void;
  destroy(): void;
}

export function createFractalController(
  canvas: HTMLCanvasElement,
  onEvent: (event: HostEvent) => void,
): FractalController {
  if (typeof canvas.transferControlToOffscreen === 'function' && typeof Worker === 'function') {
    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<HostEvent>) => {
      onEvent(event.data);
    };
    worker.onerror = (event) => {
      onEvent({ type: 'unsupported', reason: event.message });
    };
    worker.postMessage({ canvas: offscreen }, [offscreen]);
    return {
      send: (message) => {
        worker.postMessage(message);
      },
      destroy: () => {
        worker.terminate();
      },
    };
  }

  let host: FractalHost | null = null;
  let frame = 0;
  try {
    host = new FractalHost(
      canvas,
      {
        request: (callback) => {
          frame = requestAnimationFrame(callback);
        },
        now: () => performance.now(),
      },
      onEvent,
    );
  } catch (error) {
    queueMicrotask(() => {
      onEvent({ type: 'unsupported', reason: String(error) });
    });
  }
  return {
    send: (message) => host?.handle(message),
    destroy: () => {
      cancelAnimationFrame(frame);
      host?.handle({ type: 'paused', paused: true });
      host = null;
    },
  };
}
