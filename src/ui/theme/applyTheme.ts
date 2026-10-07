import type { Theme } from '../../themes/types';

/** Key read by the inline boot script in index.html to paint the background before JS loads. */
export const BOOT_KEY = 'iterate:boot';

/** Writes a theme's tokens onto <html> as CSS variables. Live: no reload needed. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const c = theme.colors;
  const vars: Record<string, string> = {
    '--c-bg': c.bg,
    '--c-fg': c.fg,
    '--c-fg-muted': c.fgMuted,
    '--c-fg-faint': c.fgFaint,
    '--c-line': c.line,
    '--c-line-strong': c.lineStrong,
    '--c-focus': c.focus,
    '--c-panel': c.panel,
    '--c-panel-highlight': c.panelHighlight,
    '--c-accent': c.accent,
    '--c-accent-fg': c.accentFg,
    '--panel-opacity': String(theme.panel.opacity),
    '--panel-blur': `${theme.panel.blur}px`,
    '--panel-glow': String(theme.panel.glow),
    '--scrim': String(theme.scrim),
    '--thumb-filter': theme.thumbnailFilter,
    '--ease': `cubic-bezier(${theme.motion.ease.join(', ')})`,
    '--dur-scale': String(theme.motion.durationScale),
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg);
  try {
    localStorage.setItem(BOOT_KEY, JSON.stringify({ bg: c.bg, fg: c.fg, scheme: theme.scheme }));
  } catch {
    // Storage can be unavailable (private mode); the boot paint then falls back to Obsidian.
  }
}
