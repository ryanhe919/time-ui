/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Button 模块的 TypeScript 类型约束。
 */

import type { ElementType, ReactNode, ComponentPropsWithRef, Ref } from 'react';

export type ButtonVariant =
  | 'solid'
  | 'bordered'
  | 'light'
  | 'flat'
  | 'faded'
  | 'shadow'
  | 'ghost'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger';

export type ButtonColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonRadius = 'sm' | 'md' | 'lg' | 'full';

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  radius?: ButtonRadius;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /**
   * Render as a square icon-only button: width = height, no min-width and no
   * inner padding. Pass the icon either as `children` or via `startIcon`. When
   * enabled, `aria-label` (or `aria-labelledby`) is required for accessibility.
   */
  isIconOnly?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children?: ReactNode;
}

export type ButtonProps<C extends ElementType = 'button'> = ButtonOwnProps & {
  as?: C;
  ref?: Ref<Element>;
} & Omit<ComponentPropsWithRef<C>, keyof ButtonOwnProps | 'as'>;
