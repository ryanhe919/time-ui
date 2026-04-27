/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Switch 模块的 TypeScript 类型约束。
 */

import type { ReactNode, InputHTMLAttributes } from 'react';

export type SwitchSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type SwitchColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

type InputPassthrough = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'size'
  | 'onChange'
  | 'value'
  | 'type'
  | 'role'
  | 'aria-checked'
  | 'checked'
  | 'defaultChecked'
  | 'children'
>;

export interface SwitchProps extends InputPassthrough {
  color?: SwitchColor;
  size?: SwitchSize;

  isSelected?: boolean;
  defaultIsSelected?: boolean;
  onChange?: (checked: boolean) => void;

  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;

  startContent?: ReactNode;
  endContent?: ReactNode;

  children?: ReactNode;

  value?: string;
  name?: string;

  className?: string;
  style?: React.CSSProperties;
}
