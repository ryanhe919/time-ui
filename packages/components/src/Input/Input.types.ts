/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Input 模块的 TypeScript 类型约束。
 */

import type { ChangeEvent, CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import type { FieldVariant, FieldColor } from '../utils';

export type InputVariant = FieldVariant;
export type InputColor = FieldColor;
export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputRadius = 'sm' | 'md' | 'lg' | 'full';

export type InputType = 'text' | 'email' | 'url' | 'tel' | 'password' | 'search' | 'number';

type StrippedNativeKeys =
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'type'
  | 'disabled'
  | 'readOnly'
  | 'required';

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  StrippedNativeKeys
> {
  variant?: InputVariant;
  color?: InputColor;
  size?: InputSize;
  radius?: InputRadius;
  type?: InputType;

  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onChangeEvent?: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;

  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;

  startContent?: ReactNode;
  endContent?: ReactNode;

  isClearable?: boolean;
  clearOnEscape?: boolean;
  clearButtonTabIndex?: number;

  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;

  isPasswordToggleVisible?: boolean;

  fullWidth?: boolean;

  className?: string;
  style?: CSSProperties;
}
