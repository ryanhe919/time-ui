/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Checkbox 模块的 TypeScript 类型约束。
 */

import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import type { ButtonColor } from '../Button/Button.types';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export type CheckboxRadius = 'sm' | 'md';

export type CheckboxColor = ButtonColor;

export type CheckboxGroupOrientation = 'horizontal' | 'vertical';

type OmittedNativeCheckboxProps =
  | 'size'
  | 'type'
  | 'value'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'color';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  OmittedNativeCheckboxProps
> {
  color?: CheckboxColor;
  size?: CheckboxSize;
  radius?: CheckboxRadius;
  value?: string;
  isSelected?: boolean;
  defaultSelected?: boolean;
  isIndeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  onChangeEvent?: (event: ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  children?: ReactNode;
  name?: string;
}

export interface CheckboxGroupProps {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  orientation?: CheckboxGroupOrientation;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  color?: CheckboxColor;
  size?: CheckboxSize;
  radius?: CheckboxRadius;
  name?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}
