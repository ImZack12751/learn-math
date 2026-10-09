import { useId, useState } from 'react';
import { exactRoot, Q } from '../../engine/rational';
import { Tex } from '../math/Tex';
import { ChipGroup } from '../primitives/ChipGroup';

const BASES = [4, 8, 9, 16, 27, 64, 81];

/** Step counts n (2 to 6) for which the base has a whole-number nth root. */
function stepChoices(base: number): number[] {
  return [2, 3, 4, 5, 6].filter((n) => exactRoot(Q.of(base), n)?.isInteger);
}

/**
 * Why a^(1/n) is the nth root: climbing from a⁰ = 1 to a¹ = a in n equal exponent steps, every
 * step must multiply by the same number r, and n of them make a, so rⁿ = a. All values are
 * computed exactly here, never typed in.
 */
export function PowerLadder({ initialBase = 8 }: { initialBase?: number }) {
  const [base, setBase] = useState(initialBase);
  const choices = stepChoices(base);
  const [steps, setSteps] = useState(choices[0] ?? 2);
  const n = choices.includes(steps) ? steps : (choices[0] ?? 2);
  const r = exactRoot(Q.of(base), n) ?? Q.of(1);
  const rungs = Array.from({ length: n + 1 }, (_, k) => ({
    exponent: Q.of(k, n),
    value: r.pow(k),
  }));
  const captionId = useId();

  return (
    <figure className="my-6 rounded-2xl border border-line p-5" aria-labelledby={captionId}>
      <div className="flex flex-wrap gap-6">
        <ChipGroup
          legend="Base"
          value={String(base)}
          options={BASES.map((b) => ({ value: String(b), label: String(b) }))}
          onChange={(v) => {
            setBase(Number(v));
          }}
        />
        <ChipGroup
          legend="Equal steps from 0 to 1"
          value={String(n)}
          options={choices.map((c) => ({ value: String(c), label: String(c) }))}
          onChange={(v) => {
            setSteps(Number(v));
          }}
        />
      </div>

      <table className="mt-6 w-full border-collapse text-left">
        <caption id={captionId} className="mb-3 text-left text-sm text-fg-muted">
          Climbing from <Tex tex={`${base}^{0} = 1`} /> to <Tex tex={`${base}^{1} = ${base}`} /> in{' '}
          {n} equal steps of the exponent. Each step multiplies by <Tex tex={r.toLatex()} />.
        </caption>
        <thead>
          <tr className="label-mono">
            <th scope="col" className="py-2 font-normal">
              Exponent
            </th>
            <th scope="col" className="py-2 font-normal">
              Power
            </th>
            <th scope="col" className="py-2 font-normal">
              Value
            </th>
            <th scope="col" className="py-2 font-normal">
              <span className="sr-only">Step</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rungs.map((rung, k) => (
            <tr key={k} className="border-t border-line">
              <td className="py-2 text-fg">
                <Tex tex={rung.exponent.toLatex()} />
              </td>
              <td className="py-2 text-fg">
                <Tex tex={`${base}^{${rung.exponent.toLatex()}}`} />
              </td>
              <td className="py-2 font-medium text-fg">
                <Tex tex={rung.value.toLatex()} />
              </td>
              <td className="py-2 text-sm text-fg-faint">
                {k > 0 && <Tex tex={`\\times ${r.toLatex()}`} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-fg">
        So <Tex tex={`${base}^{\\frac{1}{${n}}} = ${r.toLatex()}`} />, because{' '}
        <Tex tex={`${Array.from({ length: n }, () => r.toLatex()).join(' \\times ')} = ${base}`} />.
      </p>
    </figure>
  );
}
