import { motion } from 'motion/react';

interface Branch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The first `count` branches of a binary tree, breadth first: trunk, then two, then four, ... */
function branches(count: number): Branch[] {
  const out: Branch[] = [];
  const queue: { x: number; y: number; angle: number; length: number }[] = [
    { x: 50, y: 96, angle: -Math.PI / 2, length: 26 },
  ];
  while (out.length < count && queue.length > 0) {
    const node = queue.shift();
    if (!node) break;
    const x2 = node.x + Math.cos(node.angle) * node.length;
    const y2 = node.y + Math.sin(node.angle) * node.length;
    out.push({ x1: node.x, y1: node.y, x2, y2 });
    for (const turn of [-0.45, 0.45]) {
      queue.push({ x: x2, y: y2, angle: node.angle + turn, length: node.length * 0.72 });
    }
  }
  return out;
}

/** A small tree that grows one branch for each correct answer in this session. */
export function TreeGlyph({ correct }: { correct: number }) {
  const shown = branches(Math.min(correct, 31));
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-16"
      role="img"
      aria-label={`${correct} correct ${correct === 1 ? 'answer' : 'answers'} this session`}
    >
      <line x1="30" y1="96" x2="70" y2="96" stroke="var(--c-line-strong)" strokeWidth="1" />
      {shown.map((b, i) => (
        <motion.line
          key={i}
          x1={b.x1}
          y1={b.y1}
          x2={b.x2}
          y2={b.y2}
          stroke="var(--c-fg)"
          strokeWidth={Math.max(0.8, 3 - Math.log2(i + 1) * 0.6)}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </svg>
  );
}
