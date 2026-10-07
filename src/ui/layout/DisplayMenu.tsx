import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { useSettings, type MotionPreference } from '../../data/settings';
import { FRACTAL_KINDS, type FractalKind } from '../../fractal/types';
import { themes } from '../../themes/registry';
import { Icon } from '../primitives/Icon';

const MOTION_OPTIONS: { value: MotionPreference; label: string; hint: string }[] = [
  { value: 'system', label: 'System', hint: 'Follow your device setting' },
  { value: 'full', label: 'Full', hint: 'Live fractal and animation' },
  { value: 'reduced', label: 'Reduced', hint: 'Still fractal, minimal animation' },
];

const KIND_LABELS: Record<FractalKind, string> = {
  julia: 'Julia',
  mandelbrot: 'Mandelbrot',
  'burning-ship': 'Burning Ship',
  newton: 'Newton',
};

/** Header menu: theme, motion level and fractal variant. Changes apply live and persist. */
export function DisplayMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const settings = useSettings();

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((o) => !o);
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm text-fg-muted transition-colors duration-300 hover:border-fg hover:text-fg"
      >
        <Icon name="display" className="text-base" />
        Display
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id={id}
            role="dialog"
            aria-label="Display settings"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-2xl p-5"
          >
            <fieldset>
              <legend className="label-mono mb-3">Theme</legend>
              <div className="grid gap-2">
                {themes.map((theme) => (
                  <label
                    key={theme.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 has-[:checked]:border-line-strong has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
                  >
                    <input
                      type="radio"
                      name={`${id}-theme`}
                      value={theme.id}
                      checked={settings.themeId === theme.id}
                      onChange={() => {
                        settings.setTheme(theme.id);
                      }}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="size-7 shrink-0 rounded-full border border-line-strong"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, ${theme.fractal.paper} 0 18%, ${theme.colors.bg} 62%)`,
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-fg">{theme.name}</span>
                      <span className="block text-xs text-fg-faint">{theme.description}</span>
                    </span>
                    {settings.themeId === theme.id && (
                      <Icon name="check" className="ml-auto shrink-0 text-fg" />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>

            <RadioRow
              legend="Motion"
              name={`${id}-motion`}
              value={settings.motion}
              options={MOTION_OPTIONS}
              onChange={settings.setMotion}
            />
            <RadioRow
              legend="Fractal"
              name={`${id}-kind`}
              value={settings.fractalKind}
              options={FRACTAL_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k], hint: '' }))}
              onChange={settings.setFractalKind}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RadioRowProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string; hint: string }[];
  onChange: (value: T) => void;
}

function RadioRow<T extends string>({ legend, name, value, options, onChange }: RadioRowProps<T>) {
  return (
    <fieldset className="mt-5">
      <legend className="label-mono mb-3">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            title={option.hint || undefined}
            className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-sm text-fg-muted transition-colors has-[:checked]:border-fg has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
