/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 提供受控值的 debounce 派生，用于把高频输入（如搜索框击键）压成低频副作用。
 */

import { useEffect, useState } from 'react';

/**
 * 返回 `value` 的 debounce 版本。
 *
 * `delayMs <= 0` 时退化为直通（同步返回最新值），便于测试与"不需要节流"的场景，
 * 避免调用方为了关掉 debounce 而分叉出两条代码路径。
 */
export function useDebouncedValue<T>(value: T, delayMs = 0): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return delayMs <= 0 ? value : debounced;
}
