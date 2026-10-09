import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { FractalBackground } from '../fractal/FractalBackground';
import { DisplayMenu } from './DisplayMenu';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <FractalBackground />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="no-print band-top sticky top-0 z-40">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-5 pb-8 sm:px-8">
            <Link
              to="/"
              className="group flex items-baseline gap-3 rounded-md text-fg"
              aria-label="Iterate, home"
            >
              <span className="font-display text-[1.7rem] leading-none italic">Iterate</span>
            </Link>
            <nav aria-label="Main" className="flex items-center gap-2">
              <Link
                to="/#stages"
                className="glass inline-flex min-h-11 items-center rounded-full px-4 text-sm text-fg-muted transition-colors duration-300 hover:text-fg"
              >
                Topics
              </Link>
              <DisplayMenu />
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <footer className="no-print band-bottom">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pt-10 pb-6 text-xs text-fg-faint sm:px-8">
            <span>Works offline. Your progress stays on this device.</span>
            <Link to="/design" className="rounded underline-offset-4 hover:text-fg hover:underline">
              Design system
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
