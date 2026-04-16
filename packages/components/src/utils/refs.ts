/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Utils 组件的核心渲染与交互逻辑。
 */

import type { MutableRefObject, Ref } from 'react';

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as MutableRefObject<T | null>).current = node;
      }
    }
  };
}
