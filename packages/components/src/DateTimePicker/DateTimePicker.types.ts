/**
 * @author Ryan He
 * @date 2026-04-24
 * @description 定义 DateTimePicker 模块的共享 TypeScript 类型。
 *              在 DatePickerCommonProps 的基础上扩展 time 面板控制项 —— showMinute/showSecond
 *              允许消费者按需开放分/秒粒度，未开放的字段在 value 中恒定为 0。
 */

import type { DatePickerCommonProps, DateValue } from '../DatePicker/DatePicker.types';

export interface DateTimePickerProps extends DatePickerCommonProps {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  onChange?: (value: DateValue | null) => void;
  /** 是否开放分钟列；默认 true。设为 false 时 value 的分钟恒为 0。 */
  showMinute?: boolean;
  /** 是否开放秒钟列；默认 false。设为 true 才出现秒列，否则 value 的秒恒为 0。 */
  showSecond?: boolean;
  /** 小时步进，默认 1。 */
  hourStep?: number;
  /** 分钟步进，默认 1。 */
  minuteStep?: number;
  /** 秒钟步进，默认 1。 */
  secondStep?: number;
  /** 12 小时制（AM/PM）；默认 false（24 小时制）。 */
  is12Hour?: boolean;
  /** Now 按钮可见性的兼容别名；显式 showNowButton 优先。 */
  showTodayButton?: boolean;
  /** 底部 [Now] 按钮是否显示；默认继承 showTodayButton（true）。点击填入当前日期时间。 */
  showNowButton?: boolean;
  /** 底部 [OK] 按钮是否显示，默认 true —— 点击确认并关闭面板。 */
  showConfirmButton?: boolean;
  /** Now 按钮文案覆盖。 */
  nowLabel?: string;
  /** OK 按钮文案覆盖。 */
  confirmLabel?: string;
}
