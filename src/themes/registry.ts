import type { Theme } from './types';

const modules = import.meta.glob<{ default: Theme }>('./*.theme.ts', { eager: true });

/** Display order: the default first, then alphabetical. */
export const DEFAULT_THEME_ID = 'obsidian';

export const themes: readonly Theme[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) =>
    a.id === DEFAULT_THEME_ID ? -1 : b.id === DEFAULT_THEME_ID ? 1 : a.name.localeCompare(b.name),
  );

export function getTheme(id: string): Theme {
  const found = themes.find((t) => t.id === id) ?? themes.find((t) => t.id === DEFAULT_THEME_ID);
  if (!found) throw new Error('No themes registered');
  return found;
}
