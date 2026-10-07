/** Thin WebGL2 wrapper: one program, one full-screen triangle, uniforms per frame. */
import fragmentSource from './shaders/fractal.frag.glsl?raw';
import vertexSource from './shaders/fullscreen.vert.glsl?raw';
import { hexToRgb } from './math';
import { FRACTAL_KINDS, MAX_RAMP_STOPS, type FractalStyle, type FrameParams } from './types';

const UNIFORMS = [
  'uResolution',
  'uCenter',
  'uHalf',
  'uKind',
  'uC',
  'uRelax',
  'uMaxIter',
  'uRamp',
  'uRampCount',
  'uInterior',
  'uInteriorDetail',
  'uGlow',
  'uGrain',
  'uVignette',
  'uHalo',
  'uInk',
  'uPaper',
  'uBoost',
  'uRipple',
  'uGrainSeed',
] as const;

type Uniform = (typeof UNIFORMS)[number];

export class WebGLUnavailableError extends Error {}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new WebGLUnavailableError('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader compile failed: ${gl.getShaderInfoLog(shader) ?? ''}`);
  }
  return shader;
}

export class FractalRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly loc: Record<Uniform, WebGLUniformLocation | null>;
  private style: FractalStyle | null = null;
  /** Fence after the last frame: at most one frame is ever in flight on the GPU. */
  private fence: WebGLSync | null = null;

  constructor(private readonly canvas: HTMLCanvasElement | OffscreenCanvas) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new WebGLUnavailableError('WebGL2 is not available');
    this.gl = gl;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(program) ?? ''}`);
    }
    gl.useProgram(program);
    gl.bindVertexArray(gl.createVertexArray());
    this.loc = Object.fromEntries(
      UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
    ) as Record<Uniform, WebGLUniformLocation | null>;
  }

  get lost(): boolean {
    return this.gl.isContextLost();
  }

  /**
   * True while the GPU is still drawing the previous frame. The host skips frames until it is
   * done, so a slow GPU (software WebGL) never builds up a backlog that holds back the page.
   */
  get busy(): boolean {
    const { gl, fence } = this;
    if (!fence) return false;
    if (gl.getSyncParameter(fence, gl.SYNC_STATUS) !== gl.SIGNALED) return true;
    gl.deleteSync(fence);
    this.fence = null;
    return false;
  }

  setStyle(style: FractalStyle) {
    this.style = style;
    const { gl, loc } = this;
    const ramp = new Float32Array(MAX_RAMP_STOPS * 2);
    style.ramp.slice(0, MAX_RAMP_STOPS).forEach(([pos, lum], i) => {
      ramp[i * 2] = pos;
      ramp[i * 2 + 1] = lum;
    });
    gl.uniform2fv(loc.uRamp, ramp);
    gl.uniform1i(loc.uRampCount, Math.min(style.ramp.length, MAX_RAMP_STOPS));
    gl.uniform1f(loc.uInterior, style.interior);
    gl.uniform1f(loc.uInteriorDetail, style.interiorDetail);
    gl.uniform1f(loc.uGlow, style.glow);
    gl.uniform1f(loc.uGrain, style.grain);
    gl.uniform1f(loc.uVignette, style.vignette);
    gl.uniform1f(loc.uHalo, style.halo);
    gl.uniform3fv(loc.uInk, hexToRgb(style.ink));
    gl.uniform3fv(loc.uPaper, hexToRgb(style.paper));
  }

  draw(params: FrameParams, width: number, height: number) {
    if (!this.style) return;
    const { gl, loc, canvas } = this;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.uniform2f(loc.uResolution, width, height);
    gl.uniform2f(loc.uCenter, params.center[0], params.center[1]);
    gl.uniform1f(loc.uHalf, params.halfHeight);
    gl.uniform1i(loc.uKind, FRACTAL_KINDS.indexOf(params.kind));
    gl.uniform2f(loc.uC, params.c[0], params.c[1]);
    gl.uniform2f(loc.uRelax, params.relax[0], params.relax[1]);
    gl.uniform1i(loc.uMaxIter, params.maxIter);
    gl.uniform1f(loc.uBoost, params.boost);
    gl.uniform1f(loc.uRipple, params.ripple);
    gl.uniform1f(loc.uGrainSeed, params.grainSeed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
  }
}
