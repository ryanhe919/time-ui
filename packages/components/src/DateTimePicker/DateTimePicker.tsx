'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-24
 * @description DateTimePicker：在 DatePicker 基础上扩展时间选择。
 *              触发器同 DatePicker 是 <Input>（calendar icon endContent），点击打开 <Popover>，
 *              浮层内横向并排：左侧 <CalendarPanel mode="single">（不显示 footer）+ 右侧 <TimePanel>。
 *              分/秒列按 showMinute / showSecond 开关；未开放的字段在 value 中恒为 0 —— 这是用户
 *              要求"可选择性开放"的具体语义，保证下游消费方拿到的永远是完整 Date。
 *              面板底部独立 footer：[Now][Clear][OK]，OK 才关闭（因为时间选择 vs 日期不同，
 *              点一下就关会让调整分秒很难受）。
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
  type FocusEvent,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import { Popover } from '../Popover';
import { Input } from '../Input';
import { CalendarPanel } from '../DatePicker/CalendarPanel';
import { isWithinBounds, startOfMonth } from '../DatePicker/date-utils';
import { TimePanel } from './TimePanel';
import { defaultDateTimeFormat, defaultDateTimeParse, setTime } from './time-utils';
import type { DateTimePickerProps } from './DateTimePicker.types';

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
    <path d="M12 13v4l2 1" />
  </svg>
);

function isChineseLocale(locale?: string): boolean {
  return locale?.toLowerCase().startsWith('zh') ?? false;
}

export const DateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  function DateTimePicker(props, forwardedRef) {
    const {
      value,
      defaultValue,
      onChange,
      isOpen,
      defaultOpen = false,
      onOpenChange,
      placement = 'bottom-start',
      size = 'md',
      minValue,
      maxValue,
      isDateUnavailable,
      weekStartsOn = 0,
      locale,
      format,
      parse,
      placeholder,
      isReadOnly = false,
      isDisabled = false,
      isInvalid = false,
      isClearable = false,
      showTodayButton: _showTodayButton = true, // eslint-disable-line @typescript-eslint/no-unused-vars
      startContent,
      endContent,
      portalContainer: _portalContainer, // eslint-disable-line @typescript-eslint/no-unused-vars
      className,
      style,
      id: idProp,
      'aria-label': ariaLabel,
      showMinute = true,
      showSecond = false,
      hourStep = 1,
      minuteStep = 1,
      secondStep = 1,
      is12Hour = false,
      showNowButton = true,
      showConfirmButton = true,
      nowLabel,
      confirmLabel,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.datePicker;
    const isZh = isChineseLocale(locale);
    const resolvedPlaceholder = placeholder ?? (isZh ? '选择日期时间' : 'Select date and time');
    const openCalendarLabel = isZh ? '打开日期时间选择器' : 'Open date time picker';
    const inputAriaLabel = ariaLabel ?? (isZh ? '日期时间' : 'Date time');
    const pickerAriaLabel = ariaLabel ?? (isZh ? '日期时间选择器' : 'Date time picker');
    const resolvedNowLabel = nowLabel ?? (isZh ? '此刻' : 'Now');
    const resolvedConfirmLabel = confirmLabel ?? (isZh ? '确定' : 'OK');
    const resolvedClearLabel = isZh ? '清除' : 'Clear';

    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = idProp ?? `timeui-datetimepicker-${safeAutoId}`;

    // ── value 受控/非受控 ──
    const [currentValue, setCurrentValue] = useControllableState<Date | null>({
      value: value === undefined ? undefined : value,
      defaultValue: (value !== undefined ? undefined : (defaultValue ?? null)) as Date | null,
      onChange,
      name: 'DateTimePicker.value',
    });

    // ── open 受控/非受控 ──
    const [open, setOpen] = useControllableState<boolean>({
      value: isOpen,
      defaultValue: (isOpen !== undefined ? undefined : defaultOpen) as boolean,
      onChange: onOpenChange,
      name: 'DateTimePicker.isOpen',
    });

    // ── draft：面板打开期间的"未 commit"选择。关闭面板前 OK 才真正写入 currentValue。
    // 同时承担日历点击 → 时间调整这段 UI 反馈。
    const [draftValue, setDraftValue] = useState<Date | null>(null);
    // 每次面板打开都同步一次 draft（初始从当前 value 拉取；若为空则用"今天此刻"兜底）。
    useEffect(() => {
      if (open) {
        const seed = currentValue ?? sanitizeFromNow();
        setDraftValue(applyGranularity(seed, showMinute, showSecond));
      }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // panel / anchor ref
    const panelRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // ── ESC / click-outside ──
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

    // ── format / parse ──
    const formatter = useMemo(
      () =>
        format ??
        ((d: Date) => defaultDateTimeFormat(d, { showMinute, showSecond, is12Hour, locale })),
      [format, showMinute, showSecond, is12Hour, locale],
    );
    const parser = useMemo(() => parse ?? defaultDateTimeParse, [parse]);

    const formattedFromValue = currentValue ? formatter(currentValue) : '';
    const [inputDraft, setInputDraft] = useState<string | null>(null);
    const inputText = inputDraft ?? formattedFromValue;

    const commitParsedIfValid = useCallback(
      (text: string) => {
        if (text === '') {
          setCurrentValue(null);
          return;
        }
        const parsed = parser(text);
        if (parsed && isWithinBounds(parsed, minValue, maxValue) && !isDateUnavailable?.(parsed)) {
          setCurrentValue(applyGranularity(parsed, showMinute, showSecond));
        }
      },
      [parser, minValue, maxValue, isDateUnavailable, setCurrentValue, showMinute, showSecond],
    );

    const handleInputChange = useCallback(
      (text: string) => {
        setInputDraft(text);
        commitParsedIfValid(text);
      },
      [commitParsedIfValid],
    );

    const handleInputBlur = useCallback((_e: FocusEvent<HTMLInputElement>) => {
      setInputDraft(null);
    }, []);

    const handleClear = useCallback(() => {
      setCurrentValue(null);
      setInputDraft(null);
    }, [setCurrentValue]);

    const initialAnchor = useMemo(
      () => startOfMonth(currentValue ?? new Date()),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    // 日历日期变更：只改 draft 的 y/m/d，保留 h/m/s。若 draft 尚未初始化，用新日期 + 当下时间兜底。
    const handleSelectDate = useCallback(
      (d: Date) => {
        setDraftValue((prev) => {
          const base = prev ?? sanitizeFromNow();
          return applyGranularity(
            setTime(d, base.getHours(), base.getMinutes(), base.getSeconds()),
            showMinute,
            showSecond,
          );
        });
      },
      [showMinute, showSecond],
    );

    // 时间列点击 → 仅改 draft 的时间部分，保留 y/m/d。
    const handleHourChange = useCallback(
      (nextHour: number) => {
        setDraftValue((prev) => {
          const base = prev ?? sanitizeFromNow();
          return applyGranularity(
            setTime(base, nextHour, base.getMinutes(), base.getSeconds()),
            showMinute,
            showSecond,
          );
        });
      },
      [showMinute, showSecond],
    );
    const handleMinuteChange = useCallback(
      (nextMinute: number) => {
        setDraftValue((prev) => {
          const base = prev ?? sanitizeFromNow();
          return applyGranularity(
            setTime(base, base.getHours(), nextMinute, base.getSeconds()),
            showMinute,
            showSecond,
          );
        });
      },
      [showMinute, showSecond],
    );
    const handleSecondChange = useCallback(
      (nextSecond: number) => {
        setDraftValue((prev) => {
          const base = prev ?? sanitizeFromNow();
          return applyGranularity(
            setTime(base, base.getHours(), base.getMinutes(), nextSecond),
            showMinute,
            showSecond,
          );
        });
      },
      [showMinute, showSecond],
    );

    // ── footer 按钮 ──
    const handleNow = useCallback(() => {
      const now = applyGranularity(new Date(), showMinute, showSecond);
      if (!isWithinBounds(now, minValue, maxValue)) return;
      if (isDateUnavailable?.(now)) return;
      setDraftValue(now);
    }, [minValue, maxValue, isDateUnavailable, showMinute, showSecond]);

    const handleFooterClear = useCallback(() => {
      setDraftValue(null);
      setCurrentValue(null);
      setInputDraft(null);
      setOpen(false);
    }, [setCurrentValue, setOpen]);

    const handleConfirm = useCallback(() => {
      // draft 为 null 视作清空；否则做一次 bounds / unavailable 终检。
      if (draftValue == null) {
        setCurrentValue(null);
      } else {
        if (!isWithinBounds(draftValue, minValue, maxValue)) return;
        if (isDateUnavailable?.(draftValue)) return;
        setCurrentValue(applyGranularity(draftValue, showMinute, showSecond));
      }
      setInputDraft(null);
      setOpen(false);
    }, [
      draftValue,
      minValue,
      maxValue,
      isDateUnavailable,
      setCurrentValue,
      setOpen,
      showMinute,
      showSecond,
    ]);

    // ── 触发器端图标按钮 ──
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
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${theme.colors.focus};
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

    const inputEndContent: ReactNode = (
      <>
        {endContent}
        <button
          type="button"
          css={calendarBtnCss}
          onClick={handleCalendarIconClick}
          disabled={isDisabled || isReadOnly}
          aria-label={openCalendarLabel}
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
        data-timeui-datetimepicker=""
        data-disabled={isDisabled || undefined}
        data-readonly={isReadOnly || undefined}
      >
        <Input
          size={size}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setOpen(false);
            } else if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          onBlur={handleInputBlur}
          placeholder={resolvedPlaceholder}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isInvalid={isInvalid}
          isClearable={isClearable}
          onClear={handleClear}
          startContent={startContent}
          endContent={inputEndContent}
          aria-label={inputAriaLabel}
          id={baseId}
        />
      </div>
    );

    // ── panel 样式 ──
    const panelCss = css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-width: ${tokens.panelMinWidth};
      padding: ${tokens.panelPaddingY} ${tokens.panelPaddingX};
      background: ${theme.colors.bg.surface ?? theme.colors.bg.canvas};
      color: ${theme.colors.text.primary};
      border-radius: ${tokens.panelRadius};
      box-shadow: ${theme.mode === 'dark' ? tokens.shadowDark : tokens.shadow};
      margin: -${theme.components.popover.paddingY} -${theme.components.popover.paddingX};
    `;

    // Lock body height to the calendar's natural height so the time columns
    // can't push the layout taller than the date grid. Calendar = header
    // (+headerGap margin) + weekdays (+4px margin) + 6 rows × cellSize + 5 gaps.
    const calendarHeight = `calc(${tokens.headerHeight} + ${tokens.headerGap} + ${tokens.weekdayHeight} + 4px + 6 * ${tokens.cellSize} + 5 * ${tokens.cellGap})`;

    const bodyCss = css`
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: ${tokens.panelGap};
      height: ${calendarHeight};
      min-height: 0;
    `;

    const rightPaneCss = css`
      display: flex;
      flex-direction: column;
      padding-left: ${tokens.panelGap};
      border-left: 1px solid ${theme.colors.border.subtle};
      align-self: stretch;
    `;

    const footerCss = css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${tokens.footerGap};
      height: ${tokens.footerHeight};
      padding: 0 ${tokens.footerPaddingX};
      border-top: ${tokens.footerBorderTop} solid ${theme.colors.border.subtle};
      margin: ${tokens.headerGap} -${tokens.panelPaddingX} -${tokens.panelPaddingY};
      margin-top: ${tokens.headerGap};
    `;

    const primaryBtnCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 14px;
      border: 0;
      border-radius: 6px;
      background: ${theme.colors.primary[500]};
      color: ${theme.colors.primary.foreground};
      font: inherit;
      font-size: ${tokens.cellFontSize};
      font-weight: 500;
      cursor: pointer;
      transition: background-color 120ms ease;
      &:hover:not(:disabled) {
        background: ${theme.colors.primary[600] ?? theme.colors.primary[500]};
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${theme.colors.focus};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const ghostBtnCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 12px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: ${theme.colors.primary[500]};
      font: inherit;
      font-size: ${tokens.cellFontSize};
      font-weight: 500;
      cursor: pointer;
      transition: background-color 120ms ease;
      &:hover:not(:disabled) {
        background: ${theme.colors.primary[100]};
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${theme.colors.focus};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const clearBtnCss = css`
      ${ghostBtnCss}
      color: ${theme.colors.danger[500]};
      &:hover:not(:disabled) {
        background: ${theme.colors.danger[100]};
      }
    `;

    const popoverStyle: React.CSSProperties = {
      width: 'max-content',
      maxWidth: 'calc(100vw - 32px)',
    };

    // draft 为空时给 TimePanel 一个安全回退，避免 DOM 渲染空列。
    const draftForTime = draftValue ?? sanitizeFromNow();

    return (
      <Popover
        anchor={anchorElement}
        isOpen={open}
        placement={placement}
        hasArrow={false}
        trigger="manual"
        offset={parseInt(tokens.panelOffset, 10) || 8}
        id={`${baseId}-panel`}
        aria-label={pickerAriaLabel}
        style={popoverStyle}
      >
        <div ref={panelRef} css={panelCss} data-slot="datetimepicker-panel">
          <div css={bodyCss}>
            <CalendarPanel
              mode="single"
              selected={draftValue}
              defaultMonthAnchor={initialAnchor}
              onSelectDate={handleSelectDate}
              minValue={minValue}
              maxValue={maxValue}
              isDateUnavailable={isDateUnavailable}
              weekStartsOn={weekStartsOn}
              locale={locale}
              showFooter={false}
              aria-label={isZh ? '日期' : 'Date'}
            />
            <div css={rightPaneCss}>
              <TimePanel
                hour={draftForTime.getHours()}
                minute={draftForTime.getMinutes()}
                second={draftForTime.getSeconds()}
                onHourChange={handleHourChange}
                onMinuteChange={handleMinuteChange}
                onSecondChange={handleSecondChange}
                showMinute={showMinute}
                showSecond={showSecond}
                is12Hour={is12Hour}
                hourStep={hourStep}
                minuteStep={minuteStep}
                secondStep={secondStep}
                locale={locale}
              />
            </div>
          </div>
          <div css={footerCss} data-slot="datetimepicker-footer">
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {showNowButton ? (
                <button
                  type="button"
                  css={ghostBtnCss}
                  onClick={handleNow}
                  data-slot="now"
                  aria-label={resolvedNowLabel}
                >
                  {resolvedNowLabel}
                </button>
              ) : null}
              {isClearable ? (
                <button
                  type="button"
                  css={clearBtnCss}
                  onClick={handleFooterClear}
                  data-slot="clear"
                  aria-label={resolvedClearLabel}
                >
                  {resolvedClearLabel}
                </button>
              ) : null}
            </div>
            {showConfirmButton ? (
              <button
                type="button"
                css={primaryBtnCss}
                onClick={handleConfirm}
                data-slot="confirm"
                aria-label={resolvedConfirmLabel}
              >
                {resolvedConfirmLabel}
              </button>
            ) : null}
          </div>
        </div>
      </Popover>
    );
  },
);

(DateTimePicker as unknown as { displayName: string }).displayName = 'TimeUI.DateTimePicker';

/** "此刻"：当前日期 + 当前时间（仅作 draft 兜底，最终仍经 applyGranularity 清零未开放的字段）。 */
function sanitizeFromNow(): Date {
  return new Date();
}

/**
 * 按 showMinute / showSecond 的开关清零未开放字段：
 * - showMinute=false → 分钟、秒、毫秒全部 0
 * - showSecond=false → 秒、毫秒 0，分钟保留
 * - 都 true → 仅毫秒 0
 */
function applyGranularity(d: Date, showMinute: boolean, showSecond: boolean): Date {
  if (!showMinute) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0);
  }
  if (!showSecond) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0, 0);
  }
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    0,
  );
}
