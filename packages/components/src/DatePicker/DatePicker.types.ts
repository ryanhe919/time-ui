/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 DatePicker / DateRangePicker 模块的共享 TypeScript 类型。
 */

import type { CSSProperties, ReactNode } from 'react';
import type { PopoverPlacement } from '../Popover/Popover.types';
import type { WeekStartsOn } from './date-utils';

export type DatePickerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type DatePickerPanelSize = 'sm' | 'md' | 'lg';

export type DateValue = Date;

export interface DateRangeValue {
  start: DateValue;
  end: DateValue;
}

/** Range 中间过程的状态：已选 start 但未确认 end 时使用。 */
export interface DateRangeWorking {
  start: DateValue | null;
  end: DateValue | null;
}

export interface DatePickerCommonProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Popover placement，默认 'bottom-start'。 */
  placement?: PopoverPlacement;
  /** 触发器尺寸，跟随 Input。 */
  size?: DatePickerSize;
  /** 弹出日历面板尺寸，默认 'md'。 */
  panelSize?: DatePickerPanelSize;
  minValue?: DateValue;
  maxValue?: DateValue;
  /** 自定义某天禁用（如周末禁选）。 */
  isDateUnavailable?: (date: DateValue) => boolean;
  /** 周首日：0=Sun, 1=Mon, ... ；默认 0。 */
  weekStartsOn?: WeekStartsOn;
  locale?: string;
  /** 输入框显示格式。 */
  format?: (d: DateValue) => string;
  /** 字符串解析回 Date（用户键入时）。 */
  parse?: (s: string) => DateValue | null;
  placeholder?: string;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  /** 显示清除按钮。 */
  isClearable?: boolean;
  /** 底部 [Today] 按钮。 */
  showTodayButton?: boolean;
  startContent?: ReactNode;
  endContent?: ReactNode;
  portalContainer?: HTMLElement;
  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
}

export interface DatePickerProps extends DatePickerCommonProps {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  onChange?: (value: DateValue | null) => void;
}

export interface DateRangePresetEntry {
  label: ReactNode;
  value: DateRangeValue;
}

export interface DateRangePickerProps extends DatePickerCommonProps {
  value?: DateRangeValue | null;
  defaultValue?: DateRangeValue | null;
  onChange?: (value: DateRangeValue | null) => void;
  /** 同时显示几个月，默认 2。 */
  visibleMonths?: 1 | 2;
  /** 预设范围（如 "Last 7 days"）。 */
  presets?: DateRangePresetEntry[];
}
