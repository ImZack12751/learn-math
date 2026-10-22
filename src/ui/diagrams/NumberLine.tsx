import { useId, useState } from 'react';
import { ChipGroup } from '../primitives/ChipGroup';

/** A number in labels and descriptions, with a true minus sign. */
const label = (n: number) => String(n).replace('-', '−');

interface NumberLineProps {
  from: number;
  to: number;
  /** Marked points, each with its value printed above. */
  points?: number[];
  /** Moves along the line, drawn as arcs from the first value to the second. */
  jumps?: [number, number][];
}

const WIDTH = 640;
const PAD = 28;
const AXIS_Y = 70;

function describe(from: number, to: number, points: number[], jumps: [number, number][]) {
  const parts = [`A number line from ${label(from)} to ${label(to)}.`];
  if (points.length > 0) parts.push(`Marked: ${points.map(label).join(', ')}.`);
  for (const [a, b] of jumps) {
    const size = Math.abs(b - a);
    parts.push(
      `A move of ${size} ${size === 1 ? 'unit' : 'units'} to the ${b > a ? 'right' : 'left'}, from ${label(a)} to ${label(b)}.`,
    );
  }
  return parts.join(' ');
}

/**
 * The number line: integers evenly spaced, smaller to the left. Points and moves are given as
 * values and placed by computation, so the picture always matches the numbers in the text.
 */
export function NumberLine({ from, to, points = [], jumps = [] }: NumberLineProps) {
  const span = to - from;
  const x = (v: number) => PAD + ((v - from) / span) * (WIDTH - 2 * PAD);
  const ticks = Array.from({ length: span + 1 }, (_, i) => from + i);
  const every = span > 20 ? 5 : span > 12 ? 2 : 1;
  return (
    <figure className="my-6">
      <svg
        viewBox={`0 0 ${WIDTH} 110`}
        role="img"
        aria-label={describe(from, to, points, jumps)}
        className="w-full text-fg"
      >
        <line
          x1={PAD - 16}
          x2={WIDTH - PAD + 16}
          y1={AXIS_Y}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <path
          d={`M ${WIDTH - PAD + 16} ${AXIS_Y} l -8 -5 v 10 z M ${PAD - 16} ${AXIS_Y} l 8 -5 v 10 z`}
          fill="currentColor"
        />
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={AXIS_Y - (t === 0 ? 9 : 6)}
              y2={AXIS_Y + (t === 0 ? 9 : 6)}
              stroke="currentColor"
              strokeWidth={t === 0 ? 2 : 1}
            />
            {(t - from) % every === 0 || t === 0 ? (
              <text
                x={x(t)}
                y={AXIS_Y + 28}
                textAnchor="middle"
                fontSize={15}
                fill="currentColor"
                fontWeight={t === 0 ? 600 : 400}
              >
                {label(t)}
              </text>
            ) : null}
          </g>
        ))}
        {jumps.map(([a, b], i) => {
          const mid = (x(a) + x(b)) / 2;
          const height = Math.min(48, 14 + Math.abs(x(b) - x(a)) / 5);
          const dir = b > a ? -1 : 1;
          return (
            <g key={`j${i}`} fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path
                d={`M ${x(a)} ${AXIS_Y - 4} Q ${mid} ${AXIS_Y - 4 - 2 * height} ${x(b)} ${AXIS_Y - 4}`}
              />
              <path
                d={`M ${x(b)} ${AXIS_Y - 4} l ${dir * 8} -7 M ${x(b)} ${AXIS_Y - 4} l ${dir * 2} -10`}
              />
            </g>
          );
        })}
        {points.map((p) => (
          <g key={`p${p}`}>
            <circle cx={x(p)} cy={AXIS_Y} r={6} fill="currentColor" />
            <text
              x={x(p)}
              y={AXIS_Y - 16}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fill="currentColor"
            >
              {label(p)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

const STARTS = [-5, -3, -1, 0, 2, 4];
const MOVES = [-6, -4, -2, 2, 4, 6];

/**
 * Choose a starting point and a move: right for a positive move, left for a negative one. The
 * finishing point is computed, never typed.
 */
export function NumberLineExplorer() {
  const [start, setStart] = useState(-3);
  const [move, setMove] = useState(4);
  const end = start + move;
  const captionId = useId();
  return (
    <figure className="my-6 rounded-2xl border border-line p-5" aria-labelledby={captionId}>
      <div className="flex flex-wrap gap-6">
        <ChipGroup
          legend="Start at"
          value={String(start)}
          options={STARTS.map((s) => ({ value: String(s), label: label(s) }))}
          onChange={(v) => {
            setStart(Number(v));
          }}
        />
        <ChipGroup
          legend="Move"
          value={String(move)}
          options={MOVES.map((m) => ({
            value: String(m),
            label: m > 0 ? `${m} right` : `${-m} left`,
          }))}
          onChange={(v) => {
            setMove(Number(v));
          }}
        />
      </div>
      <NumberLine from={-12} to={12} points={[start, end]} jumps={[[start, end]]} />
      <figcaption id={captionId} className="text-fg">
        Start at {label(start)}, move {Math.abs(move)} to the {move > 0 ? 'right' : 'left'}, and you
        finish at {label(end)}.
      </figcaption>
    </figure>
  );
}
