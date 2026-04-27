/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Empty 组件的对外类型契约。
 */

import type { ReactNode } from 'react';

export type EmptySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type EmptyImagePreset = 'default' | 'search' | 'error' | 'no-data';

export interface EmptyProps {
  image?: ReactNode | EmptyImagePreset;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  size?: EmptySize;
  variant?: 'default' | 'inline';
  className?: string;
  children?: ReactNode;
}
