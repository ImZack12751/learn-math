import { ButtonLink } from '../ui/primitives/Button';
import { Eyebrow } from '../ui/primitives/Eyebrow';

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-start justify-center px-4 sm:px-8">
      <Eyebrow>Not found</Eyebrow>
      <div className="scrim mt-4">
        <h1 className="text-5xl text-fg">This page does not exist</h1>
        <p className="mt-3 font-display text-2xl text-fg-muted">The link may be out of date.</p>
      </div>
      <ButtonLink to="/" className="mt-8">
        Back to the start
      </ButtonLink>
    </div>
  );
}
