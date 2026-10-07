/**
 * Owns the renderer and the loop and reacts to messages. Runs inside the worker when
 * OffscreenCanvas is available, otherwise on the main thread; the message protocol is the same.
 */
import { FractalLoop, type FractalMode, type PulseKind } from './loop';
import { FractalRenderer } from './renderer';
import type { FractalKind, FractalStyle } from './types';

export type HostMessage =
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'style'; style: FractalStyle }
  | { type: 'kind'; kind: FractalKind }
  | { type: 'mode'; mode: FractalMode }
  | { type: 'depth'; depth: number; immediate?: boolean }
  | { type: 'pointer'; x: number; y: number }
  | { type: 'pulse'; kind: PulseKind }
  | { type: 'paused'; paused: boolean }
  /** The page's frame rate is suffering: render less (or stop at once when severe). */
  | { type: 'degrade'; severe: boolean };

export type HostEvent =
  | { type: 'unsupported'; reason: string }
  | { type: 'ready' }
  /** Even the lightest rendering slows the page: show the still image instead. */
  | { type: 'overloaded' };

export interface Scheduler {
  request(callback: (now: number) => void): void;
  now(): number;
}

export class FractalHost {
  private readonly renderer: FractalRenderer;
  private readonly loop = new FractalLoop();
  private size = { width: 1, height: 1, dpr: 1 };
  private paused = false;
  private scheduled = false;
  private readonly epoch: number;

  constructor(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    private readonly scheduler: Scheduler,
    private readonly emit: (event: HostEvent) => void,
  ) {
    this.renderer = new FractalRenderer(canvas);
    this.epoch = scheduler.now();
    emit({ type: 'ready' });
  }

  handle(message: HostMessage) {
    switch (message.type) {
      case 'resize':
        this.size = message;
        break;
      case 'style':
        this.renderer.setStyle(message.style);
        break;
      case 'kind':
        this.loop.kind = message.kind;
        break;
      case 'mode':
        this.loop.mode = message.mode;
        break;
      case 'depth':
        this.loop.setDepth(message.depth, message.immediate);
        break;
      case 'pointer':
        this.loop.setPointer(message.x, message.y);
        break;
      case 'pulse':
        this.loop.pulse(message.kind, this.scheduler.now());
        break;
      case 'paused':
        this.paused = message.paused;
        break;
      case 'degrade':
        if (message.severe || !this.loop.degrade()) {
          this.paused = true;
          this.emit({ type: 'overloaded' });
        }
        break;
    }
    this.schedule();
  }

  private schedule() {
    if (this.scheduled || this.paused) return;
    this.scheduled = true;
    this.scheduler.request((now) => {
      this.scheduled = false;
      this.tick(now);
    });
  }

  private tick(now: number) {
    if (this.paused) return;
    if (this.renderer.lost) {
      this.emit({ type: 'unsupported', reason: 'WebGL context lost' });
      return;
    }
    if (this.loop.due(now)) {
      const params = this.loop.frame(now, (now - this.epoch) / 1000);
      const [w, h] = this.loop.resolution(this.size.width, this.size.height, this.size.dpr);
      this.renderer.draw(params, w, h);
      this.loop.recordFrame(now);
    }
    this.schedule();
  }
}
