/**
 * The animation state machine: drift, breathing, depth easing, pointer parallax, feedback pulses,
 * the frame-rate cap and adaptive resolution. Pure apart from the clock values passed in, so it
 * runs identically in a worker or on the main thread.
 */
import {
  breathe,
  DEFAULT_JULIA_C,
  depthToIterations,
  depthToZoom,
  driftOffset,
  framing,
  viewAt,
} from './math';
import type { Complex, FractalKind, FrameParams } from './types';

export type FractalMode = 'hero' | 'ambient';
export type PulseKind = 'correct' | 'wrong';

const CORRECT_MS = 650;
const WRONG_MS = 560;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1;
const MAX_DPR = 1.5;

export class FractalLoop {
  kind: FractalKind = 'julia';
  mode: FractalMode = 'ambient';
  /** Internal resolution multiplier, adapted from measured frame time. */
  scale = 0.75;

  private depthTarget = 0;
  private depth = 0;
  private pointerTarget: Complex = [0, 0];
  private pointer: Complex = [0, 0];
  private correctAt = -Infinity;
  private wrongAt = -Infinity;
  private lastFrame = -Infinity;
  private lastTick = -Infinity;
  private slowFrames = 0;
  private fastFrames = 0;
  private frameCount = 0;

  setDepth(depth: number, immediate = false) {
    this.depthTarget = Math.min(1, Math.max(0, depth));
    if (immediate) this.depth = this.depthTarget;
  }

  /** Pointer position in −1..1 on each axis (hero mode only). */
  setPointer(x: number, y: number) {
    this.pointerTarget = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
  }

  pulse(kind: PulseKind, now: number) {
    if (kind === 'correct') this.correctAt = now;
    else this.wrongAt = now;
  }

  get fpsCap(): number {
    return this.mode === 'hero' ? 60 : 30;
  }

  /** Whether a frame is due at `now` (ms), honouring the frame-rate cap. */
  due(now: number): boolean {
    return now - this.lastFrame >= 1000 / this.fpsCap - 2;
  }

  /**
   * Records that a frame was drawn at `now` and adapts the resolution: frames that arrive much
   * later than the cap allows mean the GPU is struggling, so the scale steps down; a long run of
   * on-time frames lets it step back up.
   */
  recordFrame(now: number) {
    const delta = now - this.lastFrame;
    this.lastFrame = now;
    if (!Number.isFinite(delta) || delta > 250) return; // first frame, or resumed after a pause
    const budget = 1000 / this.fpsCap;
    if (delta > budget * 1.35) {
      this.fastFrames = 0;
      if (++this.slowFrames >= 6 && this.scale > MIN_SCALE) {
        this.scale = Math.max(MIN_SCALE, this.scale - 0.1);
        this.slowFrames = 0;
      }
    } else {
      this.slowFrames = Math.max(0, this.slowFrames - 1);
      if (++this.fastFrames >= 120 && this.scale < MAX_SCALE) {
        this.scale = Math.min(MAX_SCALE, this.scale + 0.05);
        this.fastFrames = 0;
      }
    }
  }

  /** Canvas pixel size for a CSS size and device pixel ratio. */
  resolution(cssWidth: number, cssHeight: number, dpr: number): [number, number] {
    const k = Math.min(dpr, MAX_DPR) * this.scale;
    return [Math.max(1, Math.round(cssWidth * k)), Math.max(1, Math.round(cssHeight * k))];
  }

  /** Frame parameters at `now` ms; `seconds` drives slow drift (frozen for still images). */
  frame(now: number, seconds: number): FrameParams {
    const dt = Number.isFinite(this.lastTick) ? Math.min(0.1, (now - this.lastTick) / 1000) : 0;
    this.lastTick = now;
    this.depth += (this.depthTarget - this.depth) * (1 - Math.exp(-dt / 1.2));
    const follow = 1 - Math.exp(-dt / 0.45);
    const hero = this.mode === 'hero';
    this.pointer = [
      this.pointer[0] + ((hero ? this.pointerTarget[0] : 0) - this.pointer[0]) * follow,
      this.pointer[1] + ((hero ? this.pointerTarget[1] : 0) - this.pointer[1]) * follow,
    ];

    const correct = envelope(now - this.correctAt, CORRECT_MS);
    const wrongAge = (now - this.wrongAt) / WRONG_MS;
    const drift = driftOffset(seconds);
    const c: Complex = [
      DEFAULT_JULIA_C[0] + drift[0] + this.pointer[0] * 0.02,
      DEFAULT_JULIA_C[1] + drift[1] + this.pointer[1] * 0.02,
    ];
    const zoom = depthToZoom(this.depth) * breathe(seconds) * (1 + 0.04 * correct);
    const view = viewAt(framing(this.kind, c), zoom);
    this.frameCount++;
    return {
      kind: this.kind,
      center: [
        view.center[0] - this.pointer[0] * 0.02 * view.halfHeight,
        view.center[1] - this.pointer[1] * 0.02 * view.halfHeight,
      ],
      halfHeight: view.halfHeight,
      c,
      relax: [1 + drift[0] * 8, drift[1] * 8],
      maxIter: depthToIterations(this.depth),
      boost: correct,
      ripple: wrongAge >= 0 && wrongAge < 1 ? wrongAge : -1,
      grainSeed: this.frameCount % 1024,
    };
  }
}

/** Quick rise, slow ease-out; 0 outside [0, duration]. */
function envelope(age: number, duration: number): number {
  if (age < 0 || age >= duration) return 0;
  const x = age / duration;
  return x < 0.18 ? x / 0.18 : Math.pow(1 - (x - 0.18) / 0.82, 2);
}
