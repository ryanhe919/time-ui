/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Radio 模块的 TypeScript 类型约束。
 */

import type { InputHTMLAttributes, ReactNode } from 'react';
import type { ButtonColor } from '../Button/Button.types';

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type RadioColor = ButtonColor;

export type RadioGroupOrientation = 'horizontal' | 'vertical';

type OmittedNativeRadioProps =
  | 'size'
  | 'type'
  | 'value'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'color'
  | 'name';

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  OmittedNativeRadioProps
> {
  value: string;
  color?: RadioColor;
  size?: RadioSize;
  children?: ReactNode;
  description?: ReactNode;
  isDisabled?: boolean;
}

export interface RadioGroupProps {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  orientation?: RadioGroupOrientation;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  color?: RadioColor;
  size?: RadioSize;
  name?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}
