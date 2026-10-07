/// <reference lib="webworker" />
import { FractalHost, type HostEvent, type HostMessage } from './host';

declare const self: DedicatedWorkerGlobalScope;

let host: FractalHost | null = null;
function post(event: HostEvent) {
  self.postMessage(event);
}

// requestAnimationFrame exists in dedicated workers in current browsers; fall back to a timer.
const scheduler = {
  request: (callback: (now: number) => void) => {
    if (typeof self.requestAnimationFrame === 'function') self.requestAnimationFrame(callback);
    else
      setTimeout(() => {
        callback(performance.now());
      }, 16);
  },
  now: () => performance.now(),
};

self.onmessage = (event: MessageEvent<{ canvas: OffscreenCanvas } | HostMessage>) => {
  const data = event.data;
  if ('canvas' in data) {
    try {
      host = new FractalHost(data.canvas, scheduler, post);
    } catch (error) {
      post({ type: 'unsupported', reason: String(error) });
    }
    return;
  }
  host?.handle(data);
};
