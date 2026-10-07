import { thumbnailPath } from '../../fractal/stills';
import { asset } from '../asset';

interface ThumbnailProps {
  topicId: string;
  size: 256 | 512;
  /** 0 (untouched or locked: dim, toward the background) to 1 (mastered: fully lit). */
  lit: number;
  className?: string;
}

/** A topic's fractal fingerprint, pre-rendered at build time. Decorative. */
export function Thumbnail({ topicId, size, lit, className = '' }: ThumbnailProps) {
  return (
    <img
      src={asset(thumbnailPath(topicId, size))}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`thumb ${className}`}
      style={{ '--lit': Math.min(1, Math.max(0, lit)) } as React.CSSProperties}
    />
  );
}
