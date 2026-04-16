/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Slider 模块的 TypeScript 类型约束。
 */

import type { ReactNode, CSSProperties } from 'react';

export type SliderSize = 'sm' | 'md' | 'lg';

export type SliderColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export type SliderOrientation = 'horizontal' | 'vertical';

/** 单值或范围（[min, max]）。是否为范围模式由 value/defaultValue 是否为数组推断。 */
export type SliderValue = number | [number, number];

export interface SliderProps {
  color?: SliderColor;
  size?: SliderSize;
  orientation?: SliderOrientation;

  min?: number;
  max?: number;
  step?: number;

  value?: SliderValue;
  defaultValue?: SliderValue;
  onChange?: (value: SliderValue) => void;
  /** 拖拽结束 / 键盘释放后触发，常用于"提交一次"的场景。 */
  onChangeEnd?: (value: SliderValue) => void;

  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;

  /** 顶部主标题（横向）/ 底部标题（纵向）。 */
  label?: ReactNode;
  /** 是否显示当前值；默认 false。 */
  showValue?: boolean;
  /** 自定义值的展示。范围模式接收 [a, b]。 */
  formatValue?: (value: SliderValue) => string;

  /** 横向时位于轨道左侧；纵向时位于上方。 */
  startContent?: ReactNode;
  /** 横向时位于轨道右侧；纵向时位于下方。 */
  endContent?: ReactNode;

  /** 单值模式提交字段名。 */
  name?: string;
  /** 范围模式：起始值字段名。 */
  minName?: string;
  /** 范围模式：结束值字段名。 */
  maxName?: string;

  /** 显式覆盖轨道长度，横向是 width，纵向是 height。 */
  length?: string | number;

  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}
