/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Textarea 模块的 TypeScript 类型约束。
 */

import type { ChangeEvent, CSSProperties, ReactNode, TextareaHTMLAttributes } from 'react';
import type { FieldVariant, FieldColor } from '../utils';

export type TextareaVariant = FieldVariant;
export type TextareaColor = FieldColor;
export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextareaRadius = 'sm' | 'md' | 'lg' | 'full';

type StrippedNativeKeys =
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'rows';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  StrippedNativeKeys
> {
  variant?: TextareaVariant;
  color?: TextareaColor;
  size?: TextareaSize;
  radius?: TextareaRadius;

  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onChangeEvent?: (event: ChangeEvent<HTMLTextAreaElement>) => void;

  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;

  startContent?: ReactNode;
  endContent?: ReactNode;

  rows?: number;
  minRows?: number;
  maxRows?: number;
  isAutoSize?: boolean;

  showCount?: boolean;
  maxLength?: number;

  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;

  fullWidth?: boolean;

  className?: string;
  style?: CSSProperties;
}
