/**
 * @timeui/utils — pure, tree-shakable helpers.
 */

export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

export const noop = (): void => {
  /* intentionally empty */
};
