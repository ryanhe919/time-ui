/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 统一导出当前包的对外公共 API。
 */

export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

export const noop = (): void => {};
