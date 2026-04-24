/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 统一导出 DatePicker 模块的对外接口。
 */

export { DatePicker } from './DatePicker';
export { DateRangePicker } from './DateRangePicker';
export { CalendarPanel } from './CalendarPanel';
export type {
  DatePickerProps,
  DatePickerCommonProps,
  DateRangePickerProps,
  DatePickerSize,
  DatePickerPanelSize,
  DateValue,
  DateRangeValue,
  DateRangePresetEntry,
  DateRangeWorking,
} from './DatePicker.types';
export type { CalendarPanelProps, CalendarMode } from './CalendarPanel';
export {
  startOfDay,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  addDays,
  addMonths,
  addYears,
  isSameDay,
  isSameMonth,
  isInRange,
  isInRangeExclusive,
  compareDays,
  clampDate,
  buildWeekDayOrder,
  startOfCalendarGrid,
  buildCalendarMatrix,
  isWithinBounds,
  defaultFormat,
  defaultParse,
  monthLabel,
  weekdayLabels,
  normalizeRange,
} from './date-utils';
export type { WeekStartsOn, CalendarCell } from './date-utils';
