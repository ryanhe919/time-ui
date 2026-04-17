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
  isInRangeExclusive,
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
      footer,
      'aria-label': ariaLabel,
      className,
      style,
      id: idProp,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.datePicker;

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
        outline: 2px solid ${focusColor};
        outline-offset: 1px;
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
      user-select: none;
      transition:
        background-color 120ms ease,
        color 120ms ease;
      &:hover:not([data-disabled='true']):not([data-selected='true']) {
        background: ${hoverBg};
      }
      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: -2px;
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
        outline: 2px solid ${focusColor};
        outline-offset: 1px;
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
      return matrix.map((cell) => {
        const isCurrentMonth = cell.isCurrentMonth;
        const isToday = isSameDay(cell.date, today);
        const isSelectedCell = mode === 'single' && isSameDay(cell.date, selected);
        const isUnavailable = isDateUnavailable?.(cell.date) ?? false;
        const isOutOfBounds = !isWithinBounds(cell.date, minValue, maxValue);
        const isDisabled = isUnavailable || isOutOfBounds;
        const isFocused = isSameDay(cell.date, focusedDate);

        // range 高亮
        let isRangeStart = false;
        let isRangeEnd = false;
        let isInRangeMid = false;
        let isPreview = false;
        if (mode === 'range') {
          const rStart = range?.start ?? null;
          const rEnd = range?.end ?? null;
          if (rStart && rEnd) {
            isRangeStart = isSameDay(cell.date, rStart) || isSameDay(cell.date, rEnd);
            isRangeEnd = isRangeStart;
            isInRangeMid = isInRangeExclusive(cell.date, rStart, rEnd);
          } else if (rStart && !rEnd) {
            isRangeStart = isSameDay(cell.date, rStart);
            // hover preview
            if (hoverEnd && !isSameDay(cell.date, rStart)) {
              isPreview = isInRange(cell.date, rStart, hoverEnd);
              // 端点不算 preview-mid
              if (isSameDay(cell.date, hoverEnd)) {
                isPreview = true;
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

    return (
      <div
        ref={forwardedRef}
        id={baseId}
        className={className}
        style={style}
        aria-label={ariaLabel ?? 'Calendar'}
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
              aria-label="Previous month"
              disabled={prevDisabled}
              onClick={() => {
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
          <div
            css={monthLabelCss}
            aria-live="polite"
            data-slot="month-label"
            // TODO: 点击进入 month/year picker（本轮未实现）。
          >
            {labelText}
          </div>
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
              aria-label="Next month"
              disabled={nextDisabled}
              onClick={() => {
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
              // 计算 cell 的视觉样式（行内 style 优先于 css 块以避免大量 styled 实例）。
              const cellInline: CSSProperties = {};
              if (c.isSelected || c.isRangeStart || c.isRangeEnd) {
                cellInline.background = primaryBg;
                cellInline.color = primaryFg;
                cellInline.borderRadius = tokens.rangeEndRadius;
              } else if (c.isInRangeMid) {
                cellInline.background = primarySoft;
                cellInline.borderRadius = tokens.rangeBgRadius;
              } else if (c.isPreview) {
                cellInline.background = primarySoft;
                cellInline.opacity = tokens.rangePreviewOpacity;
                cellInline.borderRadius = tokens.rangeBgRadius;
              }
              if (!c.isCurrentMonth && !c.isSelected && !c.isRangeStart && !c.isRangeEnd) {
                cellInline.color = textDisabled;
              }
              if (c.isDisabled) {
                cellInline.opacity = 0.4;
                cellInline.cursor = 'not-allowed';
              }
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
                  data-selected={c.isSelected || c.isRangeStart || c.isRangeEnd || undefined}
                  data-in-range={c.isInRangeMid || undefined}
                  data-preview={c.isPreview || undefined}
                  data-disabled={c.isDisabled || undefined}
                  aria-selected={c.isSelected || c.isRangeStart || c.isRangeEnd}
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
                  {c.date.getDate()}
                  {c.isToday && !c.isSelected && !c.isRangeStart && !c.isRangeEnd ? (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
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

        {showFooter && (showTodayButton || showClearButton || footer) ? (
          <div css={footerCss} data-slot="footer">
            {footer ?? (
              <>
                {showTodayButton ? (
                  <button type="button" css={footerBtnCss} onClick={onToday} data-slot="today">
                    {TODAY_LABEL}
                  </button>
                ) : (
                  <span />
                )}
                {showClearButton ? (
                  <button type="button" css={clearBtnCss} onClick={onClear} data-slot="clear">
                    {CLEAR_LABEL}
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
