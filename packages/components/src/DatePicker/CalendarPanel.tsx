'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description CalendarPanel —— DatePicker / DateRangePicker 共享内核：
 *              HeaderRow（prev / month-label / next） + WeekdaysRow + 6×7 Grid + 可选 FooterRow。
 *              支持 single / range 两种模式，键盘 roving tabindex，月份切换动画与 prefers-reduced-motion 兜底。
 *              本组件本身不维护 selected 值 —— 仅按 props.selected / props.range 高亮。
 *              月份"内部 anchor" 通过受控+非受控双轨，由消费者 (DatePicker / DateRangePicker) 控制是否同步。
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import {
  addDays,
  addMonths,
  addYears,
  buildCalendarMatrix,
  compareDays,
  endOfMonth,
  isInRange,
  isSameDay,
  isWithinBounds,
  monthLabel,
  startOfDay,
  startOfMonth,
  weekdayLabels,
  type WeekStartsOn,
} from './date-utils';

export type CalendarMode = 'single' | 'range';

export interface CalendarPanelProps {
  /** 模式：single 仅单选高亮；range 渲染区间高亮 + hover preview。 */
  mode?: CalendarMode;
  /** single 模式下当前选中。 */
  selected?: Date | null;
  /** range 模式下确认的区间。 */
  range?: { start: Date | null; end: Date | null };
  /** range 模式下，hover preview 的目标 end（与 range.start 配合）。 */
  hoverEnd?: Date | null;
  /** 月份 anchor（受控）。 */
  monthAnchor?: Date;
  /** 月份 anchor（非受控初值）。 */
  defaultMonthAnchor?: Date;
  /** 月份 anchor 变更回调。 */
  onMonthAnchorChange?: (next: Date) => void;
  /** 单元格点击回调（已过滤 disabled / unavailable）。 */
  onSelectDate?: (date: Date) => void;
  /** range 模式下：cell hover 回调，用于驱动消费者维护 hoverEnd。 */
  onHoverDate?: (date: Date | null) => void;
  /** today 按钮点击。 */
  onToday?: () => void;
  /** clear 按钮点击。 */
  onClear?: () => void;
  /** 键盘 focus 的日期（受控/非受控均可由消费者覆盖；此处兜底）。 */
  focusedDate?: Date;
  /** focusedDate 变更回调（roving tabindex）。 */
  onFocusedDateChange?: (next: Date) => void;
  minValue?: Date;
  maxValue?: Date;
  isDateUnavailable?: (date: Date) => boolean;
  weekStartsOn?: WeekStartsOn;
  locale?: string;
  /** 是否渲染 footer 区域（[Today][Clear]）。 */
  showFooter?: boolean;
  /** 是否显示 Today 按钮（footer 上）。 */
  showTodayButton?: boolean;
  /** 是否显示 Clear 按钮（footer 上）。 */
  showClearButton?: boolean;
  /** 是否隐藏 prev/next（DateRangePicker 双月时左/右面板分别用得上）。 */
  hidePrevButton?: boolean;
  hideNextButton?: boolean;
  /**
   * 是否隐藏相邻月份的 outside-month cell（保留 grid 占位但不渲染数字 / 不可交互）。
   * DateRangePicker 双月视图用它避免两个 panel 重复显示同一天，视觉更克制。
   */
  hideOutsideMonth?: boolean;
  /** 自定义 footer 区域内容（覆盖默认按钮）。 */
  footer?: ReactNode;
  /** 整体 a11y label。 */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

const TODAY_LABEL = 'Today';
const CLEAR_LABEL = 'Clear';
const YEAR_GRID_SIZE = 12;

function isChineseLocale(locale?: string): boolean {
  return locale?.toLowerCase().startsWith('zh') ?? false;
}

export const CalendarPanel = forwardRef<HTMLDivElement, CalendarPanelProps>(
  function CalendarPanel(props, forwardedRef) {
    const {
      mode = 'single',
      selected = null,
      range,
      hoverEnd = null,
      monthAnchor: monthAnchorProp,
      defaultMonthAnchor,
      onMonthAnchorChange,
      onSelectDate,
      onHoverDate,
      onToday,
      onClear,
      focusedDate: focusedDateProp,
      onFocusedDateChange,
      minValue,
      maxValue,
      isDateUnavailable,
      weekStartsOn = 0,
      locale,
      showFooter = true,
      showTodayButton = true,
      showClearButton = true,
      hidePrevButton = false,
      hideNextButton = false,
      hideOutsideMonth = false,
      footer,
      'aria-label': ariaLabel,
      className,
      style,
      id: idProp,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.datePicker;
    const isZh = isChineseLocale(locale);
    const todayLabel = isZh ? '今天' : TODAY_LABEL;
    const clearLabel = isZh ? '清除' : CLEAR_LABEL;
    const calendarLabel = isZh ? '日历' : 'Calendar';
    const previousMonthLabel = isZh ? '上个月' : 'Previous month';
    const nextMonthLabel = isZh ? '下个月' : 'Next month';
    const chooseYearLabel = isZh ? '选择年份' : 'Choose year';
    const chooseDateLabel = isZh ? '返回日期视图' : 'Back to date view';
    const previousYearsLabel = isZh ? '上一组年份' : 'Previous years';
    const nextYearsLabel = isZh ? '下一组年份' : 'Next years';

    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = idProp ?? `timeui-calendar-${safeAutoId}`;

    // ── month anchor（受控 / 非受控双轨）──
    const today = useMemo(() => startOfDay(new Date()), []);
    const initialAnchor = useMemo(
      () => startOfMonth(defaultMonthAnchor ?? selected ?? range?.start ?? today),
      // 仅初值，避免 anchor 漂移。
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );
    const [monthAnchor, setMonthAnchor] = useControllableState<Date>({
      value: monthAnchorProp,
      // 当受控时把 defaultValue 置 undefined，避免 useControllableState 触发"both provided"警告。
      defaultValue: (monthAnchorProp !== undefined ? undefined : initialAnchor) as Date,
      onChange: onMonthAnchorChange,
      name: 'CalendarPanel.monthAnchor',
    });
    const [pickerView, setPickerView] = useState<'days' | 'years'>('days');

    // ── focusedDate（受控 / 非受控双轨）——roving tabindex 的核心。
    // 非受控时，初值为当月第 1 天（或 selected）。
    const initialFocused = useMemo(
      () => selected ?? range?.start ?? today,
      // 仅初值
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );
    const [focusedDate, setFocusedDate] = useControllableState<Date>({
      value: focusedDateProp,
      defaultValue: (focusedDateProp !== undefined ? undefined : initialFocused) as Date,
      onChange: onFocusedDateChange,
      name: 'CalendarPanel.focusedDate',
    });

    // 月份切换时更新 focus（若新月份不包含旧 focus）。
    // 用 ref 来避免在受控 monthAnchor 时来回触发。
    const prevAnchorRef = useRef<Date | null>(null);
    useEffect(() => {
      if (prevAnchorRef.current && compareDays(prevAnchorRef.current, monthAnchor) !== 0) {
        // 如果当前 focus 不在新月份中，把它移到新月份首日。
        if (
          focusedDate.getMonth() !== monthAnchor.getMonth() ||
          focusedDate.getFullYear() !== monthAnchor.getFullYear()
        ) {
          setFocusedDate(startOfMonth(monthAnchor));
        }
      }
      prevAnchorRef.current = monthAnchor;
      // 故意忽略 focusedDate 依赖，避免死循环。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthAnchor]);

    // ── matrix ──
    const matrix = useMemo(
      () => buildCalendarMatrix(monthAnchor, weekStartsOn),
      [monthAnchor, weekStartsOn],
    );
    const weekdays = useMemo(() => weekdayLabels(weekStartsOn, locale), [weekStartsOn, locale]);

    // ── 月份切换 ──
    const goPrevMonth = useCallback(() => {
      setMonthAnchor(addMonths(monthAnchor, -1));
    }, [monthAnchor, setMonthAnchor]);
    const goNextMonth = useCallback(() => {
      setMonthAnchor(addMonths(monthAnchor, 1));
    }, [monthAnchor, setMonthAnchor]);
    const goPrevYearRange = useCallback(() => {
      setMonthAnchor(
        new Date(monthAnchor.getFullYear() - YEAR_GRID_SIZE, monthAnchor.getMonth(), 1),
      );
    }, [monthAnchor, setMonthAnchor]);
    const goNextYearRange = useCallback(() => {
      setMonthAnchor(
        new Date(monthAnchor.getFullYear() + YEAR_GRID_SIZE, monthAnchor.getMonth(), 1),
      );
    }, [monthAnchor, setMonthAnchor]);

    // 用于月份过渡动画方向（+1=向前/右滑，-1=后退/左滑）。
    const slideDirRef = useRef<1 | -1>(1);
    const setSlide = useCallback((dir: 1 | -1) => {
      slideDirRef.current = dir;
    }, []);

    // ── 单元格 click ──
    const handleCellClick = useCallback(
      (date: Date) => {
        if (!isWithinBounds(date, minValue, maxValue)) return;
        if (isDateUnavailable?.(date)) return;
        // 如果是 outside-month，先切换月份。
        if (
          date.getMonth() !== monthAnchor.getMonth() ||
          date.getFullYear() !== monthAnchor.getFullYear()
        ) {
          const dir: 1 | -1 = compareDays(date, monthAnchor) > 0 ? 1 : -1;
          setSlide(dir);
          setMonthAnchor(startOfMonth(date));
        }
        setFocusedDate(date);
        onSelectDate?.(date);
      },
      [
        isDateUnavailable,
        maxValue,
        minValue,
        monthAnchor,
        onSelectDate,
        setMonthAnchor,
        setFocusedDate,
        setSlide,
      ],
    );

    // ── hover ──
    const handleCellEnter = useCallback(
      (date: Date) => {
        if (mode !== 'range') return;
        if (!isWithinBounds(date, minValue, maxValue)) return;
        if (isDateUnavailable?.(date)) return;
        onHoverDate?.(date);
      },
      [mode, minValue, maxValue, isDateUnavailable, onHoverDate],
    );

    const handleGridLeave = useCallback(() => {
      if (mode !== 'range') return;
      onHoverDate?.(null);
    }, [mode, onHoverDate]);

    const startOfYear = useCallback((year: number) => new Date(year, 0, 1, 0, 0, 0, 0), []);
    const endOfYear = useCallback((year: number) => new Date(year, 11, 31, 23, 59, 59, 999), []);

    const isYearReachable = useCallback(
      (year: number) => {
        if (minValue && compareDays(endOfYear(year), minValue) < 0) return false;
        if (maxValue && compareDays(startOfYear(year), maxValue) > 0) return false;
        return true;
      },
      [endOfYear, maxValue, minValue, startOfYear],
    );

    const getMonthAnchorForYear = useCallback(
      (year: number) => {
        const desired = new Date(year, monthAnchor.getMonth(), 1, 0, 0, 0, 0);
        const minMonth =
          minValue && minValue.getFullYear() === year
            ? startOfMonth(minValue)
            : new Date(year, 0, 1, 0, 0, 0, 0);
        const maxMonth =
          maxValue && maxValue.getFullYear() === year
            ? startOfMonth(maxValue)
            : new Date(year, 11, 1, 0, 0, 0, 0);
        if (compareDays(desired, minMonth) < 0) return minMonth;
        if (compareDays(desired, maxMonth) > 0) return maxMonth;
        return desired;
      },
      [maxValue, minValue, monthAnchor],
    );

    const handleYearSelect = useCallback(
      (year: number) => {
        if (!isYearReachable(year)) return;
        setSlide(year >= monthAnchor.getFullYear() ? 1 : -1);
        setMonthAnchor(getMonthAnchorForYear(year));
        setPickerView('days');
      },
      [getMonthAnchorForYear, isYearReachable, monthAnchor, setMonthAnchor, setSlide],
    );

    // ── 键盘导航 ──
    const moveFocus = useCallback(
      (next: Date) => {
        // clamp 到 min/max
        const clamped = (() => {
          if (minValue && compareDays(next, minValue) < 0) return startOfDay(minValue);
          if (maxValue && compareDays(next, maxValue) > 0) return startOfDay(maxValue);
          return next;
        })();
        // 如果跨月，也要同步 monthAnchor。
        if (
          clamped.getMonth() !== monthAnchor.getMonth() ||
          clamped.getFullYear() !== monthAnchor.getFullYear()
        ) {
          const dir: 1 | -1 = compareDays(clamped, monthAnchor) > 0 ? 1 : -1;
          setSlide(dir);
          setMonthAnchor(startOfMonth(clamped));
        }
        setFocusedDate(clamped);
      },
      [minValue, maxValue, monthAnchor, setMonthAnchor, setFocusedDate, setSlide],
    );

    const handleGridKeyDown = useCallback(
      (e: ReactKeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            moveFocus(addDays(focusedDate, -1));
            return;
          case 'ArrowRight':
            e.preventDefault();
            moveFocus(addDays(focusedDate, 1));
            return;
          case 'ArrowUp':
            e.preventDefault();
            moveFocus(addDays(focusedDate, -7));
            return;
          case 'ArrowDown':
            e.preventDefault();
            moveFocus(addDays(focusedDate, 7));
            return;
          case 'Home': {
            e.preventDefault();
            // 本周第一天：focusedDate 周内向左推到 weekStartsOn。
            const dow = focusedDate.getDay();
            const back = (dow - weekStartsOn + 7) % 7;
            moveFocus(addDays(focusedDate, -back));
            return;
          }
          case 'End': {
            e.preventDefault();
            const dow = focusedDate.getDay();
            const back = (dow - weekStartsOn + 7) % 7;
            moveFocus(addDays(focusedDate, 6 - back));
            return;
          }
          case 'PageUp':
            e.preventDefault();
            if (e.shiftKey) {
              moveFocus(addYears(focusedDate, -1));
            } else {
              moveFocus(addMonths(focusedDate, -1));
            }
            return;
          case 'PageDown':
            e.preventDefault();
            if (e.shiftKey) {
              moveFocus(addYears(focusedDate, 1));
            } else {
              moveFocus(addMonths(focusedDate, 1));
            }
            return;
          case 'Enter':
          case ' ': {
            e.preventDefault();
            handleCellClick(focusedDate);
            return;
          }
          default:
            return;
        }
      },
      [focusedDate, handleCellClick, moveFocus, weekStartsOn],
    );

    // 当 focused cell 变化后，把焦点移到对应 DOM 节点。
    // 仅当用户已经 focus 进 grid 时才 refocus，避免触发器 popover 一打开就抢焦点。
    const gridRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const grid = gridRef.current;
      if (!grid) return;
      if (!grid.contains(document.activeElement)) return;
      const dateAttr = focusedDate.toISOString().slice(0, 10);
      const cell = grid.querySelector<HTMLElement>(`[data-date="${dateAttr}"]`);
      if (cell && document.activeElement !== cell) {
        try {
          cell.focus({ preventScroll: true });
        } catch {
          cell.focus();
        }
      }
    }, [focusedDate]);

    // ── styling ──
    const surfaceBg = theme.colors.bg.surface ?? theme.colors.bg.canvas;
    const hoverBg = theme.colors.action.secondary.hover;
    const mutedBg = theme.colors.bg.muted ?? theme.colors.action.secondary.default;
    const textPrimary = theme.colors.text.primary;
    const textSecondary = theme.colors.text.secondary;
    const textDisabled = theme.colors.text.disabled;
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const primaryBg = theme.colors.primary[500];
    const primaryFg = theme.colors.primary.foreground;
    const primarySoft = theme.colors.primary[100];
    const dangerColor = theme.colors.danger[500];

    const headerCss = css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: ${tokens.headerHeight};
      gap: ${tokens.headerGap};
      margin-bottom: ${tokens.headerGap};
    `;

    const monthLabelCss = css`
      flex: 1;
      text-align: center;
      font-size: ${tokens.headerFontSize};
      font-weight: ${tokens.headerFontWeight};
      color: ${textPrimary};
      user-select: none;
    `;

    const navButtonCss = css`
      width: ${tokens.headerNavButtonSize};
      height: ${tokens.headerNavButtonSize};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      border: 0;
      border-radius: ${tokens.headerNavButtonRadius};
      background: transparent;
      color: ${textSecondary};
      cursor: pointer;
      transition: background-color 120ms ease;
      &:hover:not(:disabled) {
        background: ${hoverBg};
        color: ${textPrimary};
      }
      &:disabled {
        cursor: not-allowed;
        color: ${textDisabled};
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${focusColor};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const weekdaysCss = css`
      display: grid;
      grid-template-columns: repeat(7, ${tokens.cellSize});
      gap: ${tokens.cellGap};
      height: ${tokens.weekdayHeight};
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    `;

    const weekdayCellCss = css`
      text-align: center;
      font-size: ${tokens.weekdayFontSize};
      font-weight: ${tokens.weekdayFontWeight};
      letter-spacing: ${tokens.weekdayLetterSpacing};
      color: ${textSecondary};
      text-transform: uppercase;
    `;

    const gridWrapCss = css`
      position: relative;
      overflow: hidden;
    `;

    const pickerToggleCss = css`
      ${monthLabelCss}
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 0 8px;
      border: 0;
      border-radius: ${tokens.headerNavButtonRadius};
      background: transparent;
      cursor: pointer;
      transition: background-color 120ms ease;
      &:hover {
        background: ${hoverBg};
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${focusColor};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const gridCss = css`
      display: grid;
      grid-template-columns: repeat(7, ${tokens.cellSize});
      gap: ${tokens.cellGap};
      animation: timeui-cal-slide ${tokens.monthSlideDuration} ${theme.motion.easing.easeOut};
      @keyframes timeui-cal-slide {
        from {
          opacity: 0;
          transform: translateX(
            ${slideDirRef.current === 1
              ? tokens.monthSlideTranslate
              : `-${tokens.monthSlideTranslate}`}
          );
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
      outline: none;
    `;

    const cellBaseCss = css`
      width: ${tokens.cellSize};
      height: ${tokens.cellSize};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: ${tokens.cellFontSize};
      font-weight: ${tokens.cellFontWeight};
      color: ${textPrimary};
      background: transparent;
      border: 0;
      padding: 0;
      margin: 0;
      cursor: pointer;
      border-radius: ${tokens.cellRadius};
      position: relative;
      isolation: isolate;
      user-select: none;
      transition:
        background-color 120ms ease,
        color 120ms ease;
      &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        opacity: 0;
        pointer-events: none;
        background: transparent;
        border-radius: ${tokens.rangeBgRadius};
        z-index: 0;
      }
      &[data-in-range='true']::before,
      &[data-range-bridge-left='true']::before,
      &[data-range-bridge-right='true']::before {
        background: ${primarySoft};
        opacity: 1;
      }
      &[data-preview='true']::before,
      &[data-preview-bridge-left='true']::before,
      &[data-preview-bridge-right='true']::before {
        background: ${primarySoft};
        opacity: ${tokens.rangePreviewOpacity};
      }
      &[data-in-range='true']::before,
      &[data-preview='true']::before,
      &[data-range-bridge-left='true'][data-range-bridge-right='true']::before,
      &[data-preview-bridge-left='true'][data-preview-bridge-right='true']::before {
        left: calc(-1 * (${tokens.cellGap} / 2));
        right: calc(-1 * (${tokens.cellGap} / 2));
      }
      &[data-range-bridge-left='true']::before,
      &[data-preview-bridge-left='true']::before {
        left: calc(-1 * (${tokens.cellGap} / 2));
      }
      &[data-range-bridge-right='true']::before,
      &[data-preview-bridge-right='true']::before {
        right: calc(-1 * (${tokens.cellGap} / 2));
      }
      &:hover:not([data-disabled='true']):not([data-selected='true']) {
        background: ${hoverBg};
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${focusColor};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const footerCss = css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: ${tokens.footerHeight};
      padding: 0 ${tokens.footerPaddingX};
      gap: ${tokens.footerGap};
      border-top: ${tokens.footerBorderTop} solid ${theme.colors.border.subtle};
      margin: ${tokens.headerGap} -${tokens.panelPaddingX} -${tokens.panelPaddingY};
      margin-top: ${tokens.headerGap};
    `;

    const footerBtnCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 12px;
      margin: 0;
      border: 0;
      background: transparent;
      color: ${primaryBg};
      font: inherit;
      font-size: ${tokens.cellFontSize};
      font-weight: 500;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 120ms ease;
      &:hover:not(:disabled) {
        background: ${primarySoft};
      }
      &:disabled {
        cursor: not-allowed;
        color: ${textDisabled};
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${focusColor};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const yearGridCss = css`
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: ${tokens.cellGap};
      min-height: calc(4 * ${tokens.cellSize} + 3 * ${tokens.cellGap});
    `;

    const yearButtonCss = css`
      height: ${tokens.cellSize};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
      border: 0;
      border-radius: ${tokens.cellRadius};
      background: transparent;
      color: ${textPrimary};
      font: inherit;
      font-size: ${tokens.cellFontSize};
      font-weight: ${tokens.cellFontWeight};
      cursor: pointer;
      transition:
        background-color 120ms ease,
        color 120ms ease;
      &:hover:not(:disabled) {
        background: ${hoverBg};
      }
      &:disabled {
        color: ${textDisabled};
        cursor: not-allowed;
        opacity: 0.4;
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${focusColor};
      }
      &[data-selected='true'] {
        background: ${primaryBg};
        color: ${primaryFg};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const clearBtnCss = css`
      ${footerBtnCss}
      color: ${dangerColor};
      &:hover:not(:disabled) {
        background: ${theme.colors.danger[100]};
      }
    `;

    // 计算每个 cell 的状态。
    const cells = useMemo(() => {
      // 预先归一化 range 端点到 startOfDay timestamp，避免 42 cells × 重复 startOfDay 分配。
      const rStart = mode === 'range' ? (range?.start ?? null) : null;
      const rEnd = mode === 'range' ? (range?.end ?? null) : null;
      const rStartTs = rStart ? startOfDay(rStart).getTime() : null;
      const rEndTs = rEnd ? startOfDay(rEnd).getTime() : null;
      const rLoTs = rStartTs !== null && rEndTs !== null ? Math.min(rStartTs, rEndTs) : null;
      const rHiTs = rStartTs !== null && rEndTs !== null ? Math.max(rStartTs, rEndTs) : null;

      return matrix.map((cell) => {
        const isCurrentMonth = cell.isCurrentMonth;
        const isToday = isSameDay(cell.date, today);
        const isSelectedCell = mode === 'single' && isSameDay(cell.date, selected);
        const isUnavailable = isDateUnavailable?.(cell.date) ?? false;
        const isOutOfBounds = !isWithinBounds(cell.date, minValue, maxValue);
        const isDisabled = isUnavailable || isOutOfBounds;
        const isFocused = isSameDay(cell.date, focusedDate);

        // range 高亮（用预先 hoist 的 timestamp，避免在 map 循环里重复 startOfDay）
        let isRangeStart = false;
        let isRangeEnd = false;
        let isInRangeMid = false;
        let isPreview = false;
        let rangeBridgeLeft = false;
        let rangeBridgeRight = false;
        let previewBridgeLeft = false;
        let previewBridgeRight = false;
        if (mode === 'range') {
          const cellTs = startOfDay(cell.date).getTime();
          if (rStartTs !== null && rEndTs !== null) {
            isRangeStart = cellTs === rStartTs;
            isRangeEnd = cellTs === rEndTs;
            isInRangeMid = rLoTs !== null && rHiTs !== null && cellTs > rLoTs && cellTs < rHiTs;
            if (rStartTs !== rEndTs) {
              const isForward = rEndTs > rStartTs;
              if (isRangeStart) {
                rangeBridgeRight = isForward;
                rangeBridgeLeft = !isForward;
              } else if (isRangeEnd) {
                rangeBridgeLeft = isForward;
                rangeBridgeRight = !isForward;
              } else if (isInRangeMid) {
                rangeBridgeLeft = true;
                rangeBridgeRight = true;
              }
            }
          } else if (rStartTs !== null && rEndTs === null && rStart) {
            isRangeStart = cellTs === rStartTs;
            // hover preview：hover 路径相对低频，保持原有 Date API 调用
            if (hoverEnd && cellTs !== rStartTs) {
              isPreview = isInRange(cell.date, rStart, hoverEnd);
              if (isSameDay(cell.date, hoverEnd)) {
                isPreview = true;
              }
            }
            if (hoverEnd) {
              const hoverTs = startOfDay(hoverEnd).getTime();
              if (hoverTs !== rStartTs) {
                const isForward = hoverTs > rStartTs;
                if (isRangeStart) {
                  previewBridgeRight = isForward;
                  previewBridgeLeft = !isForward;
                } else if (cellTs === hoverTs) {
                  previewBridgeLeft = isForward;
                  previewBridgeRight = !isForward;
                } else if (isPreview) {
                  previewBridgeLeft = true;
                  previewBridgeRight = true;
                }
              }
            }
          }
        }

        return {
          date: cell.date,
          isCurrentMonth,
          isToday,
          isSelected: isSelectedCell,
          isDisabled,
          isFocused,
          isRangeStart,
          isRangeEnd,
          isInRangeMid,
          isPreview,
          rangeBridgeLeft,
          rangeBridgeRight,
          previewBridgeLeft,
          previewBridgeRight,
        };
      });
    }, [
      matrix,
      today,
      selected,
      mode,
      range,
      hoverEnd,
      focusedDate,
      minValue,
      maxValue,
      isDateUnavailable,
    ]);

    // 月份导航按钮的 disabled 判断。
    const prevDisabled = useMemo(() => {
      if (!minValue) return false;
      const prevMonthEnd = endOfMonth(addMonths(monthAnchor, -1));
      return compareDays(prevMonthEnd, minValue) < 0;
    }, [minValue, monthAnchor]);
    const nextDisabled = useMemo(() => {
      if (!maxValue) return false;
      const nextMonthStart = startOfMonth(addMonths(monthAnchor, 1));
      return compareDays(nextMonthStart, maxValue) > 0;
    }, [maxValue, monthAnchor]);

    // 渲染
    const labelText = monthLabel(monthAnchor, locale);
    const yearRangeStart = Math.floor(monthAnchor.getFullYear() / YEAR_GRID_SIZE) * YEAR_GRID_SIZE;
    const yearRangeLabel = `${yearRangeStart} - ${yearRangeStart + YEAR_GRID_SIZE - 1}`;
    const yearOptions = useMemo(
      () =>
        Array.from({ length: YEAR_GRID_SIZE }, (_, index) => {
          const year = yearRangeStart + index;
          return {
            year,
            disabled: !isYearReachable(year),
            selected: year === monthAnchor.getFullYear(),
          };
        }),
      [isYearReachable, monthAnchor, yearRangeStart],
    );
    const centerLabel = pickerView === 'years' ? yearRangeLabel : labelText;
    const centerButtonLabel = pickerView === 'years' ? chooseDateLabel : chooseYearLabel;
    const previousNavLabel = pickerView === 'years' ? previousYearsLabel : previousMonthLabel;
    const nextNavLabel = pickerView === 'years' ? nextYearsLabel : nextMonthLabel;

    return (
      <div
        ref={forwardedRef}
        id={baseId}
        className={className}
        style={style}
        aria-label={ariaLabel ?? calendarLabel}
        data-timeui-calendar=""
      >
        <div css={headerCss}>
          {hidePrevButton ? (
            <span
              css={css`
                width: ${tokens.headerNavButtonSize};
                height: ${tokens.headerNavButtonSize};
              `}
            />
          ) : (
            <button
              type="button"
              aria-label={previousNavLabel}
              disabled={pickerView === 'days' ? prevDisabled : false}
              onClick={() => {
                if (pickerView === 'years') {
                  setSlide(-1);
                  goPrevYearRange();
                  return;
                }
                setSlide(-1);
                goPrevMonth();
              }}
              css={navButtonCss}
              data-slot="prev"
            >
              <svg
                width={parseInt(tokens.headerNavIconSize, 10) || 16}
                height={parseInt(tokens.headerNavIconSize, 10) || 16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <button
            type="button"
            css={pickerToggleCss}
            aria-live="polite"
            data-slot="month-label"
            aria-label={centerButtonLabel}
            aria-pressed={pickerView === 'years'}
            onClick={() => {
              setPickerView((prev) => (prev === 'years' ? 'days' : 'years'));
            }}
          >
            {centerLabel}
          </button>
          {hideNextButton ? (
            <span
              css={css`
                width: ${tokens.headerNavButtonSize};
                height: ${tokens.headerNavButtonSize};
              `}
            />
          ) : (
            <button
              type="button"
              aria-label={nextNavLabel}
              disabled={pickerView === 'days' ? nextDisabled : false}
              onClick={() => {
                if (pickerView === 'years') {
                  setSlide(1);
                  goNextYearRange();
                  return;
                }
                setSlide(1);
                goNextMonth();
              }}
              css={navButtonCss}
              data-slot="next"
            >
              <svg
                width={parseInt(tokens.headerNavIconSize, 10) || 16}
                height={parseInt(tokens.headerNavIconSize, 10) || 16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {pickerView === 'days' ? (
          <>
            <div css={weekdaysCss} role="row" aria-hidden>
              {weekdays.map((label, idx) => (
                <div key={`${label}-${idx}`} css={weekdayCellCss} role="columnheader">
                  {label}
                </div>
              ))}
            </div>

            <div css={gridWrapCss}>
              <div
                ref={gridRef}
                role="grid"
                tabIndex={-1}
                css={gridCss}
                // key 触发动画 re-trigger。
                key={`${monthAnchor.getFullYear()}-${monthAnchor.getMonth()}`}
                onKeyDown={handleGridKeyDown}
                onMouseLeave={handleGridLeave}
                aria-label={labelText}
              >
                {cells.map((c) => {
                  const dateAttr = c.date.toISOString().slice(0, 10);
                  // DateRangePicker 双月视图下，相邻月份 outside cell 渲染为不可交互的 grid 占位，
                  // 避免两个 panel 重复显示同一天的视觉冗余。
                  if (hideOutsideMonth && !c.isCurrentMonth) {
                    return (
                      <span
                        key={dateAttr}
                        aria-hidden
                        data-date={dateAttr}
                        data-outside-placeholder=""
                        css={css`
                          width: ${tokens.cellSize};
                          height: ${tokens.cellSize};
                          display: inline-block;
                        `}
                      />
                    );
                  }
                  // isAnySelected 聚合 single 选中与 range 两端，后续 5 处判断共用。
                  const isAnySelected = c.isSelected || c.isRangeStart || c.isRangeEnd;
                  // 计算 cell 的视觉样式（行内 style 优先于 css 块以避免大量 styled 实例）。
                  const cellInline: CSSProperties = {};
                  // 圆角策略：start/end 的内侧（朝向区间中段的一侧）保持直角，
                  // 与 mid 段浅蓝条无缝拼接；外侧走 rangeEndRadius 圆角。
                  // 单日（isSelected 或 start === end）四角全圆。
                  if (isAnySelected) {
                    const r = tokens.rangeEndRadius;
                    const isStartOnly = c.isRangeStart && !c.isRangeEnd;
                    const isEndOnly = c.isRangeEnd && !c.isRangeStart;
                    if (isStartOnly) {
                      cellInline.borderTopLeftRadius = r;
                      cellInline.borderBottomLeftRadius = r;
                      cellInline.borderTopRightRadius = 0;
                      cellInline.borderBottomRightRadius = 0;
                    } else if (isEndOnly) {
                      cellInline.borderTopRightRadius = r;
                      cellInline.borderBottomRightRadius = r;
                      cellInline.borderTopLeftRadius = 0;
                      cellInline.borderBottomLeftRadius = 0;
                    } else {
                      cellInline.borderRadius = r;
                    }
                  }
                  if (!c.isCurrentMonth && !isAnySelected) {
                    cellInline.color = textDisabled;
                  }
                  if (c.isDisabled) {
                    cellInline.opacity = 0.4;
                    cellInline.cursor = 'not-allowed';
                  }
                  const uniformRadius =
                    cellInline.borderRadius === undefined
                      ? undefined
                      : String(cellInline.borderRadius);
                  const borderTopLeftRadius =
                    cellInline.borderTopLeftRadius === undefined
                      ? uniformRadius
                      : String(cellInline.borderTopLeftRadius);
                  const borderTopRightRadius =
                    cellInline.borderTopRightRadius === undefined
                      ? uniformRadius
                      : String(cellInline.borderTopRightRadius);
                  const borderBottomLeftRadius =
                    cellInline.borderBottomLeftRadius === undefined
                      ? uniformRadius
                      : String(cellInline.borderBottomLeftRadius);
                  const borderBottomRightRadius =
                    cellInline.borderBottomRightRadius === undefined
                      ? uniformRadius
                      : String(cellInline.borderBottomRightRadius);
                  const ariaLabelDay = c.date.toLocaleDateString(locale, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  return (
                    <button
                      key={dateAttr}
                      type="button"
                      role="gridcell"
                      data-date={dateAttr}
                      data-current-month={c.isCurrentMonth || undefined}
                      data-today={c.isToday || undefined}
                      data-selected={isAnySelected || undefined}
                      data-in-range={c.isInRangeMid || undefined}
                      data-preview={c.isPreview || undefined}
                      data-range-start={c.isRangeStart || undefined}
                      data-range-end={c.isRangeEnd || undefined}
                      data-range-bridge-left={c.rangeBridgeLeft || undefined}
                      data-range-bridge-right={c.rangeBridgeRight || undefined}
                      data-preview-bridge-left={c.previewBridgeLeft || undefined}
                      data-preview-bridge-right={c.previewBridgeRight || undefined}
                      data-disabled={c.isDisabled || undefined}
                      aria-selected={isAnySelected}
                      aria-disabled={c.isDisabled || undefined}
                      aria-label={ariaLabelDay}
                      tabIndex={c.isFocused ? 0 : -1}
                      disabled={c.isDisabled}
                      onClick={() => handleCellClick(c.date)}
                      onMouseEnter={() => handleCellEnter(c.date)}
                      onFocus={() => {
                        // grid 内导航后由 useEffect 维护焦点，无需在此回写 focusedDate。
                      }}
                      css={cellBaseCss}
                      style={cellInline}
                    >
                      <span
                        data-slot="day-label"
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          width: '100%',
                          height: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderTopLeftRadius,
                          borderTopRightRadius,
                          borderBottomLeftRadius,
                          borderBottomRightRadius,
                          background: isAnySelected ? primaryBg : 'transparent',
                          color: isAnySelected ? primaryFg : 'inherit',
                        }}
                      >
                        {c.date.getDate()}
                      </span>
                      {c.isToday && !isAnySelected ? (
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            zIndex: 1,
                            width: tokens.cellTodayDotSize,
                            height: tokens.cellTodayDotSize,
                            borderRadius: '50%',
                            background: primaryBg,
                            bottom: tokens.cellTodayDotOffset,
                            left: '50%',
                            transform: 'translateX(-50%)',
                          }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div css={yearGridCss} role="listbox" aria-label={chooseYearLabel}>
            {yearOptions.map((option) => (
              <button
                key={option.year}
                type="button"
                role="option"
                aria-selected={option.selected}
                disabled={option.disabled}
                data-selected={option.selected || undefined}
                css={yearButtonCss}
                onClick={() => handleYearSelect(option.year)}
              >
                {option.year}
              </button>
            ))}
          </div>
        )}

        {showFooter && (showTodayButton || showClearButton || footer) ? (
          <div css={footerCss} data-slot="footer">
            {footer ?? (
              <>
                {showTodayButton ? (
                  <button type="button" css={footerBtnCss} onClick={onToday} data-slot="today">
                    {todayLabel}
                  </button>
                ) : (
                  <span />
                )}
                {showClearButton ? (
                  <button type="button" css={clearBtnCss} onClick={onClear} data-slot="clear">
                    {clearLabel}
                  </button>
                ) : (
                  <span />
                )}
              </>
            )}
          </div>
        ) : null}

        {/* 用于 a11y 描述的隐藏 surface 颜色 hint（不渲染） */}
        <span hidden style={{ background: surfaceBg, color: mutedBg }} />
      </div>
    );
  },
);

(CalendarPanel as unknown as { displayName: string }).displayName = 'TimeUI.CalendarPanel';
