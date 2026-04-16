/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Utils 组件的核心渲染与交互逻辑。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { isDev } from './env';

export interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
  name?: string;
}

export function useControllableState<T>(
  opts: UseControllableStateOptions<T>,
): [T, (next: T) => void] {
  const { value, defaultValue, onChange, name } = opts;

  const [internal, setInternal] = useState<T>(defaultValue);

  const isControlled = value !== undefined;
  const current: T = isControlled ? (value as T) : internal;

  const onChangeRef = useRef(onChange);
  const isControlledRef = useRef(isControlled);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    isControlledRef.current = isControlled;
  }, [isControlled]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      onChangeRef.current?.(next);
      return;
    }
    setInternal(next);
    onChangeRef.current?.(next);
  }, []);

  return [current, setState];
}
