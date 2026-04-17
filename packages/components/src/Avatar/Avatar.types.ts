/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Avatar / AvatarGroup 组件的对外类型契约。
 */

import type { ReactNode } from 'react';

export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarColor = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'auto';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  fallbackIcon?: ReactNode;
  size?: AvatarSize | number;
  shape?: AvatarShape;
  color?: AvatarColor;
  status?: AvatarStatus;
  isBordered?: boolean;
  onError?: () => void;
  className?: string;
}

export type AvatarGroupSpacing = 'tight' | 'normal' | 'loose';

export interface AvatarGroupProps {
  max?: number;
  total?: number;
  size?: AvatarProps['size'];
  spacing?: AvatarGroupSpacing;
  renderSurplus?: (count: number) => ReactNode;
  children?: ReactNode;
  className?: string;
}
