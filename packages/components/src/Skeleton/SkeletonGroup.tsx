/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 SkeletonGroup 组件：通过 Context 给后代统一传递 loaded / animation。
 */

'use client';

import { createContext, forwardRef, useContext, useMemo } from 'react';
import { css, useTheme } from '@emotion/react';
import type { SkeletonAnimation, SkeletonGroupProps } from './Skeleton.types';

export interface SkeletonGroupContextValue {
  isLoaded?: boolean;
  animation?: SkeletonAnimation;
}

export const SkeletonGroupContext = createContext<SkeletonGroupContextValue | null>(null);

export const useSkeletonGroup = (): SkeletonGroupContextValue | null =>
  useContext(SkeletonGroupContext);

export const SkeletonGroup = forwardRef<HTMLDivElement, SkeletonGroupProps>(function SkeletonGroup(
  { isLoaded, animation, children, className },
  ref,
) {
  const theme = useTheme();
  const value = useMemo<SkeletonGroupContextValue>(
    () => ({ isLoaded, animation }),
    [isLoaded, animation],
  );
  return (
    <SkeletonGroupContext.Provider value={value}>
      <div
        ref={ref}
        className={className}
        data-skeleton-group
        data-loaded={isLoaded || undefined}
        css={css`
          display: flex;
          flex-direction: column;
          gap: ${theme.components.skeleton.groupGap};
        `}
      >
        {children}
      </div>
    </SkeletonGroupContext.Provider>
  );
});

(SkeletonGroup as unknown as { displayName: string }).displayName = 'TimeUI.SkeletonGroup';
