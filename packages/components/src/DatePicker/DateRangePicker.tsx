'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 DateRangePicker：与 DatePicker 共享 Input + Popover + CalendarPanel。
 *              内部状态机：(start | hoverEnd) → 点击第一次 set start；点击第二次 set end，
 *              触发 onChange({start, end})；end < start 自动交换。支持 visibleMonths=1|2、presets。
 *              presets 列复用 <MenuRow>（来自 ../Menu）—— 共享 hover/disabled/字号视觉规则。
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import { Popover } from '../Popover';
import { Input } from '../Input';
import { MenuRow } from '../Menu';
import { CalendarPanel } from './CalendarPanel';
import {
  addMonths,
  defaultFormat,
  isWithinBounds,
  normalizeRange,
  startOfDay,
  startOfMonth,
} from './date-utils';
import type { DateRangePickerProps, DateRangeValue } from './DatePicker.types';

const CalendarIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    focusable={false}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(props, forwardedRef) {
    const {
      value,
      defaultValue,
      onChange,
      isOpen,
      defaultIsOpen = false,
      onOpenChange,
      placement = 'bottom-start',
      size = 'md',
      minValue,
      maxValue,
      isDateUnavailable,
      weekStartsOn = 0,
      locale,
      format,
      placeholder = 'Select a date range',
      isReadOnly = false,
      isDisabled = false,
      isInvalid = false,
      isClearable = false,
      showTodayButton = false,
      startContent,
      endContent,
      portalContainer: _portalContainer, // eslint-disable-line @typescript-eslint/no-unused-vars
      className,
      style,
      id: idProp,
      'aria-label': ariaLabel,
      visibleMonths = 2,
      presets,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.datePicker;

    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = idProp ?? `timeui-daterangepicker-${safeAutoId}`;

    // ── value 受控/非受控 ──
    const [currentValue, setCurrentValue] = useControllableState<DateRangeValue | null>({
      value: value === undefined ? undefined : value,
      defaultValue: (value !== undefined
        ? undefined
        : (defaultValue ?? null)) as DateRangeValue | null,
      onChange,
      name: 'DateRangePicker.value',
    });

    // ── open ──
    const [open, setOpen] = useControllableState<boolean>({
      value: isOpen,
      defaultValue: (isOpen !== undefined ? undefined : defaultIsOpen) as boolean,
      onChange: onOpenChange,
      name: 'DateRangePicker.isOpen',
    });

    const panelRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // ── ESC + click outside 关闭（trigger='manual' 模式下自管） ──
    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setOpen(false);
        }
      };
      const onMouseDown = (e: MouseEvent) => {
        const target = e.target as Node | null;
        if (!target) return;
        if (containerRef.current?.contains(target)) return;
        if (panelRef.current?.contains(target)) return;
        setOpen(false);
      };
      window.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onMouseDown);
      return () => {
        window.removeEventListener('keydown', onKey);
        document.removeEventListener('mousedown', onMouseDown);
      };
    }, [open, setOpen]);

    // ── 内部状态机：working start + hoverEnd ──
    // 当 working.start !== null 且 working.end === null 时表示等待第二次点击。
    const [workingStart, setWorkingStart] = useState<Date | null>(null);
    const [hoverEnd, setHoverEnd] = useState<Date | null>(null);

    const formatter = useMemo(
      () => format ?? ((d: Date) => defaultFormat(d, locale)),
      [format, locale],
    );

    const inputText = useMemo(() => {
      if (!currentValue) return '';
      return `${formatter(currentValue.start)} – ${formatter(currentValue.end)}`;
    }, [currentValue, formatter]);

    // ── 月份 anchor（左侧 panel；右侧固定为 anchor+1） ──
    const initialAnchor = useMemo(
      () => startOfMonth(currentValue?.start ?? new Date()),
      // 仅 mount 时一次
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );
    const [leftAnchor, setLeftAnchor] = useState<Date>(initialAnchor);
    const rightAnchor = useMemo(() => addMonths(leftAnchor, 1), [leftAnchor]);

    // 双月时左/右 panel 同步导航：左 anchor 改变即可，右自动衍生。
    const handleLeftAnchorChange = useCallback((next: Date) => {
      setLeftAnchor(startOfMonth(next));
    }, []);
    const handleRightAnchorChange = useCallback((next: Date) => {
      // 右 panel 切月时 → 左 panel 跟随 -1。
      setLeftAnchor(addMonths(startOfMonth(next), -1));
    }, []);

    // ── 选择处理 ──
    const handleSelectDate = useCallback(
      (date: Date) => {
        if (!isWithinBounds(date, minValue, maxValue)) return;
        if (isDateUnavailable?.(date)) return;
        const d = startOfDay(date);

        if (workingStart === null) {
          // 第一次点击 → 设 start，等第二次。
          setWorkingStart(d);
          setHoverEnd(null);
          // 同时也把 currentValue 临时置为单点（不调 onChange）。
          // 设计上：只有第二次点击才正式 onChange。
          return;
        }

        // 第二次点击 → 完成 range；可能反向，需要 normalize。
        const normalized = normalizeRange({ start: workingStart, end: d });
        setWorkingStart(null);
        setHoverEnd(null);
        setCurrentValue(normalized);
        setOpen(false);
      },
      [workingStart, minValue, maxValue, isDateUnavailable, setCurrentValue, setOpen],
    );

    const handleHoverDate = useCallback(
      (date: Date | null) => {
        if (workingStart === null) return;
        setHoverEnd(date);
      },
      [workingStart],
    );

    const handleClear = useCallback(() => {
      setCurrentValue(null);
      setWorkingStart(null);
      setHoverEnd(null);
    }, [setCurrentValue]);

    const handleCalendarClear = useCallback(() => {
      setCurrentValue(null);
      setWorkingStart(null);
      setHoverEnd(null);
      setOpen(false);
    }, [setCurrentValue, setOpen]);

    const handleToday = useCallback(() => {
      const today = startOfDay(new Date());
      if (!isWithinBounds(today, minValue, maxValue)) return;
      const next = { start: today, end: today };
      setCurrentValue(next);
      setWorkingStart(null);
      setHoverEnd(null);
      setOpen(false);
    }, [minValue, maxValue, setCurrentValue, setOpen]);

    // 当外部 value 变化时，把 leftAnchor 也同步到新 start 所在月（仅在 panel 关闭后）。
    // 本轮简化：只在打开 popover 时由 initialAnchor 决定，运行中不强制同步。

    // ── 选 preset ──
    const handlePresetClick = useCallback(
      (rangeVal: DateRangeValue) => {
        const normalized = normalizeRange({
          start: startOfDay(rangeVal.start),
          end: startOfDay(rangeVal.end),
        });
        setCurrentValue(normalized);
        setWorkingStart(null);
        setHoverEnd(null);
        setLeftAnchor(startOfMonth(normalized.start));
        setOpen(false);
      },
      [setCurrentValue, setOpen],
    );

    // ── 输入框端图标按钮 ──
    const iconSize = parseInt(tokens.inputIconSize, 10) || 16;
    const calendarBtnCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      width: ${iconSize + 4}px;
      height: ${iconSize + 4}px;
      border: 0;
      background: transparent;
      color: ${theme.colors.text.muted};
      cursor: pointer;
      border-radius: 4px;
      margin-left: ${tokens.inputCalendarOffset};
      &:hover:not(:disabled) {
        color: ${theme.colors.text.primary};
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      &:focus-visible {
        outline: 2px solid ${theme.colors.focus};
        outline-offset: 1px;
      }
    `;

    const handleCalendarIconClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDisabled || isReadOnly) return;
        setOpen(!open);
      },
      [isDisabled, isReadOnly, open, setOpen],
    );

    const showClear = isClearable && currentValue !== null && !isDisabled && !isReadOnly;
    const inputEndContent: ReactNode = (
      <>
        {endContent}
        {showClear ? (
          <button
            type="button"
            css={calendarBtnCss}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClear();
            }}
            aria-label="Clear"
            data-slot="clear"
            tabIndex={-1}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              focusable={false}
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          css={calendarBtnCss}
          onClick={handleCalendarIconClick}
          disabled={isDisabled || isReadOnly}
          aria-label="Open calendar"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? `${baseId}-panel` : undefined}
          data-slot="calendar-trigger"
          tabIndex={-1}
        >
          <CalendarIcon size={iconSize} />
        </button>
      </>
    );

    useImperativeHandle(forwardedRef, () => containerRef.current as HTMLDivElement, []);

    const anchorElement = (
      <div
        ref={containerRef}
        className={className}
        style={style}
        data-timeui-daterangepicker=""
        data-disabled={isDisabled || undefined}
        data-readonly={isReadOnly || undefined}
      >
        <Input
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          value={inputText}
          isReadOnly
          onChange={() => {
            // range 输入暂不支持手动键入解析（双日期 + 分隔符解析复杂；后续接入）。
          }}
          onKeyDown={(e) => {
            if ((e.key === 'ArrowDown' || e.key === 'Enter') && !open) {
              e.preventDefault();
              if (!isDisabled && !isReadOnly) setOpen(true);
            }
          }}
          placeholder={placeholder}
          isDisabled={isDisabled}
          isInvalid={isInvalid}
          startContent={startContent}
          endContent={inputEndContent}
          aria-label={ariaLabel ?? 'Date range'}
          id={baseId}
        />
      </div>
    );

    // ── range 给 CalendarPanel 用：合并 working start + currentValue ──
    const calendarRange = useMemo(() => {
      if (workingStart) {
        return { start: workingStart, end: null };
      }
      if (currentValue) {
        return { start: currentValue.start, end: currentValue.end };
      }
      return { start: null, end: null };
    }, [workingStart, currentValue]);

    // ── styles ──
    const isRange = visibleMonths === 2;
    const panelMin = isRange ? tokens.panelRangeMinWidth : tokens.panelMinWidth;

    const panelCss = css`
      box-sizing: border-box;
      min-width: ${panelMin};
      padding: ${tokens.panelPaddingY} ${tokens.panelPaddingX};
      background: ${theme.colors.bg.surface ?? theme.colors.bg.canvas};
      color: ${theme.colors.text.primary};
      border-radius: ${tokens.panelRadius};
      box-shadow: ${theme.mode === 'dark' ? tokens.shadowDark : tokens.shadow};
      margin: -${theme.components.popover.paddingY} -${theme.components.popover.paddingX};
      display: flex;
      gap: ${tokens.panelGap};
    `;

    const presetsListCss = css`
      flex: none;
      width: 160px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-right: ${tokens.panelGap};
      border-right: 1px solid ${theme.colors.border.subtle};
      max-height: 320px;
      overflow-y: auto;
    `;

    const calendarsRowCss = css`
      flex: 1;
      display: flex;
      gap: ${tokens.panelGap};
    `;

    return (
      <Popover
        anchor={anchorElement}
        isOpen={open}
        placement={placement}
        withArrow={false}
        trigger="manual"
        offset={parseInt(tokens.panelOffset, 10) || 8}
        id={`${baseId}-panel`}
        aria-label={ariaLabel ?? 'Date range picker'}
      >
        <div ref={panelRef} css={panelCss} data-slot="daterangepicker-panel">
          {presets && presets.length > 0 ? (
            <div css={presetsListCss} role="listbox" aria-label="Presets" data-slot="presets">
              {presets.map((p, i) => (
                <MenuRow
                  key={i}
                  item={{
                    key: `preset-${i}`,
                    label: p.label,
                  }}
                  index={i}
                  baseId={`${baseId}-preset`}
                  isHighlighted={false}
                  selectionMode="none"
                  onSelect={() => handlePresetClick(p.value)}
                />
              ))}
            </div>
          ) : null}

          <div css={calendarsRowCss}>
            <CalendarPanel
              mode="range"
              range={calendarRange}
              hoverEnd={hoverEnd}
              monthAnchor={leftAnchor}
              onMonthAnchorChange={handleLeftAnchorChange}
              onSelectDate={handleSelectDate}
              onHoverDate={handleHoverDate}
              onToday={handleToday}
              onClear={handleCalendarClear}
              minValue={minValue}
              maxValue={maxValue}
              isDateUnavailable={isDateUnavailable}
              weekStartsOn={weekStartsOn}
              locale={locale}
              showFooter={!isRange}
              showTodayButton={showTodayButton}
              showClearButton={isClearable}
              hideNextButton={isRange}
              aria-label="Start month"
            />
            {isRange ? (
              <CalendarPanel
                mode="range"
                range={calendarRange}
                hoverEnd={hoverEnd}
                monthAnchor={rightAnchor}
                onMonthAnchorChange={handleRightAnchorChange}
                onSelectDate={handleSelectDate}
                onHoverDate={handleHoverDate}
                onToday={handleToday}
                onClear={handleCalendarClear}
                minValue={minValue}
                maxValue={maxValue}
                isDateUnavailable={isDateUnavailable}
                weekStartsOn={weekStartsOn}
                locale={locale}
                showFooter
                showTodayButton={showTodayButton}
                showClearButton={isClearable}
                hidePrevButton
                aria-label="End month"
              />
            ) : null}
          </div>
        </div>
      </Popover>
    );
  },
);

(DateRangePicker as unknown as { displayName: string }).displayName = 'TimeUI.DateRangePicker';
