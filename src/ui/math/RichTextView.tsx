import type { RichText } from '../../engine/types';
import { Tex } from './Tex';

/** Text and inline maths runs, as generators produce them. */
export function RichTextView({ value }: { value: RichText }) {
  return (
    <>
      {value.map((run, i) =>
        run.t === 'text' ? <span key={i}>{run.v}</span> : <Tex key={i} tex={run.v} />,
      )}
    </>
  );
}
