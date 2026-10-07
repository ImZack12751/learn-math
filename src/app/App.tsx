import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { Landing } from '../pages/Landing';
import { NotFound } from '../pages/NotFound';
import { FractalProvider } from '../ui/fractal/FractalProvider';
import { AppShell } from '../ui/layout/AppShell';
import { ThemeSync } from '../ui/theme/ThemeSync';

// Routes other than the landing page are split out, so KaTeX and lesson code load on demand.
const TopicPage = lazy(() => import('../pages/TopicPage').then((m) => ({ default: m.TopicPage })));
const DesignSystem = lazy(() =>
  import('../pages/DesignSystem').then((m) => ({ default: m.DesignSystem })),
);

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

function AnimatedRoutes() {
  const location = useLocation();

  // After navigating (not on first load): start at the top and move focus to the content, so
  // keyboard and screen-reader users land on the new page rather than the old link.
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (location.hash) return;
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.995 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<div className="min-h-[60dvh]" />}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/topic/:id" element={<TopicPage />} />
            <Route path="/design" element={<DesignSystem />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <ThemeSync>
        <FractalProvider>
          <AppShell>
            <AnimatedRoutes />
          </AppShell>
        </FractalProvider>
      </ThemeSync>
    </BrowserRouter>
  );
}
