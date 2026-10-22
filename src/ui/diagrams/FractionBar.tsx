interface FractionBarProps {
  /** Each bar as [shaded parts, equal parts in the whole]. All bars are the same length. */
  bars: [number, number][];
}

const WIDTH = 600;
const ROW = 46;
const GAP = 14;

const describe = (bars: [number, number][]) =>
  bars
    .map(([n, d]) => `A bar split into ${d} equal parts with ${n} shaded.`)
    .join(' ')
    .concat(bars.length > 1 ? ' All the bars are the same length.' : '');

/**
 * Fraction bars: each whole is the same length, split into equal parts, with the numerator's
 * worth shaded. Stacked bars show when two fractions cover the same amount.
 */
export function FractionBar({ bars }: FractionBarProps) {
  const height = bars.length * ROW + (bars.length - 1) * GAP + 4;
  return (
    <figure className="my-6">
      <svg
        viewBox={`0 0 ${WIDTH + 90} ${height}`}
        role="img"
        aria-label={describe(bars)}
        className="w-full text-fg"
      >
        {bars.map(([n, d], row) => {
          const y = 2 + row * (ROW + GAP);
          const w = WIDTH / d;
          return (
            <g key={row}>
              {Array.from({ length: d }, (_, i) => (
                <rect
                  key={i}
                  x={2 + i * w}
                  y={y}
                  width={w}
                  height={ROW}
                  fill={i < n ? 'currentColor' : 'transparent'}
                  fillOpacity={i < n ? 0.55 : 0}
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              ))}
              <text x={WIDTH + 20} y={y + ROW / 2 + 6} fontSize={18} fill="currentColor">
                {n}/{d}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
