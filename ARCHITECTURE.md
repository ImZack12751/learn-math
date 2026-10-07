# Iterate: Architecture

Status: **approved 2026-10-07**, including every item that was marked [confirm].

Scope: nine stages, from arithmetic to single-variable calculus (AP Calculus BC / IB Maths AA HL)
and an optional advanced stage. Stages 1 to 3 are built first. The data model, stage map,
diagnostic and math engine are designed for all nine from the start.

---

## 1. Principles

1. **Correctness first.** Every number a learner sees in a worked example, solution, hint or
   verified claim is produced or checked by code at build time. A failing check fails the build.
2. **Local-first and self-contained.** No network calls at runtime. Fonts, KaTeX, MathLive,
   shaders, thumbnails and content are bundled. The app keeps working offline for years with
   no server.
3. **Strict module boundaries.** Pure logic (engine, generators, learning) has no React and no
   DOM, so it is fast to test and impossible to couple to the UI by accident.
4. **Content is data.** Adding a topic means adding one MDX file, one generator file and one
   curriculum entry, and nothing else.
5. **Designed for nine stages.** Nothing in the data model, stage map, diagnostic or engine
   assumes the curriculum stops at Stage 3. Later stages are added as data and content only.
6. **One visual language.** Monochrome only. Every colour, ramp, blur and easing curve comes
   from the active theme file.

---

## 2. Technology decisions

Versions are the current releases as of 2026-10-07; exact versions are pinned in
`package.json` and only changed deliberately.

| Concern | Choice | Why |
|---|---|---|
| Build | Vite 8 | Fast, first-class TS, MDX and PWA plugins. |
| UI | React 19 + TypeScript 6.0 (strict) | TypeScript 7 exists, but `typescript-eslint` currently supports `<6.1`, so 6.0.x is pinned. |
| Routing | React Router 8 (`BrowserRouter` with `basename`) | See section 11 for the GitHub Pages fallback. |
| Styling | Tailwind CSS 4 | v4 is configured in CSS (`@theme`), so design tokens are plain CSS variables that themes overwrite live. |
| Motion | `motion` (the current package name of Framer Motion) | Same API (`motion/react`). |
| Content | MDX 3 (`@mdx-js/rollup`) with custom components | |
| Math display | KaTeX 0.19, bundled, `output: 'htmlAndMathml'` | Real typesetting plus MathML for screen readers. |
| Math input | MathLive 0.111, bundled and lazy-loaded | Virtual keyboard on touch devices only. Plain-text fallback field. |
| Symbolic engine | **Cortex Compute Engine** (see 2.1) | |
| State | Zustand 5 (UI and session state) | |
| Persistence | Dexie 4 over IndexedDB | Versioned schema with migrations. |
| Import validation | `zod` | Validates imported progress files before anything is written. |
| PWA | `vite-plugin-pwa` 2 (Workbox `generateSW`, precache everything) | |
| Fractals | Raw WebGL2 fragment shaders, rendered in a Worker via `OffscreenCanvas` where supported | Keeps the UI thread free (section 6). |
| Thumbnails | Node script: CPU renderer (same maths as the shader) and `sharp` to encode WebP | No headless GPU needed in CI. |
| Command palette | `cmdk` | Small, accessible, unstyled. |
| Charts and diagrams | In-house SVG components | Small bundle, fully monochrome, theme-aware. |
| Unit tests | Vitest 5 | |
| E2E | Playwright 1.63 (Chromium) | |
| Lint and format | ESLint 10 + `typescript-eslint`, Prettier | Import-boundary rules enforce section 4. |
| Fonts (Fontsource, self-hosted) | Instrument Serif (display), Geist Variable (UI and body), JetBrains Mono Variable (labels) | Instrument Serif ships regular and italic only; display headings use size, not weight, for hierarchy. |

### 2.1 Symbolic engine: Compute Engine, wrapped

I prototyped both options against the cases the checker must handle before choosing.

**Compute Engine** (`@cortex-js/compute-engine`, MIT, actively maintained):

- Parses LaTeX natively. MathLive (same author) emits LaTeX, so input goes straight in with no
  translation layer.
- `parse(latex, { canonical: false })` keeps the learner's exact structure: `\frac{6}{8}` stays
  `["Divide", 6, 8]` and `\sqrt{12}` stays `["Sqrt", 12]`. This is what form checking
  ("fully simplified", "simplest surd") needs.
- Canonical parsing proves many identities exactly: `x^{1/2} ≡ \sqrt{x}`, `\frac24 ≡ \frac12`,
  `\frac{1}{\sqrt2} ≡ \frac{\sqrt2}{2}`, `\sqrt{12} ≡ 2\sqrt3`, `x^{-2} ≡ \frac{1}{x^2}`.
- `compile()` turns an expression into a JavaScript function. Measured: 100,000 evaluations in
  about 33 ms, against about 0.7 ms per evaluation through `subs().N()`. Fast numeric sampling
  makes the 1,000-seeds-per-difficulty test suite affordable.

Limitations found, and how the design handles them:

- `isEqual` returns `undefined` (unknown) for polynomial identities such as
  `(x+1)(x-2)` vs `x^2-x-2`, and for `\sqrt[3]{x^2}` vs `x^{2/3}`. **The checker therefore never
  relies on `isEqual`.** Value equivalence is decided by exact rational arithmetic and our own
  seeded numeric sampling (section 7.3).
- Even the engine's non-canonical parse evaluates some input (`3.2\times10^{4}` becomes 32000,
  `0.\overline{3}` becomes ⅓), which would hide the form the learner wrote.
- The library is pre-1.0 and changes quickly. It is pinned to an exact version and used only
  through `src/engine/ce-adapter.ts`. Upgrading means changing one file and re-running the full
  generator suite.

**As built (checkpoint b):** the checker uses Compute Engine's standalone LaTeX parser
(`@cortex-js/compute-engine/latex-syntax`), which returns raw MathJSON with no evaluation at all:
`\frac{6}{8}`, `\sqrt{12}`, `2\frac{1}{3}` and `3.2\times10^{4}` (as the literal `"3.2e4"`) all
survive exactly as written. `src/engine/ast.ts` converts that into the engine's own small tree,
and everything after parsing is ours: exact `bigint` rationals for numbers, compiled closures for
sampling (well under a microsecond per evaluation), polynomial arithmetic for factorised and
expanded forms. Parsing costs about 0.04 ms, and the full audit of a generator (1,000 seeds × 3
difficulties, every check in section 12) takes about 3 seconds. The full engine (simplification,
calculus) remains available through the adapter for later stages.

**mathjs + nerdamer**, rejected: mathjs has no LaTeX parser (MathLive output would need a
custom LaTeX-to-mathjs translator, which is itself a correctness risk); nerdamer is a separate
symbolic layer with a different expression model, so we would maintain two trees and a bridge.
mathjs's `simplify` also normalises structure, which hides the learner's form.

---

## 3. Folder structure

```
/
├─ CLAUDE.md                     Rules for every working session
├─ ARCHITECTURE.md               This file
├─ CONTENT_GUIDE.md              How to write topics, examples, generators
├─ .github/workflows/ci.yml      Verify (lint, types, tests, content, build, e2e) then deploy to Pages
├─ public/                       Static assets copied as-is (icons, manifest images)
├─ scripts/
│  ├─ render-thumbnails.ts       Topic fingerprints and per-theme fallback stills to WebP
│  ├─ verify-content.ts          Build-time content verification (section 9.3)
│  └─ spa-fallback.ts            Copies dist/index.html to dist/404.html for GitHub Pages
├─ src/
│  ├─ app/                       main.tsx, router, providers, error boundary, layout shell
│  ├─ engine/                    PURE. Parsing, normalisation, equivalence, form analysis,
│  │                             exact rationals, seeded RNG, LaTeX builders, CE adapter
│  ├─ generators/                PURE. One file per topic, plus shared step builders
│  │  ├─ _shared/                Step builders, constraint helpers, number pickers
│  │  ├─ stage1/ stage2/ stage3/
│  │  └─ registry.ts             Collects all generators (import.meta.glob)
│  ├─ content/
│  │  ├─ curriculum.ts           Stages, topics, prerequisite graph (THE data entry)
│  │  ├─ glossary.ts             Every term, plain-language definition, where first taught
│  │  ├─ misconceptions.ts       Misconception catalogue (id, name, faulty rule, fix)
│  │  └─ topics/stage1|2|3/*.mdx One MDX file per topic
│  ├─ learning/                  PURE. Mastery, SM-2 scheduler, session builder, interleaving,
│  │                             diagnostic, streaks, study-time aggregation
│  ├─ data/                      Dexie schema and migrations, repositories, Zustand stores,
│  │                             export and import
│  ├─ fractal/                   WebGL2 renderer, worker, shaders/*.glsl, drift, depth mapping,
│  │                             fingerprint.ts (shared with the thumbnail script)
│  ├─ themes/                    *.theme.ts (one file per theme), types, registry, applier
│  ├─ ui/
│  │  ├─ primitives/             Button, Panel, Eyebrow, Icon, Meter, ProgressArc, CountUp, …
│  │  ├─ theme/                  Theme applier, ThemeSync, reduced-motion hook
│  │  ├─ fractal/                FractalProvider, FractalBackground, Thumbnail
│  │  ├─ layout/                 AppShell, DisplayMenu
│  │  ├─ math/                   <Tex>, <MathInput> (MathLive + plain text), answer preview
│  │  ├─ mdx/                    Callout, WorkedExample, Practice, Visual, Misconception,
│  │  │                          Takeaways, Prereq, Term, Claim, Interactive
│  │  ├─ diagrams/               NumberLine, AreaModel, BalanceScale, FractionBar, Graph, …
│  │  ├─ charts/                 Heatmap, Bars, Arc, Sparkline (dashboard)
│  │  └─ feedback/               Result banner, tree glyph, pulse bridge to the fractal
│  ├─ pages/                     Route components (section 10)
│  └─ styles/                    Tailwind entry, base layers, print stylesheet
└─ tests/
   ├─ e2e/                       Playwright smoke tests
   └─ fixtures/
```

Unit tests sit next to the code they test (`*.test.ts`).

---

## 4. Module boundaries

```
engine  <-  generators  <-  content  <-  ui / pages / app
   ^            ^              ^
   └── learning ┘              │
fractal (standalone)  ─────────┘ (used by ui)
themes  (standalone, used by ui and fractal)
data    (uses learning and engine types; used by ui)
```

- `engine`, `generators` and `learning` may not import React, the DOM, Dexie or anything under
  `ui`, `pages`, `data`, `fractal`, `themes`.
- `fractal` knows nothing about topics except `fingerprint(topicId)` and a `depth` number.
- `content` MDX may only import from `ui/mdx` and `ui/diagrams`.
- Enforced with ESLint `no-restricted-imports` zones; CI fails on violations.

---

## 5. Data models

TypeScript sketches. Field names are final unless review changes them.

### 5.1 Curriculum

```ts
type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type TopicId = string;            // kebab case, stage-prefixed: 's2-fractional-exponents'

interface TopicEntry {            // what curriculum.ts records
  id: TopicId;
  title: string;
  summary?: string;               // one line, for cards and the palette; required once built
  prerequisites: TopicId[];       // direct edges of the prerequisite graph
  minutes?: number;               // estimated time; required once built
}

interface Topic extends TopicEntry {
  stage: StageId;                 // derived from the stage it is listed under
  order: number;                  // derived from its position; prerequisites always come first
}

interface StageEntry {
  id: StageId;
  title: string;
  tagline: string;
  prerequisiteStages: StageId[];  // Stage 7 requires 4 and 5; Stage 6 only requires 5
  optional: boolean;              // Stage 9
  topics: TopicEntry[];           // in study order
}
```

The whole nine-stage curriculum is recorded in `curriculum.ts` from day one: every topic of
Stages 4 to 9 exists as an entry with its title and provisional prerequisites. This
gives the stage map, the depth readout and the diagnostic their full shape now. Stage-level
prerequisites are a partial order, not a line: Stage 6 can be studied in any order with Stages
7, but Stage 8 needs Stage 6 (Riemann sums use sigma notation, series build on geometric
series, parametric calculus builds on parametric curves). A topic is *available* when its MDX
lesson exists; that is derived from the content files, not stored. When a later stage is
built, its prerequisites are reviewed. Generator ids and section anchors are found
through the generator registry and the MDX, not repeated in the entry.

```ts
```

### 5.2 Problems

```ts
type Difficulty = 1 | 2 | 3;      // 1 foundation, 2 standard, 3 harder variant

interface ProblemInstance {
  key: string;                    // `${generatorId}@v${version}:${difficulty}:${seed}`
  generatorId: string;
  topicId: TopicId;
  difficulty: Difficulty;
  seed: number;                   // uint32
  prompt: RichText;               // text runs and LaTeX runs, never caret notation
  answer: AnswerSpec;
  steps: SolutionStep[];          // last step's math equals answer.canonical (tested)
  hints: [Hint, Hint, Hint];      // nudge, method, first step
}

type RichText = Array<{ t: 'text'; v: string } | { t: 'math'; v: string /* LaTeX */ }>;

interface SolutionStep { math: string; reason: string; }
interface Hint { level: 'nudge' | 'method' | 'first-step'; body: RichText; }

interface AnswerSpec {
  kind: 'number' | 'expression' | 'equation' | 'solution-set' | 'inequality'
      | 'ordered-pairs' | 'formula'      // 'formula': subject = expression (rearranging)
      // Later stages (the checker is designed for these now, implemented with their stage):
      | 'interval' | 'point' | 'function' | 'complex' | 'vector' | 'matrix'
      | 'limit'                          // a value, ±∞ or "does not exist"
      | 'antiderivative'                 // equal up to an additive constant
      | 'ode-solution';                  // checked by substitution into the equation
  canonical: string;                      // LaTeX of the canonical answer
  variables: string[];
  domain: DomainSpec;                     // where numeric sampling is valid
  form: FormRequirement[];                // empty means any equivalent form is accepted
  accuracy?: { sf?: number; dp?: number };// only when the question asks for rounding
  subject?: string;                       // for 'formula'
}

type FormRequirement =
  | 'simplified-fraction' | 'improper-fraction' | 'mixed-number' | 'decimal'
  | 'factorised' | 'expanded' | 'collected'
  | 'simplest-surd' | 'rationalised-denominator'
  | 'positive-exponents' | 'single-power' | 'exponent-form' | 'radical-form'
  | 'standard-form';                      // scientific notation (IB: "standard form")

interface DomainSpec {
  ranges: Record<string, [number, number]>;
  exclude?: string[];                     // LaTeX conditions, e.g. 'x \\ne 2'
  positive?: string[];                    // variables assumed > 0 (stated in the question)
  integer?: string[];
}
```

### 5.3 Generators

As built in `src/generators/types.ts`:

```ts
interface Generator<P> {
  id: string;                     // 's2-fractional-exponents/evaluate' (topic id + '/' + skill)
  version: number;                // bump when output for a seed changes
  topicId: TopicId;
  title: string;                  // skill name shown in practice filters
  sample(rng: Rng, d: Difficulty): P;              // constrained random parameters
  build(p: P, d: Difficulty): BuiltProblem;        // prompt, answer spec, steps, three hints
  solveDirectly(p: P): string;                     // INDEPENDENT computation of the answer
  misconceptions: { id: MisconceptionId; produce(p: P): string | null }[];
  equivalents(p: P): string[];                     // correct rewrites the checker must accept
  nearMisses(p: P): string[];                      // plausible wrong answers it must reject
  isDegenerate?(p: P): boolean;
}
```

A misconception's `produce` returns null when, for these parameters, the faulty rule happens to
give the right answer. A topic file exports `generators` (each wrapped in `defineGenerator`);
`src/generators/registry.ts` discovers them, so no list is edited by hand.

`sample` and `build` are separate so authored worked examples can pass hand-picked
parameters through the same `build` code (section 9.2). No worked-example number is typed by
hand.

RNG: `sfc32` seeded through splitmix32. `Rng` exposes `int`, `intExcept`, `nonZero`, `sign`,
`bool`, `pick` and `shuffle`. Each generator and difficulty draws from its own stream, so a seed
reproduces exactly the same problem for a given generator version. `buildSet` assembles sets
(practice, reviews, tests) from derived seeds and skips any repeat, so a set never contains the
same problem twice.

### 5.4 Learning records (IndexedDB)

```ts
interface Attempt {
  id: string; at: number;                 // epoch ms
  problemKey: string; topicId: TopicId; generatorId: string; difficulty: Difficulty;
  context: 'practice' | 'review' | 'mastery' | 'diagnostic' | 'stage-test'
         | 'check-yourself' | 'worked-example' | 'retry';
  answer: string;                         // learner's LaTeX
  verdict: 'correct' | 'right-value-wrong-form' | 'incorrect' | 'gave-up';
  misconceptionId?: MisconceptionId;
  hintsUsed: 0 | 1 | 2 | 3; solutionViewed: boolean; durationMs: number;
}

interface TopicProgress {
  topicId: TopicId;
  status: 'untouched' | 'learning' | 'mastered' | 'needs-review';
  masteredAt?: number;
  lastMasterySet?: { at: number; correct: number; total: number; byDifficulty: Record<Difficulty, [number, number]> };
  diagnostic?: 'strong' | 'shaky' | 'weak';
}

interface ReviewCard {                    // SM-2 state, one per topic and one per error item
  id: string; kind: 'topic' | 'error'; ref: string;
  ef: number; reps: number; intervalDays: number; due: number; lapses: number;
}

interface ErrorLogEntry {
  id: string; attemptId: string; at: number;
  topicId: TopicId; generatorId: string; difficulty: Difficulty; seed: number;
  snapshot: ProblemInstance;              // stored so later content edits never change history
  answer: string;
  misconceptionId?: MisconceptionId; tags: string[];
  resolvedAt?: number;                    // set after a correct "retry similar"
}

interface StudyDay { date: string /* YYYY-MM-DD, local, 04:00 rollover */; activeMs: number;
                     solved: number; goalMet: boolean; lightDay: boolean; }

interface Settings { themeId: string; motion: 'system' | 'full' | 'reduced';
                     fractalKind: 'julia' | 'mandelbrot' | 'burning-ship' | 'newton';
                     // from checkpoint (d):
                     dailyGoalMin: number; lightDayMin: number; fontScale: number;
                     inputMode: 'mathlive' | 'text'; }
```

Dexie tables: `attempts`, `topicProgress`, `reviewCards`, `errorLog`, `studyDays`, `kv`
(diagnostic result, onboarding flags). `Settings` live in `localStorage` (small, and read
synchronously at start-up so the right theme paints on the first frame with no flash); export
and import include them. Schema is versioned; every version bump ships
with an upgrade function and a migration test.

**Export:** one JSON file `{ app: 'iterate', schemaVersion, exportedAt, tables: {...} }`.
**Import:** validated with zod and checked for schema version, then written in one Dexie
transaction (all or nothing). The learner chooses replace or merge (merge keeps the newer
record by id).

---

## 6. Fractal engine

### 6.1 Renderer

- One full-screen `<canvas>`, WebGL2, a single fragment shader with a `uFractal` switch:
  Julia (default), Mandelbrot, Burning Ship, Newton (z³ − 1).
- Smooth (continuous) iteration count `ν = n + 1 − log₂(log |z|)` mapped through a greyscale
  ramp passed as `uniform vec4 uRamp[8]` (position and luminance stops from the theme).
- Optional boundary glow (distance-estimate falloff), film grain (hash noise animated per frame
  at low amplitude), vignette and radial luminance gradient composited in the same pass.
- Runs inside a Web Worker with `OffscreenCanvas` when available, so shader work never blocks
  React. Falls back to the main thread otherwise.

### 6.2 Motion and interaction

- Julia constant drifts on a small closed orbit: `c(t) = c₀ + r·(cos ωt, sin 1.3ωt)` with
  `r ≈ 0.01`. Zoom "breathes" ±3 % over about 40 s.
- On the landing page, pointer position adds parallax (offset ≤ 2 % of view) and nudges `c`
  by ≤ 0.02, eased with a critically damped spring.
- Feedback: `pulse('correct')` briefly raises depth and brightness (≈ 600 ms ease-out);
  `pulse('wrong')` runs a soft dimming ripple from the centre (≈ 500 ms). Never a colour flash.

### 6.3 Performance

- Internal resolution scale adapts between 0.5 and 1.0 from measured frame time (GPU timer
  query when available, otherwise `requestAnimationFrame` deltas), with hysteresis.
- Frame cap: 30 fps by default, 60 fps on the landing hero when frame time allows.
- Pauses when the tab is hidden or the canvas is off screen.
- **One frame in flight:** after each draw the renderer sets a GPU fence and skips frames until
  it signals, so a slow GPU never builds a backlog. This was the root cause of a page held to
  1–9 fps under software WebGL; with it the live fractal runs at a lower rate while the page
  stays at 60 fps.
- **Frame guard** (safety net, `src/ui/fractal/useFrameGuard.ts`): the page's own frame rate is measured on
  the main thread while the fractal runs. Without a capable GPU (software WebGL) the fractal can
  hold back the whole page, which the brief forbids. Below 45 fps for two seconds the renderer
  steps down (lowest resolution, then 30 and 15 fps caps on the hero); below 20 fps it stops and
  the still image takes over. Measured with software WebGL: the page recovers from about 9 fps
  to 60 fps within 3 seconds. A smoke test asserts the page holds at least 40 fps.
- **Still mode:** a pre-rendered WebP (per theme) replaces the canvas when WebGL2 is missing,
  `prefers-reduced-motion` is set, the Motion setting is "Still", or the Battery Status API
  (Chromium only) reports a low, discharging battery. There is no standard web API for the
  operating system's battery-saver mode, so this is best effort (approved).

### 6.4 Precision and the zoom cap

The shader uses 32-bit floats (about 1.2 × 10⁻⁷ relative precision), which turn visibly blocky
once a pixel spans less than about 10⁻⁶ of the plane. Two limits keep the view well inside that:

- Depth zoom runs from 1.5× to **1,000×** of each variant's base view.
- The view's half-height never drops below **1.2 × 10⁻³** (`MIN_HALF_HEIGHT` in
  `src/fractal/math.ts`). At 1,000 px that is a pixel of 2.4 × 10⁻⁶, a margin of about 10×.
  Julia, Mandelbrot and Newton reach 1,000× before this floor; the Burning Ship, framed more
  tightly on its small ships, stops at about 62×.

So no double-single or perturbation tricks are needed. `fractal.test.ts` checks the floor and
that the deepest view of every variant still has visible structure.

### 6.5 Depth: progress made visible

`depth = overall mastery ∈ [0, 1]`: the share of all topics in the nine-stage curriculum
(planned ones included) that are mastered, weighted by current retention. Measuring against the
whole curriculum means depth keeps growing across the full journey and does not drop when a new
stage is released.
It maps to zoom `= 1.5 · (1000 / 1.5)^depth` (1.5× up to the cap) and iteration budget
`96 → 320`. Each variant zooms toward a known boundary point: the Julia set's repelling fixed
point (on the set for every c), the Mandelbrot seahorse valley, a point in the Burning Ship's
mast lattice, and −∛½ for Newton (a preimage of the critical point 0). Newton brightness is
corrected for depth, because convergence slows by about 2.85 iterations per doubling of zoom.
The dashboard "Depth" readout shows the zoom as a magnification, e.g. "Depth 42×".

### 6.6 Topic fingerprints and thumbnails

- `fingerprint(topicId)`: FNV-1a hash of the id gives an angle θ and a scale s ∈ [1.005, 1.04];
  `c = s · (e^{iθ}/2 − e^{2iθ}/4)`, just outside the main cardioid of the Mandelbrot set. Julia
  sets for c there are intricate and well filled, so every topic gets a rich, distinct image. The function lives in
  `src/fractal/fingerprint.ts` and is shared by the shader and the build script, so the
  thumbnail matches the live header.
- `scripts/render-thumbnails.ts` renders each topic at 512 px (2×2 supersampled) on the CPU
  with the same maths as the shader (`math.ts` + `shade.ts`, mirrored in GLSL), writes a 256 px
  copy, and renders a 1600 × 1000 fallback still for every theme and variant. WebP via `sharp`.
  Runs as `prebuild`, skips images that exist for the current `RENDER_VERSION` (about 75 s
  from cold, cached in CI). Output goes to `public/generated/` (not committed).
- Thumbnails are rendered once, light on dark; each theme adapts them with its
  `thumbnailFilter` (Pearl inverts them to dark filaments on off-white).
- Mastery appearance: `--lit` from 0 (untouched or locked: low opacity and contrast, fading
  into the background) to 1 (mastered, fully lit). Hover lifts it slightly.

---

## 7. Math engine and answer checking

### 7.1 Input

- **MathLive field** (default on desktop and touch): emits LaTeX. Virtual keyboard only on
  touch devices. MathLive fonts are bundled and pointed to with `fontsDirectory`; sounds off.
  Lazy-loaded the first time an answer box appears.
- **Plain-text fallback**: accepts typed forms like `x^(1/2)`, `sqrt(x)`, `2/4`, `3x+2`,
  converted by `engine/plain-to-latex.ts`. A live KaTeX preview always shows the typeset
  result, so the app never displays caret notation. Typing `^` in this field is the only
  place the character exists (approved).

### 7.2 Pipeline

```
input LaTeX
 → parse (non-canonical)              ─┐ unparseable → "I couldn't read that" + preview
 → normalise (Delimiter, InvisibleOp)  │
 → value check (7.3)                   │ not equivalent → misconception match (7.5) → incorrect
 → form check (7.4)                    │ wrong form → "right value, but ..." (not counted as correct)
 → correct                            ─┘
```

```ts
interface CheckResult {
  verdict: 'correct' | 'right-value-wrong-form' | 'incorrect' | 'unparseable';
  formIssues: FormIssue[];          // e.g. { req: 'simplified-fraction', message: '6/8 can be simplified' }
  misconceptionId?: MisconceptionId;
  feedback: RichText;
}
function check(input: string, spec: AnswerSpec, rules?: MisconceptionRule[]): CheckResult;
```

### 7.3 Value equivalence

1. **Pure numbers**: exact comparison with `bigint` rationals whenever both sides are rational
   (this covers integer and rational powers and roots that come out exact, mixed numbers and
   recurring decimals); otherwise to 11 significant digits. Rounded answers (`accuracy`) must be
   exactly the canonical value rounded as asked; a value that rounds to it but is written to a
   different accuracy is the right value in the wrong form.
2. **Expressions**: both sides compile to real-valued closures and are compared at seeded random
   points of the stated domain until 40 points agree (at least 20 needed, at most 160 tried).
   Points where both are undefined are skipped; where one is defined and the other is not, the
   answers differ.
3. **Domain restrictions**: the stated domain decides sampling. Example: with `x > 0` stated,
   `\sqrt{x^2}` and `x` are equivalent; without it they are not (sampling negative x exposes
   the difference). `\frac{x^2}{x}` equals `x` because the single bad point is never sampled.
4. **Solution sets**: compared as sets of exact values, order-insensitive, accepting
   `x = 2, x = -3`, `x = -3 \text{ or } x = 2`, bare values, `x = 1 \pm \sqrt{2}` (± expanded,
   also inside fractions) and `\varnothing` or "no solution".
5. **Inequalities**: compared as unions of intervals (endpoint values plus open or closed ends),
   so `-2 < x \le 3` equals `3 \ge x > -2`, and `x < -1 \text{ or } x > 4` is understood.
6. **Ordered pairs**: sets of tuples, from `(1, 2), (-1, 0)` or `x = 2, y = 3`.
7. **Formulae** (rearranging): the subject must stand alone on one side and must not appear on
   the other; that side is compared to the canonical one as an expression.

### 7.3a Later-stage answer kinds

The same two-layer design (exact fast path, then seeded numeric sampling) extends to later
stages: complex answers sample real and imaginary parts; vectors and matrices compare
entry by entry; `antiderivative` answers compare derivatives, or compare differences at sample
points after removing the constant; `limit` answers are exact values, `\infty`, `-\infty` or
"does not exist"; `ode-solution` answers are substituted into the equation and checked at
sample points. Compute Engine already parses and differentiates these forms.

### 7.4 Form checks

Each `FormRequirement` is a small function over the normalised non-canonical tree, e.g.
`simplified-fraction`: every `Divide` of integers has gcd 1 and a positive denominator;
`simplest-surd`: no `Sqrt(n)` where n has a square factor > 1; `rationalised-denominator`: no
root in any denominator; `factorised`: top-level product whose factors are irreducible over the
integers. The question text states every required form ("Give your answer as a fraction in its
simplest form").

### 7.5 Misconception matching

For an incorrect answer, each rule's `produce(params)` is compared with the input using the
same value check. A match names the misconception in the feedback, links to the explanation
section (`topic#section`) and is stored as the error-log tag.

### 7.6 Hints and solutions

Three hint levels (nudge, method, first step) then the full solution, revealed step by step.
All produced by `build()`; no runtime language model. A test asserts the last step equals the
canonical answer for every seed.

---

## 8. Learning system

- **Mastery:** a topic is mastered when a mastery set of at least 10 problems, drawn across all
  three difficulty levels with at least 3 at difficulty 3, scores at least 90 %. Problems where
  the learner viewed the full solution count as incorrect. Status becomes `needs-review` when the
  topic's review card is overdue by more than its current interval (decay).
- **Spaced repetition (SM-2):** cards for topics and for error-log items. Quality score:
  5 correct with no hints, 4 correct after the first hint, 3 correct after the method hint,
  2 right value but wrong form, 1 incorrect, 0 gave up or viewed the solution. Intervals: 1 day,
  then 6 days, then interval × EF; EF updated by the SM-2 formula with a floor of 1.3; a score
  below 3 resets repetitions. A topic review is a short set of fresh problems (new seeds), not
  the same item. An error card's review is "retry similar": same generator and difficulty, new
  seed.
- **Interleaving:** practice and review sessions mix about 30 % problems from earlier topics
  (due or weak first).
- **Diagnostic placement:** adaptive, about 25 to 35 questions over the *available* stages
  (stage-scoped, so it can also be run for a single newly released stage). Starts at a mid-stage topic at
  difficulty 2; correct answers move to harder topics and mark prerequisites as probably strong,
  wrong answers move down the prerequisite graph. Each topic ends as strong, shaky or weak. The
  proposed route is the topological order of shaky and weak topics. Accept, edit or ignore.
- **Study time:** active time only (visible tab and input within the last 2 minutes). The study
  day rolls over at 04:00 local time (approved). A day counts for the streak if the daily goal is
  met, or if light-day mode is on and about 20 minutes of review are done.

---

## 9. Content pipeline

### 9.1 A topic is three things

1. `src/content/curriculum.ts`: one `Topic` entry.
2. `src/generators/stageN/<topic-id>.ts`: generators plus `examples` (authored parameters for
   worked examples).
3. `src/content/topics/stageN/<topic-id>.mdx`: prose, visuals and component placements.

Everything else (route, card, map node, thumbnail, cheat-sheet entry, glossary links,
practice, review) is derived.

### 9.2 Worked examples are data

```ts
export const examples = {
  'fe-ex1': { generator: 'evaluate', params: { base: 8, num: 2, den: 3 }, fade: 'full' },
  'fe-ex2': { generator: 'evaluate', params: { base: 27, num: -2, den: 3 }, fade: 'last-2' },
  'fe-ex3': { generator: 'evaluate', params: { base: 16, num: 3, den: 4 }, fade: 'learner' },
  'fe-wrong': { generator: 'evaluate', params: { base: 8, num: 2, den: 3 },
                misconception: 'frac-exp-multiplies-base' },
} satisfies ExampleSet;
```

In MDX: `<WorkedExample id="fe-ex2" />`. The component runs `build(params)` and hides steps as
`fade` says. The "fails on purpose" example uses the misconception rule's `wrongSteps`.

### 9.3 Build-time verification (`npm run verify:content`)

Fails the build if any of these fail:

- Every worked example builds, its last step equals its answer, and its answer matches
  `solveDirectly`.
- Every `<Claim tex="8^{2/3} = 4" />` in MDX is true (verified by the engine).
- Every `<Term>`, `<Prereq>`, `<WorkedExample>`, misconception id and section anchor resolves.
- The prerequisite graph is acyclic, and every prerequisite comes earlier in curriculum order.
- No topic links to, or uses a glossary term first taught in, a later topic.
- Every topic page has the required sections in the required order (CONTENT_GUIDE section 3).

---

## 10. Pages and routes

| Route | Page |
|---|---|
| `/` | Landing: live hero, continue, today's reviews, streak, progress summary |
| `/map` | Stage map: branching graph, thumbnails as nodes, prerequisite edges |
| `/topic/:id` | Topic page (CONTENT_GUIDE section 3) |
| `/practice` | Practice hub: by topic, by stage, weak spots; difficulty; timed |
| `/review` | Spaced-repetition queue |
| `/errors` | Error log, filter by topic and tag, retry similar |
| `/test/:stage` | Stage test and results breakdown |
| `/dashboard` | Accuracy, heatmap, weak spots, weekly time, streak, solved, depth |
| `/cheatsheet/:stage` | Collated takeaways, printable |
| `/glossary` | All terms |
| `/settings` | Theme, motion, daily goal, light day, font size, input mode, export, import, reset |
| `/diagnostic` | First-run placement test |

Command palette (Ctrl/Cmd + K) is global. Every route is code-split.

---

## 11. Deployment: GitHub Pages

- Vite `base: '/learn-math/'`; router `basename` from `import.meta.env.BASE_URL`.
- GitHub Pages has no SPA rewrite, so `scripts/spa-fallback.ts` copies `index.html` to
  `404.html`. A deep link loads the app, which routes client-side. Once the service worker is
  installed, `navigateFallback` serves the app shell offline for every route.
- `ci.yml`: on every push and PR runs `npm run ci`; on `main` it also deploys `dist/` with
  `actions/deploy-pages`. Pages must be set to "GitHub Actions" in the repository settings
  (one-time, by the owner).

---

## 12. Testing and CI

`npm run ci` = `lint` → `typecheck` → `test` (Vitest) → `verify:content` → `build` → `e2e`.

- **Generator suite** (`src/generators/generators.test.ts`, harness in `harness.ts`): for every
  registered generator, at each difficulty, 1,000 seeds. Asserts: the problem reproduces from its
  seed; prompt, steps (each with a reason) and three ordered hints exist, with no caret notation
  in text; every LaTeX string renders in KaTeX; `solveDirectly` equals the answer; the canonical
  answer passes its own form checks; the last line of working equals the answer; every
  equivalent rewrite is accepted; every misconception answer is rejected and recognised as that
  misconception; every near miss is rejected; parameters are not degenerate; and 20-problem sets
  can be built across the same span with no repeats. The harness's own tests include
  deliberately broken generators to prove each check fires.
- **Test projects:** `npm test` runs the `unit` project (engine, fractal, themes, learning,
  harness); `npm run verify:content` runs the `content` project (curriculum, misconception
  catalogue, the generator suite, and from checkpoint (c) the MDX checks of section 9.3).
  Budget: about 3 s per generator. With about 120 generators planned for Stages 1 to 3 the
  suite will be split per stage so Vitest runs the stages in parallel.
- **Engine tests:** equivalence and form-check tables, including adversarial cases.
- **Learning tests:** SM-2 transitions, mastery rules, decay, streak and light-day edge cases,
  diagnostic routing, export → import round-trip.
- **Theme tests:** WCAG contrast computed for every text and UI token pair in every theme.
- **E2E smoke:** landing loads offline, theme switch, open a topic, answer a problem correctly
  and incorrectly, error log entry appears, export and re-import.

---

## 13. Accessibility and performance budgets

- WCAG 2.2 AA: text contrast ≥ 4.5:1 (≥ 3:1 large text), UI and graphics ≥ 3:1, focus never
  obscured, visible 2 px focus rings with ≥ 3:1 contrast. Panels over the fractal are measured
  against their worst-case background (brightest ramp stop under the panel's blur and opacity).
- KaTeX MathML for screen readers; MathLive has built-in speech output; diagrams have
  `role="img"` with a text description; correct and wrong are always signalled by icon and text
  as well as luminance.
- Lighthouse targets: Performance ≥ 90 desktop and ≥ 80 mid-range phone, Accessibility ≥ 95.
  Initial JS budget about 180 KB gzip (MathLive and Compute Engine lazy-loaded).

---

## 14. Decisions taken and remaining risks

1. **Approved.** IB MYP's official notation list sits in the subject guide behind the IB
   Programme Resource Centre and could not be accessed. Conventions in CONTENT_GUIDE section 2
   are inferred; please correct anything your school does differently.
2. **Approved.** Proposed topic splits (CONTENT_GUIDE section 8): "changing the subject" as three
   topics, factorising as three, algebraic fractions as two, logs as three.
3. **Approved.** "Subject appears twice" in Stage 2 requires taking out a common factor, which is
   formally a Stage 3 topic. Proposal: teach "taking out a single common factor" as the reverse
   of expanding at the end of `s2-expanding-single-brackets`.
4. Compute Engine is pre-1.0; mitigated by the adapter, the exact pin and the generator suite.
5. Scope: 51 topics in Stages 1 to 3, and roughly 120 more in Stages 4 to 9, is a large amount of
   verified content. Batches report verification output as specified.
6. Stage 4 to 9 topic lists and prerequisites in `curriculum.ts` are provisional until each stage
   is built and reviewed.
