/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Tag 组件的对外类型契约。
 */

import type { MouseEvent, ReactNode } from 'react';

export type TagColor = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type TagVariant = 'solid' | 'soft' | 'outline';
export type TagSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TagShape = 'rounded' | 'pill';

export interface TagProps {
  color?: TagColor;
  variant?: TagVariant;
  size?: TagSize;
  shape?: TagShape;
  isClosable?: boolean;
  isDisabled?: boolean;
  isInteractive?: boolean;
  startContent?: ReactNode;
  endContent?: ReactNode;
  onClose?: (e: MouseEvent) => void;
  onPress?: () => void;
  children?: ReactNode;
  className?: string;
  'aria-label'?: string;
}
