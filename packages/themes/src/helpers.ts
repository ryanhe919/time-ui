/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现主题模块 helpers。
 */

import type { TimeUITheme } from './types';

export type Path = string;

function getAtPath(obj: unknown, path: Path): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function token(theme: TimeUITheme, path: Path): string | number | undefined {
  const value = getAtPath(theme, path);
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

export function cssVar(path: Path, prefix = 'timeui'): string {
  const name = path.replace(/\./g, '-').replace(/[^a-zA-Z0-9-]/g, '-');
  return `var(--${prefix}-${name})`;
}
