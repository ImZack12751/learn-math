import { useEffect, useId, useRef, useState } from 'react';
import { ParseError } from '../../engine/ast';
import { plainToLatex } from '../../engine/plain';
import { useSettings } from '../../data/settings';
import { asset } from '../asset';
import { Tex } from './Tex';

interface MathInputProps {
  label: string;
  /** Called with LaTeX, or null while the plain-text answer cannot be read. */
  onChange: (latex: string | null) => void;
  onSubmit: () => void;
  /** Changing this clears the field (a new problem). */
  resetKey: string;
  disabled?: boolean;
}

type MathfieldEl = HTMLElement & { value: string };

let mathliveReady: Promise<void> | null = null;

/** Loads MathLive once, on first use, with its fonts served from the app (no CDN). */
function loadMathLive(): Promise<void> {
  mathliveReady ??= import('mathlive').then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = asset('generated/mathlive/fonts');
    MathfieldElement.soundsDirectory = null;
  });
  return mathliveReady;
}

/**
 * Answer input: the MathLive maths field (with its virtual keyboard on touch devices), or plain
 * text with a live typeset preview. The choice is a setting, switchable here.
 */
export function MathInput({
  label,
  onChange,
  onSubmit,
  resetKey,
  disabled = false,
}: MathInputProps) {
  const mode = useSettings((s) => s.inputMode);
  const setMode = useSettings((s) => s.setInputMode);
  return (
    <div>
      {mode === 'mathlive' ? (
        <MathField
          key={resetKey}
          label={label}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      ) : (
        <PlainField
          key={resetKey}
          label={label}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      )}
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'mathlive' ? 'text' : 'mathlive');
        }}
        className="mt-2 rounded text-xs text-fg-faint underline underline-offset-4 hover:text-fg"
      >
        {mode === 'mathlive' ? 'Type as plain text instead' : 'Use the maths field instead'}
      </button>
    </div>
  );
}

type FieldProps = Omit<MathInputProps, 'resetKey'>;

function MathField({ label, onChange, onSubmit, disabled }: FieldProps) {
  const ref = useRef<MathfieldEl>(null);
  const [ready, setReady] = useState(false);
  const callbacks = useRef({ onChange, onSubmit });
  useEffect(() => {
    callbacks.current = { onChange, onSubmit };
  });

  useEffect(() => {
    let cancelled = false;
    void loadMathLive().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const field = ref.current;
    if (!ready || !field) return;
    const onInput = () => {
      const value = field.value.trim();
      callbacks.current.onChange(value === '' ? null : value);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        callbacks.current.onSubmit();
      }
    };
    field.addEventListener('input', onInput);
    field.addEventListener('keydown', onKey);
    return () => {
      field.removeEventListener('input', onInput);
      field.removeEventListener('keydown', onKey);
    };
  }, [ready]);

  if (!ready) {
    return <div className="math-field-shell h-14 animate-pulse" aria-hidden="true" />;
  }
  return (
    <math-field
      ref={ref}
      aria-label={label}
      math-virtual-keyboard-policy="auto"
      className="math-field-shell"
      read-only={disabled ? '' : undefined}
    />
  );
}

function PlainField({ label, onChange, onSubmit, disabled }: FieldProps) {
  const [text, setText] = useState('');
  const id = useId();
  let preview: string | null = null;
  let error: string | null = null;
  if (text.trim() !== '') {
    try {
      preview = plainToLatex(text);
    } catch (e) {
      error = e instanceof ParseError ? e.message : 'This cannot be read yet.';
    }
  }
  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={label}
        aria-describedby={`${id}-preview`}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const value = e.target.value;
          setText(value);
          try {
            onChange(value.trim() === '' ? null : plainToLatex(value));
          } catch {
            onChange(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
        placeholder="e.g. 2/3 or sqrt(x)"
        className="math-field-shell w-full font-mono text-base text-fg placeholder:text-fg-faint"
      />
      <div id={`${id}-preview`} aria-live="polite" className="mt-2 min-h-8 text-fg-muted">
        {preview !== null && (
          <span className="flex items-baseline gap-2">
            <span className="label-mono">Reads as</span>
            <Tex tex={preview} />
          </span>
        )}
        {error !== null && <span className="text-sm text-fg-faint">{error}</span>}
      </div>
    </div>
  );
}
