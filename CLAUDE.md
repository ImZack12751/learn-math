# CLAUDE.md: Iterate

Iterate is a premium, local-first web app for relearning school mathematics from first
principles: arithmetic through algebra, functions, trigonometry, precalculus and single-variable
calculus (AP Calculus BC / IB Maths AA HL standard), plus an optional advanced stage. Nine stages
in total. Stages 1 to 3 are built first, but the data model, stage map, diagnostic and math engine
are designed for all nine. Full design: `ARCHITECTURE.md`. Writing rules: `CONTENT_GUIDE.md`.
Read both before non-trivial work.

## Non-negotiables

- **Mathematical correctness.** Every worked example, solution, hint and numeric claim is
  produced or verified by code. No hand-typed, unverified numbers. Solutions come from
  deterministic code or authored data, never from a language model at runtime.
- **Offline and self-contained.** No runtime network calls, CDNs, external fonts, videos or APIs.
  Everything is bundled. Works installed as a PWA with no connection.
- **No caret notation in the UI.** All maths is typeset with KaTeX (display) or MathLive (input).
  The plain-text input fallback shows a live typeset preview.
- **Monochrome only.** Black, white and greys. No hue-based accents. Emphasis through luminance,
  glow, sheen. All values come from the active theme file.
- **Colour is never the only signal.** Correct and wrong always also use an icon and text.
- **Respect reduced motion** everywhere (fractal becomes a still, no parallax).
- **WCAG 2.2 AA** in every theme; full keyboard use; screen-reader labels for maths and controls.
- **Pedagogy:** first principles, skip no steps, define every term at first use, never refer to
  anything not yet taught, explain what / why / where people go wrong.
- **Conventions:** IB MYP terminology, British spelling (see CONTENT_GUIDE section 2).

## Architecture rules

- Stack: Vite, React 19, TypeScript strict (pinned 6.0.x), React Router, Tailwind 4 with CSS
  variable tokens, `motion`, MDX, KaTeX, MathLive, Compute Engine (via `src/engine/ce-adapter.ts`
  only), Zustand, Dexie, vite-plugin-pwa, Vitest, Playwright.
- Module boundaries: `engine`, `generators`, `learning` are pure (no React, DOM, Dexie). `fractal`
  and `themes` are standalone. Enforced by ESLint.
- A topic = one curriculum entry + one generator file + one MDX file. Nothing else.
- A theme = one `src/themes/<id>.theme.ts` file. Nothing else.
- The answer checker parses with Compute Engine's raw LaTeX parser (no evaluation), then works on
  the engine's own tree: exact rationals for numbers, seeded sampling over the stated domain for
  expressions, form checks on the tree exactly as written. It never uses CE's `isEqual`.
- A generator must pass `auditGenerator` for 1,000 seeds per difficulty (`npm run verify:content`).
  If it fails, fix the generator; never loosen the audit.
- Deployed to GitHub Pages at base `/learn-math/`.
- The fractal maths lives in `src/fractal/math.ts` + `shade.ts` and is mirrored in
  `shaders/fractal.frag.glsl`. Change both together and bump `RENDER_VERSION` in `stills.ts`.
- Text over the fractal must sit on a panel, a glass `Eyebrow`, a `.scrim` (large text only) or
  the header/footer bands. `themes.test.ts` proves each of those passes WCAG in every theme.

## Commands

- `npm run dev`: dev server. `npm run build`: renders fractal images, builds, writes 404.html.
- `npm run ci`: everything CI runs. Locally with a preinstalled Chromium:
  `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run ci`.

## Workflow

- Build in checkpoints (a) to (f) from the brief; **stop for the owner's review at each
  checkpoint**. Report what was built, which tests pass, what is uncertain, what is next.
- Ask before any significant decision not covered by the docs.
- `npm run ci` must pass before every push: lint, typecheck, Vitest (including 1,000 seeds per
  difficulty per generator), `verify:content`, build, Playwright smoke.
- Never loosen a test to make it pass; fix the generator or the code.
- No dead code. Prettier formatting. Small focused commits.

## Status

- [x] Plan: ARCHITECTURE.md, CONTENT_GUIDE.md, CLAUDE.md (approved 2026-10-07)
- [x] (a) Design system, themes, fractal engine, landing page (approved)
- [x] (b) Math engine, test suite, CI (awaiting review)
- [ ] (c) Vertical slice: `s2-fractional-exponents` (stop for approval)
- [ ] (d) Learning system
- [ ] (e) Content: Stage 1, Stage 2, Stage 3 in batches (Stages 4 to 9 later, same process)
- [ ] (f) Polish, accessibility, performance, PWA
