/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Skeleton / SkeletonGroup 组件的对外类型契约。
 */

import type { ReactNode } from 'react';

export type SkeletonShape = 'rect' | 'circle' | 'text';
export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';

export interface SkeletonProps {
  shape?: SkeletonShape;
  width?: number | string;
  height?: number | string;
  lines?: number;
  radius?: number | string;
  animation?: SkeletonAnimation;
  isLoaded?: boolean;
  children?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export interface SkeletonGroupProps {
  isLoaded?: boolean;
  animation?: SkeletonAnimation;
  children?: ReactNode;
  className?: string;
}
