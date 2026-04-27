'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-24
 * @description TimePanel —— DateTimePicker 的时间选择内核。
 *              按 showMinute / showSecond / is12Hour 组合渲染 1-4 个纵向 listbox 列：
 *              Hour、Minute、Second、AM/PM。每列是可滚动的按钮列表，选中项随 value 滚动居中。
 *              本组件不维护自身 value —— 仅按 props 回调给消费者，保持与 CalendarPanel 一致的受控风格。
 */

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type MutableRefObject,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { buildTimeOptions, isAm, pad2, to12Hour } from './time-utils';

export interface TimePanelProps {
  /** 当前选中的 hour（24 小时制；0-23）。 */
  hour: number;
  minute: number;
  second: number;
  /** hour 变更回调；传回的依旧是 24 小时制。 */
  onHourChange: (next: number) => void;
  onMinuteChange: (next: number) => void;
  onSecondChange: (next: number) => void;
  showMinute?: boolean;
  showSecond?: boolean;
  is12Hour?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  locale?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
}

function isChineseLocale(locale?: string): boolean {
  return locale?.toLowerCase().startsWith('zh') ?? false;
}

export const TimePanel = forwardRef<HTMLDivElement, TimePanelProps>(
  function TimePanel(props, forwardedRef) {
    const {
      hour,
      minute,
      second,
      onHourChange,
      onMinuteChange,
      onSecondChange,
      showMinute = true,
      showSecond = false,
      is12Hour = false,
      hourStep = 1,
      minuteStep = 1,
      secondStep = 1,
      locale,
      className,
      style,
      id,
      'aria-label': ariaLabel,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.datePicker;
    const isZh = isChineseLocale(locale);

    const hourLabel = isZh ? '小时' : 'Hour';
    const minuteLabel = isZh ? '分钟' : 'Minute';
    const secondLabel = isZh ? '秒' : 'Second';
    const periodLabel = isZh ? '时段' : 'Period';
    const panelAriaLabel = ariaLabel ?? (isZh ? '时间' : 'Time');

    const hourOptions = useMemo(() => {
      const max = is12Hour ? 12 : 24;
      if (is12Hour) {
        // 12h：列表为 [12, 1, 2, ..., 11]，与常见 picker 一致。
        const raw = buildTimeOptions(12, hourStep).map((n) => (n === 0 ? 12 : n));
        return raw.sort((a, b) => (a === 12 ? -1 : b === 12 ? 1 : a - b));
      }
      return buildTimeOptions(max, hourStep);
    }, [is12Hour, hourStep]);

    const minuteOptions = useMemo(() => buildTimeOptions(60, minuteStep), [minuteStep]);
    const secondOptions = useMemo(() => buildTimeOptions(60, secondStep), [secondStep]);

    const displayHour = is12Hour ? to12Hour(hour) : hour;
    const period: 'am' | 'pm' = isAm(hour) ? 'am' : 'pm';

    const handleHourClick = (next: number) => {
      if (is12Hour) {
        // next 是 12h 数字（1-12）；保持当前 AM/PM。
        const h12 = ((next % 12) + 12) % 12;
        onHourChange(period === 'pm' ? h12 + 12 : h12);
      } else {
        onHourChange(next);
      }
    };

    const handlePeriodClick = (next: 'am' | 'pm') => {
      if (next === period) return;
      const h12 = ((hour % 12) + 12) % 12;
      onHourChange(next === 'pm' ? h12 + 12 : h12);
    };

    // ── styling ──
    const surfaceBg = theme.colors.bg.surface ?? theme.colors.bg.canvas;
    const hoverBg = theme.colors.action.secondary.hover;
    const textPrimary = theme.colors.text.primary;
    const textSecondary = theme.colors.text.secondary;
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const primaryBg = theme.colors.primary[500];
    const primaryFg = theme.colors.primary.foreground;
    const dividerColor = theme.colors.border.subtle;

    // 列表可见高度固定：7 行 × 每行 timeItemHeight，保证紧凑且滚动流畅。
    const visibleRows = 7;
    const itemHeight = tokens.timeItemHeight;
    const listHeight = `calc(${itemHeight} * ${visibleRows})`;

    const wrapperCss = css`
      display: flex;
      flex-direction: column;
      min-width: calc(${tokens.timeColumnWidth} * 2);
      background: ${surfaceBg};
      color: ${textPrimary};
    `;

    const columnsCss = css`
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 0;
      height: ${listHeight};
    `;

    const columnCss = css`
      display: flex;
      flex-direction: column;
      width: ${tokens.timeColumnWidth};
      height: 100%;
      border-left: 1px solid ${dividerColor};
      &:first-of-type {
        border-left: 0;
      }
    `;

    const columnHeaderCss = css`
      display: none;
    `;

    const listCss = css`
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 4px;
      scroll-behavior: smooth;
      /* 底部留白让最后一个 item 也能滚到居中（可选增强，不做强制）。 */
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: ${theme.colors.border.subtle};
        border-radius: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        scroll-behavior: auto;
      }
    `;

    const itemCss = css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: ${tokens.timeItemHeight};
      line-height: ${tokens.timeItemHeight};
      padding: 0;
      margin: 2px 0;
      border: 0;
      border-radius: ${tokens.timeItemRadius};
      background: transparent;
      color: ${textPrimary};
      font: inherit;
      font-size: ${tokens.timeItemFontSize};
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition:
        background-color 120ms ease,
        color 120ms ease;
      &:hover:not([data-selected='true']):not(:disabled) {
        background: ${hoverBg};
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1.5px ${focusColor};
      }
      &[data-selected='true'] {
        background: ${primaryBg};
        color: ${primaryFg};
        font-weight: 600;
      }
      &:disabled {
        color: ${textSecondary};
        opacity: 0.4;
        cursor: not-allowed;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    // 选中项滚入视图（初始与外部变更时）。
    const hourListRef = useRef<HTMLDivElement | null>(null);
    const minuteListRef = useRef<HTMLDivElement | null>(null);
    const secondListRef = useRef<HTMLDivElement | null>(null);
    const periodListRef = useRef<HTMLDivElement | null>(null);

    const scrollSelectedIntoView = (list: HTMLDivElement | null) => {
      if (!list) return;
      const selected = list.querySelector<HTMLElement>('[data-selected="true"]');
      if (!selected) return;
      // 居中对齐：手动计算 scrollTop，避免 scrollIntoView({block:'center'}) 把
      // 整个页面也一起滚动（浮层场景容易造成页面抖动）。
      const target = selected.offsetTop - list.clientHeight / 2 + selected.offsetHeight / 2;
      list.scrollTop = Math.max(0, target);
    };

    useEffect(() => {
      scrollSelectedIntoView(hourListRef.current);
    }, [hour, is12Hour]);
    useEffect(() => {
      scrollSelectedIntoView(minuteListRef.current);
    }, [minute]);
    useEffect(() => {
      scrollSelectedIntoView(secondListRef.current);
    }, [second]);
    useEffect(() => {
      scrollSelectedIntoView(periodListRef.current);
    }, [period]);

    const renderColumn = (opts: {
      key: string;
      label: string;
      ref: MutableRefObject<HTMLDivElement | null>;
      options: number[];
      selected: number;
      onSelect: (next: number) => void;
      formatter?: (n: number) => string;
    }) => (
      <div css={columnCss} key={opts.key}>
        <div css={columnHeaderCss} aria-hidden>
          {opts.label}
        </div>
        <div
          role="listbox"
          aria-label={opts.label}
          tabIndex={-1}
          ref={opts.ref}
          css={listCss}
          data-slot={`timepanel-${opts.key}`}
        >
          {opts.options.map((n) => {
            const isSelected = n === opts.selected;
            return (
              <button
                type="button"
                key={n}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                data-value={n}
                css={itemCss}
                onClick={() => opts.onSelect(n)}
              >
                {opts.formatter ? opts.formatter(n) : pad2(n)}
              </button>
            );
          })}
        </div>
      </div>
    );

    return (
      <div
        ref={forwardedRef}
        id={id}
        className={className}
        style={style}
        css={wrapperCss}
        aria-label={panelAriaLabel}
        data-timeui-timepanel=""
      >
        <div css={columnsCss}>
          {renderColumn({
            key: 'hour',
            label: hourLabel,
            ref: hourListRef,
            options: hourOptions,
            selected: displayHour,
            onSelect: handleHourClick,
          })}
          {showMinute
            ? renderColumn({
                key: 'minute',
                label: minuteLabel,
                ref: minuteListRef,
                options: minuteOptions,
                selected: minute,
                onSelect: onMinuteChange,
              })
            : null}
          {showMinute && showSecond
            ? renderColumn({
                key: 'second',
                label: secondLabel,
                ref: secondListRef,
                options: secondOptions,
                selected: second,
                onSelect: onSecondChange,
              })
            : null}
          {is12Hour
            ? (() => {
                const options: Array<'am' | 'pm'> = ['am', 'pm'];
                return (
                  <div css={columnCss} key="period">
                    <div css={columnHeaderCss} aria-hidden>
                      {periodLabel}
                    </div>
                    <div
                      role="listbox"
                      aria-label={periodLabel}
                      tabIndex={-1}
                      ref={periodListRef}
                      css={listCss}
                      data-slot="timepanel-period"
                    >
                      {options.map((p) => {
                        const isSelected = p === period;
                        return (
                          <button
                            type="button"
                            key={p}
                            role="option"
                            aria-selected={isSelected}
                            data-selected={isSelected}
                            data-value={p}
                            css={itemCss}
                            onClick={() => handlePeriodClick(p)}
                          >
                            {p.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            : null}
        </div>
      </div>
    );
  },
);

(TimePanel as unknown as { displayName: string }).displayName = 'TimeUI.TimePanel';
