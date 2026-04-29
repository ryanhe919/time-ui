/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 定义 MultiSelect 模块的对外类型契约。
 *              `value` / `defaultValue` / `onChange` 全部以 `string[]` 形态出现，
 *              与 `CheckboxGroup` 数组语义对齐；`variant` / `color` / `size` 沿用
 *              `FieldVariant` / `FieldColor` 与 Select / Input 三件套同款，避免歧义。
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { FieldColor, FieldVariant } from '../utils/fieldStyles';

export type MultiSelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type MultiSelectRadius = 'sm' | 'md' | 'lg' | 'full';

export type MultiSelectPlacement = 'auto' | 'bottom' | 'top';

/**
 * 单个 item 的形态——同时供 `items` prop 与 `tagRender` / `optionRender` render-prop 消费。
 *
 * `group` 字段允许 `items` 数组形式直接表达分组：相同 group 字符串的项渲染到同一组内，
 * 顺序按数组顺序，未提供 group 的项归到默认（无 heading）分组。
 */
export interface MultiSelectItem {
  value: string;
  label: ReactNode;
  isDisabled?: boolean;
  description?: ReactNode;
  group?: string;
}

export interface TagRenderOptions {
  onRemove: () => void;
  isDisabled: boolean;
}

export interface OptionRenderOptions {
  isSelected: boolean;
  isHighlighted: boolean;
  isDisabled: boolean;
}

type MultiSelectPassthrough = Omit<
  HTMLAttributes<HTMLDivElement>,
  'role' | 'children' | 'onChange' | 'defaultValue'
>;

export interface MultiSelectProps extends MultiSelectPassthrough {
  /** 受控值。提供则进入受控模式。 */
  value?: string[];
  /** 非受控初始值。 */
  defaultValue?: string[];
  /** 变化回调；参数为新数组（已去重）。 */
  onChange?: (value: string[]) => void;

  /** items 提供则忽略 children（与 Select 一致）。 */
  items?: MultiSelectItem[];
  /** 仅接受 `<MultiSelectOption>` / `<MultiSelectOptGroup>`。 */
  children?: ReactNode;

  placeholder?: string;

  variant?: FieldVariant;
  color?: FieldColor;
  size?: MultiSelectSize;
  radius?: MultiSelectRadius;

  isFullWidth?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isLoading?: boolean;

  isSearchable?: boolean;
  searchPlaceholder?: string;
  filterOption?: (input: string, item: MultiSelectItem) => boolean;
  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;

  isClearable?: boolean;
  clearButtonTabIndex?: number;
  clearOnEsc?: boolean;
  /** 清空按钮 click 后调用。 */
  onClear?: () => void;

  /** 多选默认 false：选中后保持开。 */
  closeOnSelect?: boolean;
  /** 上限；达上限后未选项渲染为禁用样态（aria-disabled=true）。 */
  maxSelectedCount?: number;
  /** trigger 中 chip 显示数量；`'responsive'` 按宽度自动；超出折叠为 `+N`。 */
  maxTagCount?: number | 'responsive';
  /** dropdown 顶部 toolbar 是否显示"全选/清空"。 */
  showSelectAllInToolbar?: boolean;
  /** true 时已选项不再出现在 list（罕用）。 */
  hideSelectedInList?: boolean;

  tagRender?: (item: MultiSelectItem, opts: TagRenderOptions) => ReactNode;
  optionRender?: (item: MultiSelectItem, opts: OptionRenderOptions) => ReactNode;

  startContent?: ReactNode;
  endContent?: ReactNode;

  maxListHeight?: number | string;
  placement?: MultiSelectPlacement;

  /** FormField 集成。任一 label/description/errorMessage 存在则包 FormField。 */
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;

  /** native form 集成：渲染多个 hidden `<input name=value>`。 */
  name?: string;

  id?: string;
  className?: string;
  style?: CSSProperties;
}

export interface MultiSelectOptionProps {
  value: string;
  children?: ReactNode;
  isDisabled?: boolean;
  description?: ReactNode;
}

export interface MultiSelectOptGroupProps {
  label: ReactNode;
  children?: ReactNode;
}
