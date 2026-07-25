/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Select 模块的 TypeScript 类型约束。
 */

import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react';
import type { FieldVariant, FieldColor } from '../utils/fieldStyles';
import type { AsyncOptionsLoader, AsyncSearchProps } from '../utils/useAsyncOptions';

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
  // 末项排除远程搜索相关键，避免与 DOM 事件属性（如 onSearch）撞名。
  | 'size'
  | 'onChange'
  | 'value'
  | 'defaultValue'
  | 'children'
  | 'type'
  | 'role'
  | 'disabled'
  | keyof AsyncSearchProps<SelectItem>
>;

/** Select 的远程选项加载器。 */
export type SelectLoadOptions = AsyncOptionsLoader<SelectItem>;

export interface SelectProps extends SelectPassthrough, AsyncSearchProps<SelectItem> {
  variant?: FieldVariant;
  color?: FieldColor;
  size?: SelectSize;
  radius?: SelectRadius;
  isFullWidth?: boolean;

  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;

  placeholder?: string;

  /**
   * 静态选项。
   *
   * 远程模式下它不再是列表数据源，而是「已知项」补充——把当前 `value` 对应的
   * item 放进来即可保证首屏未加载时 trigger 也能显示正确的 label。
   */
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
  isDisabled?: boolean;
  description?: ReactNode;
}
