/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Steps 模块的 TypeScript 类型约束。
 */

import type { CSSProperties, ReactNode } from 'react';

export type StepStatus = 'wait' | 'process' | 'finish' | 'error';
export type StepsDirection = 'horizontal' | 'vertical';
export type StepsVariant = 'default' | 'dot' | 'navigation';
export type StepsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface StepItem {
  /** 唯一 key（缺省时回退到 index）。 */
  itemKey?: string;
  /** 标题，必需。 */
  title: ReactNode;
  /** 描述，可选。 */
  description?: ReactNode;
  /** 自定义 indicator 图标（覆盖 default 编号 / dot / 勾）。 */
  icon?: ReactNode;
  /** 显式状态覆盖自动推断（最高优先级）。 */
  status?: StepStatus;
  /** 单独禁用该 step（不可点击 / 视觉淡化）。 */
  isDisabled?: boolean;
}

export interface StepsProps {
  /** 步骤数据。 */
  items: StepItem[];

  /** 受控当前 step 索引（0-based）。 */
  activeIndex?: number;
  /** 非受控初始当前 step 索引（0-based），默认 0。 */
  defaultActiveIndex?: number;
  /** 当前 step 变更回调。 */
  onActiveIndexChange?: (index: number) => void;

  /** 当前 step 的整体状态，默认 'process'。仅影响 current step 的视觉。 */
  status?: StepStatus;

  /** 排列方向，默认 'horizontal'。 */
  direction?: StepsDirection;

  /** 渲染变体，默认 'default'。 */
  variant?: StepsVariant;

  /** 尺寸，默认 'md'。 */
  size?: StepsSize;

  /** 是否允许点击 step 跳转（navigation 默认 true）。 */
  isClickable?: boolean;

  /** indicator 之前的自定义渲染前缀（如步骤计数 chip）。 */
  startContent?: ReactNode;

  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
}
