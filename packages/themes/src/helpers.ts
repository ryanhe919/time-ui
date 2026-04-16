import type { TimeUITheme } from './types';

/** Dot-delimited path into a nested object. */
export type Path = string;

function getAtPath(obj: unknown, path: Path): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Resolve a token path against a theme object.
 *
 * ```ts
 * token(theme, 'colors.bg.surface'); // → '#ffffff'
 * ```
 */
export function token(theme: TimeUITheme, path: Path): string | number | undefined {
  const value = getAtPath(theme, path);
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

/**
 * Convert a token path to a CSS custom-property name.
 *
 * ```ts
 * cssVar('colors.bg.surface'); // → 'var(--timeui-colors-bg-surface)'
 * ```
 *
 * Useful if you opt into CSS-variables theming later; TimeUI itself does not
 * require CSS variables — Emotion props power the runtime.
 */
export function cssVar(path: Path, prefix = 'timeui'): string {
  const name = path.replace(/\./g, '-').replace(/[^a-zA-Z0-9-]/g, '-');
  return `var(--${prefix}-${name})`;
}
