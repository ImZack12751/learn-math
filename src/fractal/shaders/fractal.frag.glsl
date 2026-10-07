#version 300 es
// Mirrors src/fractal/math.ts (samplePoint) and src/fractal/shade.ts (shade). Keep them in step.
precision highp float;
precision highp int;

out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uHalf;
uniform int uKind; // 0 julia, 1 mandelbrot, 2 burning ship, 3 newton
uniform vec2 uC;
uniform vec2 uRelax;
uniform int uMaxIter;
uniform vec2 uRamp[8];
uniform int uRampCount;
uniform float uInterior;
uniform float uInteriorDetail;
uniform float uGlow;
uniform float uGrain;
uniform float uVignette;
uniform float uHalo;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uBoost;
uniform float uRipple;
uniform float uGrainSeed;

const int MAX_ITER = 512;
const float ESCAPE_RADIUS = 64.0;
const float SMOOTH_NORMALISER = 256.0;
const float NEWTON_TOLERANCE = 1e-3;

vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 cdiv(vec2 a, vec2 b) { return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b); }

float ramp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec2 prev = uRamp[0];
  if (t <= prev.x) return prev.y;
  for (int i = 1; i < 8; i++) {
    if (i >= uRampCount) break;
    vec2 next = uRamp[i];
    if (t <= next.x) {
      return mix(prev.y, next.y, smoothstep(0.0, 1.0, (t - prev.x) / max(next.x - prev.x, 1e-5)));
    }
    prev = next;
  }
  return prev.y;
}

// Returns (t, de, root). t < 0 means inside the set, and then the second component is the orbit
// trap (closest approach to 0). Otherwise de < 0 means no distance estimate.
vec3 escapeTime(vec2 p) {
  bool julia = uKind == 0;
  vec2 z = julia ? p : vec2(0.0);
  vec2 c = julia ? uC : (uKind == 2 ? vec2(p.x, -p.y) : p);
  vec2 dz = julia ? vec2(1.0, 0.0) : vec2(0.0);
  float bailout = ESCAPE_RADIUS * ESCAPE_RADIUS;
  float trap = 1e20;
  for (int n = 0; n < MAX_ITER; n++) {
    if (n >= uMaxIter) break;
    if (uKind == 2) z = abs(z);
    dz = 2.0 * cmul(z, dz) + (julia ? vec2(0.0) : vec2(1.0, 0.0));
    z = cmul(z, z) + c;
    float r2 = dot(z, z);
    trap = min(trap, r2);
    if (r2 > bailout) {
      float logZ = 0.5 * log(r2);
      float nu = float(n) + 2.0 - log2(logZ / log(ESCAPE_RADIUS));
      float t = log2(1.0 + max(0.0, nu)) / log2(1.0 + SMOOTH_NORMALISER);
      float de = uKind == 2 ? -1.0 : 0.5 * sqrt(r2) * logZ / max(length(dz), 1e-30);
      return vec3(min(1.0, t), de, -1.0);
    }
  }
  return vec3(-1.0, sqrt(trap), -1.0);
}

vec3 newton(vec2 p) {
  const vec2 r0 = vec2(1.0, 0.0);
  const vec2 r1 = vec2(-0.5, 0.8660254037844386);
  const vec2 r2 = vec2(-0.5, -0.8660254037844386);
  float bias = 2.85 * max(0.0, log2(0.936 / uHalf));
  vec2 z = p;
  int limit = min(uMaxIter, 64);
  for (int n = 0; n < 64; n++) {
    if (n >= limit) break;
    vec2 z2 = cmul(z, z);
    vec2 z3 = cmul(z2, z);
    z -= cmul(uRelax, cdiv(z3 - vec2(1.0, 0.0), 3.0 * z2));
    float d0 = length(z - r0);
    float d1 = length(z - r1);
    float d2 = length(z - r2);
    float d = min(d0, min(d1, d2));
    if (d < NEWTON_TOLERANCE) {
      float root = d == d0 ? 0.0 : (d == d1 ? 1.0 : 2.0);
      float nu = float(n) + 1.0 - log2(log(max(d, 1e-30)) / log(NEWTON_TOLERANCE));
      return vec3(1.0 - exp(-max(0.0, nu - bias) * 0.16), -1.0, root);
    }
  }
  return vec3(-1.0, 0.0, -1.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  vec2 p = uCenter + uv * 2.0 * uHalf;
  float pixel = 2.0 * uHalf / uResolution.y;
  vec3 s = uKind == 3 ? newton(p) : escapeTime(p);

  float start = ramp(0.0);
  float end = ramp(1.0);
  float lum;
  if (s.x < 0.0) {
    float k = min(1.0, s.y * 2.5);
    lum = uInterior + (end - uInterior) * uInteriorDetail * (1.0 - k * k * (3.0 - 2.0 * k));
  } else {
    lum = ramp(pow(s.x, 1.0 - 0.3 * uBoost));
    if (s.y >= 0.0) {
      float g = exp(-s.y / (pixel * 6.0));
      lum += (end - lum) * uGlow * g;
    }
    if (s.z >= 0.0) lum = start + (lum - start) * (0.8 + 0.1 * s.z);
  }
  float r = length(uv);
  lum += (end - start) * uHalo * exp(-r * r * 3.0);
  float v = smoothstep(0.0, 1.0, (r - 0.35) / 0.75);
  lum += (start - lum) * uVignette * v;
  if (uRipple >= 0.0) {
    float ring = exp(-pow((r - uRipple * 1.4) / 0.22, 2.0)) * (1.0 - uRipple);
    lum += (start - lum) * (ring * 0.45 + 0.12 * (1.0 - uRipple));
  }
  lum += (hash12(gl_FragCoord.xy + uGrainSeed * 17.0) - 0.5) * uGrain;
  outColor = vec4(mix(uInk, uPaper, clamp(lum, 0.0, 1.0)), 1.0);
}
