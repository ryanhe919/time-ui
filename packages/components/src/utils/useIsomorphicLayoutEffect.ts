/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Utils 组件的核心渲染与交互逻辑。
 */

import { useEffect, useLayoutEffect } from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
