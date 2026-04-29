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
  /**
   * 关闭按钮的 tabIndex。默认 `0`（与现有 `<button>` 默认 Tab 行为一致）。
   * 在多选 chip 等场景下传 `-1` 可让 × 退出 Tab 序列，仅鼠标可达。
   */
  closeButtonTabIndex?: number;
  /**
   * 关闭按钮的 `aria-label`。默认 `'Remove'`，可动态生成（如 `Remove apple`）。
   */
  closeButtonAriaLabel?: string;
}
