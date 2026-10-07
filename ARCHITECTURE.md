# Iterate: Architecture

Status: **proposal for review** (pre-checkpoint (a)). Nothing here is built yet.
Decisions marked **[confirm]** need the owner's sign-off before the matching checkpoint.

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
5. **One visual language.** Monochrome only. Every colour, ramp, blur and easing curve comes
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
  relies on `isEqual` alone.** Value equivalence is decided by our own randomised numeric
  sampling over compiled functions (section 7.3); exact comparison is a fast path only.
- Canonical parsing evaluates numbers (`2^3 \cdot 3^2` becomes `72`), so canonical form must
  never be used for form checks. Form checks run on the non-canonical tree after our own light
  normalisation (removing `Delimiter` wrappers, folding `InvisibleOperator`).
- The library is pre-1.0 and changes quickly. It is pinned to an exact version and used only
  through `src/engine/ce-adapter.ts`. Upgrading means changing one file and re-running the full
  generator suite.

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
│  │  ├─ primitives/             Button, Panel, Dialog, Tabs, Slider, Meter, HoverCard, …
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
type StageId = 1 | 2 | 3;
type TopicId = string;            // kebab case, stage-prefixed: 's2-fractional-exponents'

interface Topic {
  id: TopicId;
  stage: StageId;
  order: number;                  // position within the stage; prerequisites always come first
  title: string;
  summary: string;                // one line, for cards and the palette
  prerequisites: TopicId[];       // direct edges of the prerequisite graph
  estimatedMinutes: number;
  generatorIds: string[];         // skills practised in this topic
  sections: string[];             // anchor ids inside the MDX, for misconception links
}

interface Stage { id: StageId; title: string; topicIds: TopicId[]; }
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
      | 'ordered-pairs' | 'formula';     // 'formula': subject = expression (rearranging)
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

```ts
interface Generator<P> {
  id: string;                     // 's2-fractional-exponents/evaluate'
  version: number;                // bump when output for a seed changes
  topicId: TopicId;
  title: string;                  // skill name shown in practice filters
  sample(rng: Rng, d: Difficulty): P;      // constrained random parameters
  build(p: P, d: Difficulty): Omit<ProblemInstance, 'key' | 'seed'>;   // deterministic
  solveDirectly(p: P): string;             // INDEPENDENT computation of the answer (tests only)
  misconceptions: MisconceptionRule<P>[];
  equivalents(p: P): string[];             // correct rewrites the checker must accept
  nearMisses(p: P): string[];              // plausible wrong answers it must reject
  isDegenerate?(p: P): boolean;            // e.g. trivial or duplicate structure
}

interface MisconceptionRule<P> {
  id: MisconceptionId;            // from content/misconceptions.ts
  produce(p: P): string | null;   // the wrong answer this faulty rule yields (null: not applicable)
  wrongSteps?(p: P): SolutionStep[];   // used for the "fails on purpose" worked example
}
```

`sample` and `build` are separate so authored worked examples can pass hand-picked
parameters through the same `build` code (section 9.2). No worked-example number is typed by
hand.

RNG: `sfc32` seeded from a 32-bit integer; `Rng` exposes `int`, `pick`, `shuffle`,
`nonZeroInt`, `coprimePair` and similar helpers. Generators draw only through `Rng`, so a
seed reproduces exactly the same problem for a given generator version.

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

interface Settings { themeId: string; motion: 'full' | 'reduced' | 'still'; dailyGoalMin: number;
                     lightDayMin: number; fontScale: number; inputMode: 'mathlive' | 'text'; }
```

Dexie tables: `attempts`, `topicProgress`, `reviewCards`, `errorLog`, `studyDays`, `kv`
(settings, diagnostic result, onboarding flags). Schema is versioned; every version bump ships
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
- **Still mode:** a pre-rendered WebP (per theme) replaces the canvas when WebGL2 is missing,
  `prefers-reduced-motion` is set, the Motion setting is "Still", or the Battery Status API
  (Chromium only) reports a low, discharging battery. There is no standard web API for the
  operating system's battery-saver mode, so this is best effort **[confirm acceptable]**.

### 6.4 Precision and the zoom cap

The shader uses 32-bit floats. Precision artifacts (blocky pixels) appear once the view width
falls to roughly 10⁻⁵ to 10⁻⁶ of the base view. Mastery-driven zoom is capped at **1,000×**
(view width ≥ 3 × 10⁻³), well inside float precision, so no double-single or perturbation
tricks are needed. Documented in `src/fractal/README.md` when built.

### 6.5 Depth: progress made visible

`depth = overall mastery ∈ [0, 1]` (share of topics mastered, weighted by current retention).
It maps to zoom `= 1.5 · 1000^depth` (1.5× up to the cap) and iteration budget `64 → 320`.
The dashboard "Depth" readout shows the zoom as a magnification, e.g. "Depth 42×".

### 6.6 Topic fingerprints and thumbnails

- `fingerprint(topicId)`: FNV-1a hash of the id gives an angle θ and a small radius jitter;
  `c = (0.7885 + jitter) · e^{iθ}`. This circle passes close to the Mandelbrot boundary, so
  every topic gets a visually rich, connected-looking Julia set. The function lives in
  `src/fractal/fingerprint.ts` and is shared by the shader and the build script, so the
  thumbnail matches the live header.
- `scripts/render-thumbnails.ts` renders each topic at 256 px and 512 px on the CPU with the
  same smoothing formula, encodes WebP with `sharp`, and also renders one fallback still per
  theme. Runs as `prebuild`.
- Mastery appearance: a CSS filter driven by a variable (`--lit`) from 0.25 (untouched or
  locked, dim and toward black) to 1.0 (mastered, fully lit). Hover lifts brightness slightly.

---

## 7. Math engine and answer checking

### 7.1 Input

- **MathLive field** (default on desktop and touch): emits LaTeX. Virtual keyboard only on
  touch devices. MathLive fonts are bundled and pointed to with `fontsDirectory`; sounds off.
  Lazy-loaded the first time an answer box appears.
- **Plain-text fallback**: accepts typed forms like `x^(1/2)`, `sqrt(x)`, `2/4`, `3x+2`,
  converted by `engine/plain-to-latex.ts`. A live KaTeX preview always shows the typeset
  result, so the app never displays caret notation. Typing `^` in this field is the only
  place the character exists **[confirm acceptable]**.

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

1. **Pure numbers**: exact comparison with our own `bigint` rational and surd arithmetic
   where both sides are rational or simple surds; otherwise high-precision comparison through
   Compute Engine with relative tolerance 10⁻¹².
2. **Expressions**: fast path, Compute Engine canonical `isSame` / `isEqual === true`.
   Otherwise compile both to JS functions and sample 32 random points inside `domain`
   (skipping points where either side is undefined or non-real). Equivalent if at least 20
   valid points agree within relative tolerance 10⁻⁹. Points are drawn from a seeded RNG, so
   checks are reproducible.
3. **Domain restrictions**: the stated domain decides sampling. Example: with `x > 0` stated,
   `\sqrt{x^2}` and `x` are equivalent; without it they are not (sampling negative x exposes
   the difference). Algebraic-fraction answers accept a cancelled form when the question says
   to simplify.
4. **Equations and solution sets**: solutions are compared as multisets of exact values,
   order-insensitive (`x = 2, x = -3` equals `x = -3 \text{ or } x = 2`).
5. **Inequalities**: compared as intervals (endpoint values plus open/closed ends), so
   `-2 < x \le 3` equals `3 \ge x > -2`.
6. **Formulae** (rearranging): the learner's answer must isolate the subject; the right-hand
   side is compared to the canonical one as an expression with the stated domain.

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
- **Diagnostic placement:** adaptive, about 25 to 35 questions. Starts at a mid-stage topic at
  difficulty 2; correct answers move to harder topics and mark prerequisites as probably strong,
  wrong answers move down the prerequisite graph. Each topic ends as strong, shaky or weak. The
  proposed route is the topological order of shaky and weak topics. Accept, edit or ignore.
- **Study time:** active time only (visible tab and input within the last 2 minutes). The study
  day rolls over at 04:00 local time **[confirm]**. A day counts for the streak if the daily goal is
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

- **Generator suite** (`src/generators/**/*.test.ts`, shared harness): for every generator, for
  each difficulty, 1,000 seeds. Asserts: `solveDirectly` equals the canonical answer; last
  solution step equals the answer; checker accepts the canonical answer and every
  `equivalents`; checker rejects every misconception output (and tags it correctly) and every
  `nearMisses`; `isDegenerate` is false; no duplicate problems inside any generated set of 20.
  Budget: under 5 minutes in CI, kept affordable by compiled sampling.
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

## 14. Open questions and risks

1. **[confirm]** IB MYP's official notation list sits in the subject guide behind the IB
   Programme Resource Centre and could not be accessed. Conventions in CONTENT_GUIDE section 2
   are inferred; please correct anything your school does differently.
2. **[confirm]** Proposed topic splits (CONTENT_GUIDE section 8): "changing the subject" as three
   topics, factorising as three, algebraic fractions as two, logs as three.
3. **[confirm]** "Subject appears twice" in Stage 2 requires taking out a common factor, which is
   formally a Stage 3 topic. Proposal: teach "taking out a single common factor" as the reverse
   of expanding at the end of `s2-expanding-single-brackets`.
4. Compute Engine is pre-1.0; mitigated by the adapter, the exact pin and the generator suite.
5. Scope: 51 topics is a large amount of verified content. Batches report verification output
   as specified.
