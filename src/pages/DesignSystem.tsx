import { useEffect, useId, useState } from 'react';
import { topics } from '../content/curriculum';
import { useSettings } from '../data/settings';
import { depthToIterations, depthToZoom } from '../fractal/math';
import { getTheme } from '../themes/registry';
import { useFractal } from '../ui/fractal/FractalProvider';
import { Thumbnail } from '../ui/fractal/Thumbnail';
import { Tex } from '../ui/math/Tex';
import { Button } from '../ui/primitives/Button';
import { CountUp } from '../ui/primitives/CountUp';
import { Eyebrow } from '../ui/primitives/Eyebrow';
import { Icon } from '../ui/primitives/Icon';
import { Meter } from '../ui/primitives/Meter';
import { Panel } from '../ui/primitives/Panel';
import { ProgressArc } from '../ui/primitives/ProgressArc';

const MATH_SAMPLES = [
  String.raw`8^{\frac{2}{3}} = \left(\sqrt[3]{8}\right)^{2}`,
  String.raw`x = \frac{-b \pm \sqrt{b^{2} - 4ac}}{2a}`,
  String.raw`\frac{3}{4} + \frac{5}{6} = \frac{9}{12} + \frac{10}{12}`,
  String.raw`\log_{b}(xy) = \log_{b} x + \log_{b} y`,
  String.raw`\sqrt{12} = 2\sqrt{3}`,
  String.raw`\int_{0}^{1} x^{2}\,dx`,
];

/**
 * The design system on one page: tokens, type, surfaces, controls, maths and the fractal engine.
 * Used to review every theme; switch themes from the Display menu.
 */
export function DesignSystem() {
  const themeId = useSettings((s) => s.themeId);
  const theme = getTheme(themeId);
  const { setPreviewDepth, pulse, depth, live } = useFractal();
  const [preview, setPreview] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const sliderId = useId();

  useEffect(() => {
    setPreviewDepth(preview);
  }, [preview, setPreviewDepth]);
  useEffect(
    () => () => {
      setPreviewDepth(null);
    },
    [setPreviewDepth],
  );

  const tokens = Object.entries(theme.colors);
  const sampleTopics = topics.filter((_, i) => i % 13 === 0).slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-4 pb-24 sm:px-8">
      <header>
        <Eyebrow>Design system · {theme.name}</Eyebrow>
        <div className="scrim mt-5 max-w-3xl">
          <h1 className="text-[clamp(2.8rem,7vw,5rem)] text-fg">Monochrome fractal</h1>
          <p className="mt-4 font-display text-[1.6rem] leading-snug text-fg-muted">
            Black, white and every grey between. Emphasis comes from luminance, glow and sheen.
          </p>
        </div>
      </header>

      <Section title="Fractal engine">
        <Panel className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <label htmlFor={sliderId} className="label-mono">
              Depth preview
            </label>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={preview}
              onChange={(e) => {
                setPreview(Number(e.target.value));
              }}
              aria-valuetext={`${depthToZoom(preview).toFixed(1)} times`}
              className="mt-3 w-full accent-[var(--c-accent)]"
            />
            <p className="mt-2 font-mono text-sm text-fg-muted tabular-nums">
              Zoom {depthToZoom(depth).toFixed(1)}× · {depthToIterations(depth)} iterations ·{' '}
              {live ? 'live renderer' : 'still image'}
            </p>
            <p className="mt-3 text-sm text-fg-faint">
              Depth follows overall mastery. This slider previews it; leaving the page restores it.
            </p>
          </div>
          <div>
            <p className="label-mono">Feedback</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  pulse('correct');
                  setFeedback('correct');
                }}
              >
                Simulate correct
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  pulse('wrong');
                  setFeedback('wrong');
                }}
              >
                Simulate wrong
              </Button>
            </div>
            <p role="status" className="mt-4 flex min-h-6 items-center gap-2 text-fg">
              {feedback === 'correct' && (
                <>
                  <Icon name="check" /> Correct. The fractal deepens and brightens briefly.
                </>
              )}
              {feedback === 'wrong' && (
                <>
                  <Icon name="cross" /> Not quite. A soft ripple dims the fractal.
                </>
              )}
            </p>
          </div>
        </Panel>
      </Section>

      <Section title="Typography">
        <Panel className="space-y-6 p-6">
          <p className="font-display text-6xl text-fg">Display, Instrument Serif</p>
          <p className="font-display text-3xl text-fg-muted italic">
            Large, confident headings with generous space.
          </p>
          <p className="measure text-fg">
            Body text is Geist in a soft off-white, set to a measure of about 65 characters with a
            line height of 1.65 for long study sessions. It never uses pure white on black.
          </p>
          <p className="label-mono">Labels and stage numbers · JetBrains Mono</p>
        </Panel>
      </Section>

      <Section title="Mathematics (KaTeX, with MathML for screen readers)">
        <Panel className="grid gap-6 p-6 md:grid-cols-2">
          {MATH_SAMPLES.map((tex) => (
            <Tex key={tex} tex={tex} display className="text-fg" />
          ))}
        </Panel>
      </Section>

      <Section title="Controls and meters">
        <Panel className="flex flex-wrap items-center gap-6 p-6">
          <Button>
            Primary <Icon name="arrowRight" />
          </Button>
          <Button variant="ghost">Secondary</Button>
          <Button disabled>Disabled</Button>
          <Meter value={0.62} label="Example mastery" valueText="62 %" />
          <ProgressArc value={0.4} label="Example progress, 40 percent" />
          <span className="font-display text-4xl text-fg">
            <CountUp value={1280} />
          </span>
        </Panel>
      </Section>

      <Section title="Topic fingerprints (untouched → mastered)">
        <Panel className="grid grid-cols-3 gap-4 p-6 sm:grid-cols-6">
          {sampleTopics.map((t, i) => (
            <figure key={t.id} className="group text-center">
              <Thumbnail
                topicId={t.id}
                size={256}
                lit={i / (sampleTopics.length - 1)}
                className="aspect-square w-full rounded-xl"
              />
              <figcaption className="mt-2 font-mono text-[0.65rem] text-fg-faint">
                lit {(i / (sampleTopics.length - 1)).toFixed(1)}
              </figcaption>
            </figure>
          ))}
        </Panel>
      </Section>

      <Section title={`Tokens · ${theme.name}`}>
        <Panel className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map(([name, value]) => (
            <div key={name} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-9 shrink-0 rounded-lg border border-line-strong"
                style={{ background: value }}
              />
              <span className="min-w-0">
                <span className="block text-sm text-fg">{name}</span>
                <span className="block font-mono text-xs text-fg-faint">{value}</span>
              </span>
            </div>
          ))}
        </Panel>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4">
        <Eyebrow>{title}</Eyebrow>
      </h2>
      {children}
    </section>
  );
}
