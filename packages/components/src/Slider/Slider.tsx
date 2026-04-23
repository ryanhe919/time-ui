/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Slider 组件：单值 / 范围 / 横向 / 纵向，键盘 + 指针双交互。
 */

'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import type { SliderColor, SliderProps, SliderValue } from './Slider.types';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function snap(n: number, step: number, min: number): number {
  if (step <= 0) return n;
  const k = Math.round((n - min) / step);
  const snapped = min + k * step;
  // 浮点修正：根据 step 的小数位数取整。
  const dec = (String(step).split('.')[1] ?? '').length;
  return dec > 0 ? Number(snapped.toFixed(dec)) : snapped;
}

function isRangeValue(v: SliderValue | undefined): v is [number, number] {
  return Array.isArray(v);
}

function asLength(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(props, forwardedRef) {
  const {
    color = 'primary',
    size = 'md',
    orientation = 'horizontal',
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue,
    onChange,
    onChangeEnd,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    isInvalid = false,
    label,
    showValue = false,
    formatValue,
    startContent,
    endContent,
    name,
    minName,
    maxName,
    length,
    className,
    style,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  } = props;

  const theme = useTheme();
  const isVertical = orientation === 'vertical';
  const isRangeMode = isRangeValue(value) || isRangeValue(defaultValue);

  const fallback: SliderValue = isRangeMode ? [min, max] : min;
  const [current, setCurrent] = useControllableState<SliderValue>({
    value,
    // When controlled, suppress defaultValue so useControllableState doesn't warn about both
    // being provided. When uncontrolled, fall back to [min, max] / min.
    defaultValue: (value !== undefined ? undefined : (defaultValue ?? fallback)) as SliderValue,
    onChange,
    name: 'Slider',
  });

  const isRange = isRangeValue(current);
  const a = isRange ? (current as [number, number])[0] : (current as number);
  const b = isRange ? (current as [number, number])[1] : (current as number);

  const currentRef = useRef<SliderValue>(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragThumbRef = useRef<0 | 1 | null>(null);

  const autoId = useId();
  const labelId = label ? `${id ?? autoId}-label` : undefined;
  const valueId = `${id ?? autoId}-value`;

  const resolvedColor: SliderColor = isInvalid ? 'danger' : color;
  const palette = theme.colors[resolvedColor];
  const fillColor = palette.DEFAULT;
  const focusColor = theme.colors.border.focus ?? theme.colors.focus;
  const trackBg = theme.colors.default[200];
  const thumbBorderInactive = theme.colors.border.strong;
  const sizeTokens = theme.components.slider[size];
  const trackThickness = sizeTokens.trackThickness;
  const thumbSize = sizeTokens.thumbSize;
  const fontSize = sizeTokens.fontSize;
  const labelGap = sizeTokens.labelGap;
  const verticalLength = sizeTokens.verticalLength;
  const duration = theme.motion.duration.normal;
  const motionEasing = theme.motion.easing as {
    emphasized?: string;
    standard?: string;
    easeInOut: string;
  };
  const easing = motionEasing.emphasized ?? motionEasing.standard ?? motionEasing.easeInOut;

  const trackLength = asLength(length) ?? (isVertical ? verticalLength : '100%');

  const range = max - min;
  const pctOf = useCallback(
    (n: number): number => {
      if (range <= 0) return 0;
      return clamp(((n - min) / range) * 100, 0, 100);
    },
    [min, range],
  );

  const aPct = pctOf(a);
  const bPct = pctOf(b);
  const fillStart = isRange ? aPct : 0;
  const fillSize = isRange ? bPct - aPct : aPct;

  const formatted = useMemo(() => {
    if (formatValue) return formatValue(current);
    if (isRange) return `${a} – ${b}`;
    return String(a);
  }, [a, b, current, formatValue, isRange]);

  const setThumbValue = useCallback(
    (idx: 0 | 1, raw: number) => {
      const n = clamp(snap(raw, step, min), min, max);
      const cur = currentRef.current;
      let next: SliderValue;
      if (isRangeValue(cur)) {
        const [lo, hi] = cur;
        next = idx === 0 ? [Math.min(n, hi), hi] : [lo, Math.max(n, lo)];
      } else {
        next = n;
      }
      // Keep the ref synchronously up-to-date so the upcoming pointerup / keyup observer
      // (which fires before React commits the next render) sees the latest value.
      currentRef.current = next;
      setCurrent(next);
    },
    [max, min, setCurrent, step],
  );

  const positionToValue = useCallback(
    (clientX: number, clientY: number): number => {
      const trackEl = trackRef.current;
      if (!trackEl) return min;
      const rect = trackEl.getBoundingClientRect();
      const total = isVertical ? rect.height : rect.width;
      if (total <= 0) return min;
      const x = Number.isFinite(clientX) ? clientX : rect.left;
      const y = Number.isFinite(clientY) ? clientY : rect.bottom;
      const offset = isVertical ? rect.bottom - y : x - rect.left;
      const ratio = clamp(offset / total, 0, 1);
      return min + ratio * range;
    },
    [isVertical, min, range],
  );

  const onTrackPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isDisabled || isReadOnly) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const target = positionToValue(e.clientX, e.clientY);
      const cur = currentRef.current;
      let thumb: 0 | 1 = 0;
      if (isRangeValue(cur)) {
        const [lo, hi] = cur;
        thumb = Math.abs(target - lo) <= Math.abs(target - hi) ? 0 : 1;
      }
      dragThumbRef.current = thumb;
      setThumbValue(thumb, target);

      const onMove = (ev: PointerEvent) => {
        if (dragThumbRef.current === null) return;
        setThumbValue(dragThumbRef.current, positionToValue(ev.clientX, ev.clientY));
      };
      const onEnd = () => {
        if (dragThumbRef.current === null) return;
        dragThumbRef.current = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
        onChangeEnd?.(currentRef.current);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [isDisabled, isReadOnly, onChangeEnd, positionToValue, setThumbValue],
  );

  const onThumbInputChange = useCallback(
    (idx: 0 | 1) => (e: ChangeEvent<HTMLInputElement>) => {
      if (isReadOnly) {
        const cur = currentRef.current;
        e.currentTarget.value = String(isRangeValue(cur) ? cur[idx] : cur);
        return;
      }
      const num = parseFloat(e.currentTarget.value);
      if (!Number.isFinite(num)) return;
      setThumbValue(idx, num);
    },
    [isReadOnly, setThumbValue],
  );

  const onThumbInputKeyUp = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      const k = e.key;
      if (
        k === 'ArrowLeft' ||
        k === 'ArrowRight' ||
        k === 'ArrowUp' ||
        k === 'ArrowDown' ||
        k === 'Home' ||
        k === 'End' ||
        k === 'PageUp' ||
        k === 'PageDown'
      ) {
        onChangeEnd?.(currentRef.current);
      }
    },
    [onChangeEnd],
  );

  const ariaOrientation = isVertical ? 'vertical' : 'horizontal';
  // React.useId() returns ":r0:"; strip the colons so the value is a valid CSS id.
  const safeAutoId = autoId.replace(/:/g, '');
  const baseInputId = id ?? `timeui-slider-${safeAutoId}`;

  const visuallyHidden = css`
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  `;

  const renderThumb = (idx: 0 | 1, value: number, valuePct: number, accessibleName: string) => {
    const positionStyle: CSSProperties = isVertical
      ? { bottom: `${valuePct}%`, left: '50%', transform: 'translate(-50%, 50%)' }
      : { left: `${valuePct}%`, top: '50%', transform: 'translate(-50%, -50%)' };

    const thumbInputName = isRange ? (idx === 0 ? minName : maxName) : name;
    const thumbInputId = isRange ? `${baseInputId}-${idx === 0 ? 'min' : 'max'}` : baseInputId;
    const thumbMin = isRange && idx === 1 ? a : min;
    const thumbMax = isRange && idx === 0 ? b : max;

    return (
      <span
        key={idx}
        data-thumb={idx}
        css={css`
          position: absolute;
          width: ${thumbSize};
          height: ${thumbSize};
          border-radius: 9999px;
          background-color: #ffffff;
          border: 2px solid ${fillColor};
          box-shadow: ${theme.shadows.sm};
          transition:
            border-color ${duration} ${easing},
            box-shadow ${duration} ${easing};
          cursor: ${isDisabled ? 'not-allowed' : isReadOnly ? 'default' : 'grab'};
          &:focus-within {
            outline: none;
            border-color: ${focusColor};
            box-shadow:
              ${theme.shadows.sm},
              inset 0 0 0 1px ${focusColor};
          }
          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
        `}
        style={positionStyle}
      >
        <input
          type="range"
          id={thumbInputId}
          name={thumbInputName}
          min={thumbMin}
          max={thumbMax}
          step={step}
          value={value}
          disabled={isDisabled}
          readOnly={isReadOnly}
          required={isRequired && idx === 0}
          aria-label={accessibleName}
          aria-orientation={ariaOrientation}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue ? formatValue(currentRef.current) : String(value)}
          aria-invalid={isInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          onChange={onThumbInputChange(idx)}
          onKeyUp={onThumbInputKeyUp}
          onPointerUp={() => onChangeEnd?.(currentRef.current)}
          css={visuallyHidden}
        />
      </span>
    );
  };

  const baseAria = ariaLabel ?? (typeof label === 'string' ? label : undefined);
  const minThumbName = isRange
    ? baseAria
      ? `${baseAria} minimum`
      : 'Minimum value'
    : (baseAria ?? 'Slider');
  const maxThumbName = baseAria ? `${baseAria} maximum` : 'Maximum value';

  const headerRow = (label || showValue) && !isVertical && (
    <div
      css={css`
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font-size: ${fontSize};
        margin-bottom: ${labelGap};
        color: ${theme.colors.text.primary};
      `}
    >
      {label ? (
        <span
          id={labelId}
          css={css`
            font-weight: 500;
          `}
        >
          {label}
        </span>
      ) : (
        <span aria-hidden />
      )}
      {showValue ? (
        <span
          id={valueId}
          aria-live="polite"
          css={css`
            color: ${theme.colors.text.secondary};
            font-variant-numeric: tabular-nums;
          `}
        >
          {formatted}
        </span>
      ) : null}
    </div>
  );

  const trackEl = (
    <div
      ref={trackRef}
      data-track=""
      onPointerDown={onTrackPointerDown}
      css={css`
        position: relative;
        flex: ${isVertical ? 'none' : '1 1 auto'};
        width: ${isVertical ? trackThickness : trackLength};
        height: ${isVertical ? trackLength : trackThickness};
        background-color: ${trackBg};
        border-radius: 9999px;
        cursor: ${isDisabled ? 'not-allowed' : isReadOnly ? 'default' : 'pointer'};
        touch-action: ${isVertical ? 'pan-x' : 'pan-y'};
        ${isRange
          ? ''
          : `&::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; }`}
      `}
    >
      <span
        aria-hidden
        data-fill=""
        css={css`
          position: absolute;
          background-color: ${fillColor};
          border-radius: 9999px;
          transition: background-color ${duration} ${easing};
          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
          ${isVertical
            ? `left: 0; right: 0; bottom: ${fillStart}%; height: ${fillSize}%;`
            : `top: 0; bottom: 0; left: ${fillStart}%; width: ${fillSize}%;`}
        `}
      />
      {/* unselected hairline border for visibility on busy backgrounds */}
      {renderThumb(0, a, aPct, minThumbName)}
      {isRange ? renderThumb(1, b, bPct, maxThumbName) : null}
      {/* fallback border for non-fill area when faded contrast */}
      <span
        aria-hidden
        css={css`
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          pointer-events: none;
          box-shadow: inset 0 0 0 1px ${thumbBorderInactive};
          opacity: 0;
        `}
      />
    </div>
  );

  if (isVertical) {
    return (
      <div
        ref={mergeRefs(wrapperRef, forwardedRef)}
        role="group"
        id={id}
        className={className}
        style={style}
        aria-labelledby={labelId ?? ariaLabelledBy}
        aria-label={!label && !ariaLabelledBy ? baseAria : undefined}
        aria-disabled={isDisabled || undefined}
        aria-readonly={isReadOnly || undefined}
        data-orientation="vertical"
        data-disabled={isDisabled || undefined}
        data-readonly={isReadOnly || undefined}
        data-invalid={isInvalid || undefined}
        data-range={isRange || undefined}
        css={css`
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: ${labelGap};
          font-family: inherit;
          ${isDisabled ? 'opacity: 0.5;' : ''}
        `}
      >
        {showValue ? (
          <span
            id={valueId}
            aria-live="polite"
            css={css`
              font-size: ${fontSize};
              color: ${theme.colors.text.secondary};
              font-variant-numeric: tabular-nums;
            `}
          >
            {formatted}
          </span>
        ) : null}
        {startContent ? <span data-start-content="">{startContent}</span> : null}
        {trackEl}
        {endContent ? <span data-end-content="">{endContent}</span> : null}
        {label ? (
          <span
            id={labelId}
            css={css`
              font-size: ${fontSize};
              color: ${theme.colors.text.primary};
              font-weight: 500;
            `}
          >
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={mergeRefs(wrapperRef, forwardedRef)}
      role="group"
      id={id}
      className={className}
      style={style}
      aria-labelledby={labelId ?? ariaLabelledBy}
      aria-label={!label && !ariaLabelledBy ? baseAria : undefined}
      aria-disabled={isDisabled || undefined}
      aria-readonly={isReadOnly || undefined}
      data-orientation="horizontal"
      data-disabled={isDisabled || undefined}
      data-readonly={isReadOnly || undefined}
      data-invalid={isInvalid || undefined}
      data-range={isRange || undefined}
      css={css`
        display: flex;
        flex-direction: column;
        font-family: inherit;
        width: ${asLength(length) ?? '100%'};
        ${isDisabled ? 'opacity: 0.5;' : ''}
      `}
    >
      {headerRow}
      <div
        css={css`
          display: flex;
          align-items: center;
          gap: ${labelGap};
        `}
      >
        {startContent ? (
          <span
            data-start-content=""
            css={css`
              flex: none;
              font-size: ${fontSize};
              color: ${theme.colors.text.secondary};
              display: inline-flex;
              align-items: center;
            `}
          >
            {startContent}
          </span>
        ) : null}
        {trackEl}
        {endContent ? (
          <span
            data-end-content=""
            css={css`
              flex: none;
              font-size: ${fontSize};
              color: ${theme.colors.text.secondary};
              display: inline-flex;
              align-items: center;
            `}
          >
            {endContent}
          </span>
        ) : null}
      </div>
    </div>
  );
});

(Slider as unknown as { displayName: string }).displayName = 'Slider';
