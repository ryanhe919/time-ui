/**
 * `useControllableState` — unifies the controlled / uncontrolled pattern
 * every form component ends up reimplementing.
 *
 * Rules (aligned with React Aria, Radix, HeroUI):
 * - If `value !== undefined`, the hook returns `value` verbatim on every
 *   render and the setter delegates purely to `onChange` (no internal state
 *   is ever written).
 * - Otherwise the hook owns an internal `useState(defaultValue)` and the
 *   setter writes to both internal state and `onChange`.
 *
 * Dev-mode warnings (stripped by bundlers via `process.env.NODE_ENV` dead
 * code elimination):
 * - If `value` AND `defaultValue` are both supplied on the first render,
 *   warn once.
 * - If the component transitions between controlled and uncontrolled modes
 *   between renders, warn once.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { isDev } from './env';

export interface UseControllableStateOptions<T> {
  /** Controlled value. When defined, the hook reports it verbatim. */
  value?: T;
  /** Initial value used only in uncontrolled mode. */
  defaultValue: T;
  /** Change callback fired in both controlled and uncontrolled modes. */
  onChange?: (value: T) => void;
  /** Optional component name — improves dev warnings. */
  name?: string;
}

/**
 * Drop-in replacement for `useState` that supports both controlled and
 * uncontrolled usage. Returns `[state, setState]`.
 */
export function useControllableState<T>(
  opts: UseControllableStateOptions<T>,
): [T, (next: T) => void] {
  const { value, defaultValue, onChange, name } = opts;

  const [internal, setInternal] = useState<T>(defaultValue);

  const isControlled = value !== undefined;
  const current: T = isControlled ? (value as T) : internal;

  // Latest-ref pattern so the returned setter is stable across renders while
  // still reading the freshest props on every invocation.
  const onChangeRef = useRef(onChange);
  const isControlledRef = useRef(isControlled);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    isControlledRef.current = isControlled;
  }, [isControlled]);

  // Dev warning: `value` + `defaultValue` together on first mount.
  const warnedBothRef = useRef(false);
  useEffect(() => {
    if (!isDev) return;
    if (warnedBothRef.current) return;
    if (value !== undefined && defaultValue !== undefined) {
      warnedBothRef.current = true;

      console.warn(
        `[TimeUI] ${name ?? 'useControllableState'}: received both \`value\` and \`defaultValue\`. ` +
          'Components must be either controlled or uncontrolled — `defaultValue` will be ignored.',
      );
    }
    // We only want this to fire once on mount — deliberately empty deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev warning: controlled ↔ uncontrolled transition.
  const firstControlledRef = useRef(isControlled);
  const warnedFlipRef = useRef(false);
  useEffect(() => {
    if (!isDev) return;
    if (warnedFlipRef.current) return;
    if (firstControlledRef.current !== isControlled) {
      warnedFlipRef.current = true;

      console.warn(
        `[TimeUI] ${name ?? 'useControllableState'}: a component is changing from ` +
          `${firstControlledRef.current ? 'controlled' : 'uncontrolled'} to ` +
          `${isControlled ? 'controlled' : 'uncontrolled'}. ` +
          'Decide between using a controlled or uncontrolled component for the lifetime of the component.',
      );
    }
  }, [isControlled, name]);

  const setState = useCallback((next: T) => {
    if (isControlledRef.current) {
      // Controlled — caller owns the state; we only notify.
      onChangeRef.current?.(next);
      return;
    }
    // Uncontrolled — write-through + notify.
    setInternal(next);
    onChangeRef.current?.(next);
  }, []);

  return [current, setState];
}
