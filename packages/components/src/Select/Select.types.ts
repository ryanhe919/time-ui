/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Select 模块的 TypeScript 类型约束。
 */

import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react';
import type { FieldVariant, FieldColor } from '../utils/fieldStyles';

export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type SelectRadius = 'sm' | 'md' | 'lg' | 'full';

export interface SelectItem {
  value: string;
  label: ReactNode;
  isDisabled?: boolean;
  description?: ReactNode;
}

type SelectPassthrough = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'size' | 'onChange' | 'value' | 'defaultValue' | 'children' | 'type' | 'role' | 'disabled'
>;

export interface SelectProps extends SelectPassthrough {
  variant?: FieldVariant;
  color?: FieldColor;
  size?: SelectSize;
  radius?: SelectRadius;
  fullWidth?: boolean;

  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;

  placeholder?: string;

  items?: SelectItem[];

  children?: ReactNode;

  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;

  startContent?: ReactNode;
  endContent?: ReactNode;

  isSearchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
  maxListHeight?: number | string;

  name?: string;

  className?: string;
  style?: CSSProperties;
}

export interface SelectOptionProps {
  value: string;
  children?: ReactNode;
  disabled?: boolean;
  isDisabled?: boolean;
  description?: ReactNode;
}
