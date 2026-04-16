import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import type { ThemeOverrides, ThemeMode, TimeUITheme } from './types';

type AnyRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is AnyRecord {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Deep-merge `source` into `target`, returning a new object. Arrays are replaced. */
function deepMerge<T>(target: T, source: unknown): T {
  if (!isPlainObject(source)) return target;
  if (!isPlainObject(target)) return source as T;

  const out: AnyRecord = { ...(target as AnyRecord) };
  for (const key of Object.keys(source)) {
    const sv = (source as AnyRecord)[key];
    const tv = (target as AnyRecord)[key];
    if (isPlainObject(sv) && isPlainObject(tv)) {
      out[key] = deepMerge(tv, sv);
    } else if (sv !== undefined) {
      out[key] = sv;
    }
  }
  return out as T;
}

export interface CreateThemeOptions extends ThemeOverrides {
  /** Base theme to extend. Defaults to `lightTheme` (or `darkTheme` if `mode: 'dark'`). */
  base?: TimeUITheme | ThemeMode;
}

/**
 * Build a custom theme by deep-merging overrides on top of a base theme.
 *
 * ```ts
 * const brand = createTheme({
 *   colors: { action: { primary: { default: '#ff00aa' } } },
 * });
 * ```
 */
export function createTheme(overrides: CreateThemeOptions = {}): TimeUITheme {
  const { base, ...rest } = overrides;
  const baseTheme: TimeUITheme =
    base === 'dark' ? darkTheme : base === 'light' || base === undefined ? lightTheme : base;
  return deepMerge(baseTheme, rest);
}
