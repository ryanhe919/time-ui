'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 DatePicker：触发器是 <Input>（calendar icon endContent），
 *              点击打开 <Popover>，浮层内 <CalendarPanel>。受控/非受控双轨 value + isOpen。
 *              支持 minValue / maxValue / isDateUnavailable / isClearable / showTodayButton / format / parse。
 *              依赖：Popover（portal/定位/ESC/点击外部关闭）+ Input（统一触发器视觉）。
 *              本组件不实现 month/year picker（保留 TODO），不实现 time picker。
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
  type ChangeEvent,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import { Popover } from '../Popover';
import { Input } from '../Input';
import { CalendarPanel } from './CalendarPanel';
import {
  defaultFormat,
  defaultParse,
  isWithinBounds,
  startOfDay,
  startOfMonth,
} from './date-utils';
import type { DatePickerProps } from './DatePicker.types';

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

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(props, forwardedRef) {
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
      parse,
      placeholder = 'Select a date',
      isReadOnly = false,
      isDisabled = false,
      isInvalid = false,
      isClearable = false,
      showTodayButton = true,
      startContent,
      endContent,
      portalContainer: _portalContainer, // eslint-disable-line @typescript-eslint/no-unused-vars
      className,
      style,
      id: idProp,
      'aria-label': ariaLabel,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.datePicker;

    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = idProp ?? `timeui-datepicker-${safeAutoId}`;

    // ── value 受控/非受控 ──
    const [currentValue, setCurrentValue] = useControllableState<Date | null>({
      value: value === undefined ? undefined : value,
      // 受控时 defaultValue 置 undefined，避免 useControllableState 的双值警告。
      defaultValue: (value !== undefined ? undefined : (defaultValue ?? null)) as Date | null,
      onChange,
      name: 'DatePicker.value',
    });

    // ── open 受控/非受控 ──
    const [open, setOpen] = useControllableState<boolean>({
      value: isOpen,
      defaultValue: (isOpen !== undefined ? undefined : defaultIsOpen) as boolean,
      onChange: onOpenChange,
      name: 'DatePicker.isOpen',
    });

    // 浮层 panel 的 DOM ref（用于 click-outside 判定）。
    const panelRef = useRef<HTMLDivElement | null>(null);
    // anchor 的 DOM ref（input wrapper）。
    const containerRef = useRef<HTMLDivElement | null>(null);

    // ── ESC 关闭（Popover trigger='manual' 模式下不再代为处理 ESC，自管） ──
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

    // ── 输入框文本：受控显示 ──
    // 当用户在 input 中键入时，缓存 raw text；只有合法 parse 才更新 value。
    const formatter = useMemo(
      () => format ?? ((d: Date) => defaultFormat(d, locale)),
      [format, locale],
    );
    const parser = useMemo(() => parse ?? defaultParse, [parse]);

    const formattedFromValue = currentValue ? formatter(currentValue) : '';
    const [draft, setDraft] = useState<string | null>(null);
    const inputText = draft ?? formattedFromValue;

    const handleInputChange = useCallback(
      (text: string) => {
        setDraft(text);
        if (text === '') {
          // 空 → 立即清除
          setCurrentValue(null);
          return;
        }
        const parsed = parser(text);
        if (parsed && isWithinBounds(parsed, minValue, maxValue) && !isDateUnavailable?.(parsed)) {
          setCurrentValue(startOfDay(parsed));
        }
      },
      [parser, minValue, maxValue, isDateUnavailable, setCurrentValue],
    );

    const handleInputBlur = useCallback((_e: FocusEvent<HTMLInputElement>) => {
      // 失焦时把 draft 丢弃，回到 value 的格式化文本（确保不一致时回滚）。
      setDraft(null);
    }, []);

    const handleInputFocus = useCallback(() => {
      // 暂不打开 popover —— 避免点击 input 还没释放就打开浮层导致 click 关掉它。
    }, []);

    const handleClear = useCallback(() => {
      setCurrentValue(null);
      setDraft(null);
    }, [setCurrentValue]);

    // ── CalendarPanel callbacks ──
    const initialAnchor = useMemo(
      () => startOfMonth(currentValue ?? new Date()),
      // 仅在 mount 时取一次；后续 anchor 由 CalendarPanel 内部维护。
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    const handleSelectDate = useCallback(
      (d: Date) => {
        setCurrentValue(startOfDay(d));
        setDraft(null);
        setOpen(false);
      },
      [setCurrentValue, setOpen],
    );

    const handleToday = useCallback(() => {
      const today = startOfDay(new Date());
      if (!isWithinBounds(today, minValue, maxValue)) return;
      if (isDateUnavailable?.(today)) return;
      setCurrentValue(today);
      setDraft(null);
      setOpen(false);
    }, [minValue, maxValue, isDateUnavailable, setCurrentValue, setOpen]);

    const handleCalendarClear = useCallback(() => {
      setCurrentValue(null);
      setDraft(null);
      setOpen(false);
    }, [setCurrentValue, setOpen]);

    // ── 输入框端图标按钮（点击切换 popover） ──
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

    const inputEndContent: ReactNode = (
      <>
        {endContent}
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

    // forwardRef → 把 anchor 容器 ref 暴露出去。
    useImperativeHandle(forwardedRef, () => containerRef.current as HTMLDivElement, []);

    // 包装 anchor：Popover 会克隆并挂上事件 + ref，但我们已经有 Input 控制元素。
    // 用一个 wrapper div 作为 anchor —— popover 会把事件挂到 wrapper 上；
    // 但 trigger='click' 默认会把 click 转成 toggle，需要避免与 input 输入冲突。
    // 我们改用 trigger='manual' + 自管开关。
    const anchorElement = (
      <div
        ref={containerRef}
        className={className}
        style={style}
        data-timeui-datepicker=""
        data-disabled={isDisabled || undefined}
        data-readonly={isReadOnly || undefined}
      >
        <Input
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          value={inputText}
          onChange={handleInputChange}
          onChangeEvent={(e: ChangeEvent<HTMLInputElement>) => {
            // value-only 的 onChange 已经处理；保留以供消费者扩展。
            void e;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // 把当前 draft 作为正式值（已在 onChange 中即时 parse）。
              setOpen(false);
            } else if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isInvalid={isInvalid}
          isClearable={isClearable}
          onClear={handleClear}
          startContent={startContent}
          endContent={inputEndContent}
          aria-label={ariaLabel ?? 'Date'}
          id={baseId}
        />
      </div>
    );

    const panelCss = css`
      box-sizing: border-box;
      min-width: ${tokens.panelMinWidth};
      padding: ${tokens.panelPaddingY} ${tokens.panelPaddingX};
      background: ${theme.colors.bg.surface ?? theme.colors.bg.canvas};
      color: ${theme.colors.text.primary};
      border-radius: ${tokens.panelRadius};
      box-shadow: ${theme.mode === 'dark' ? tokens.shadowDark : tokens.shadow};
      /* 抵消 Popover bodyCss 自带的 padding —— 与 Menu 同一手法，让 panel 自管间距。 */
      margin: -${theme.components.popover.paddingY} -${theme.components.popover.paddingX};
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
        aria-label={ariaLabel ?? 'Date picker'}
      >
        <div ref={panelRef} css={panelCss} data-slot="datepicker-panel">
          <CalendarPanel
            mode="single"
            selected={currentValue}
            defaultMonthAnchor={initialAnchor}
            onSelectDate={handleSelectDate}
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
            aria-label={ariaLabel ?? 'Date picker'}
          />
        </div>
      </Popover>
    );
  },
);

(DatePicker as unknown as { displayName: string }).displayName = 'TimeUI.DatePicker';
