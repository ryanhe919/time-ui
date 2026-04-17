/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Badge 组件的对外类型契约。
 */

import type { ReactNode } from 'react';

export type BadgeColor = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export type BadgeVariant = 'standard' | 'dot';
export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BadgeProps {
  content?: ReactNode | number;
  variant?: BadgeVariant;
  color?: BadgeColor;
  placement?: BadgePlacement;
  max?: number;
  showZero?: boolean;
  isInvisible?: boolean;
  isOneCharacter?: boolean;
  isPulse?: boolean;
  showOutline?: boolean;
  children?: ReactNode;
  className?: string;
  'aria-label'?: string;
}
