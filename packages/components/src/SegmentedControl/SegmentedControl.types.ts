/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 SegmentedControl 模块的 TypeScript 类型约束。
 */

import type { ReactNode, CSSProperties } from 'react';

export type SegmentedControlSize = 'sm' | 'md' | 'lg';

export type SegmentedControlColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

export type SegmentedControlOrientation = 'horizontal' | 'vertical';

/** 单个分段配置：值 + 文本（可选图标 / 禁用 / 仅图标的可访问名）。 */
export interface SegmentedControlOption<V extends string = string> {
  value: V;
  label: ReactNode;
  /** 文本前的图标（横向模式置于左侧）。 */
  icon?: ReactNode;
  /** 单独禁用该项。整体禁用请用顶层 `isDisabled`。 */
  isDisabled?: boolean;
  /** 当 `label` 为图标时提供可访问名。 */
  'aria-label'?: string;
}

export interface SegmentedControlProps<V extends string = string> {
  /** 分段选项。顺序决定 indicator 位置。 */
  options: ReadonlyArray<SegmentedControlOption<V>>;

  value?: V;
  defaultValue?: V;
  onChange?: (value: V) => void;

  color?: SegmentedControlColor;
  size?: SegmentedControlSize;
  orientation?: SegmentedControlOrientation;

  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  /** 横向时撑满父容器宽度。默认 false（按内容自适应）。 */
  isFullWidth?: boolean;

  /** 关联文本标签，渲染在控件上方（横向）/ 上方（纵向）。 */
  label?: ReactNode;
  /** 表单提交字段名（每个 segment 是同名 radio）。 */
  name?: string;

  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}
