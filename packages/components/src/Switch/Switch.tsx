/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Switch 组件的核心渲染与交互逻辑。
 */

import { forwardRef, useCallback, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { useTheme, css } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import type { SwitchProps, SwitchColor } from './Switch.types';

function px(value: string | undefined): number {
  if (!value) return 0;
  const m = value.match(/(-?\d+(?:\.\d+)?)/);
  return m && m[1] ? parseFloat(m[1]) : 0;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    color = 'success',
    size = 'md',
    isSelected,
    defaultSelected = false,
    onChange,
    onChangeEvent,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    isInvalid = false,
    startContent,
    endContent,
    children,
    value,
    name,
    className,
    style,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const innerRef = useRef<HTMLInputElement | null>(null);

  const [checked, setChecked] = useControllableState<boolean>({
    value: isSelected,
    defaultValue: (isSelected !== undefined ? undefined : (defaultSelected ?? false)) as boolean,
    onChange,
    name: 'Switch',
  });

  const resolvedColor: SwitchColor = isInvalid ? 'danger' : color;
  const scale = theme.colors[resolvedColor];

  const sizeTokens = theme.components.switch[size];
  const trackWidth = sizeTokens.trackWidth;
  const trackHeight = sizeTokens.trackHeight;
  const thumbSize = sizeTokens.thumbSize;
  const padding = sizeTokens.padding;

  const travel = px(trackWidth) - px(thumbSize) - 2 * px(padding);

  const trackOffBg = theme.colors.default[500];
  const trackOnBg = scale.DEFAULT;
  const focusColor = theme.colors.border.focus ?? theme.colors.focus;
  const duration = theme.motion.duration.normal;
  const easing =
    (theme.motion.easing as { emphasized?: string; standard?: string }).emphasized ??
    (theme.motion.easing as { standard?: string }).standard ??
    theme.motion.easing.easeInOut;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      // 只读态下浏览器会先乐观切换 checked，这里立即回滚到受控值。
      if (isReadOnly) {
        e.currentTarget.checked = checked;
        return;
      }
      setChecked(e.target.checked);
      onChangeEvent?.(e);
    },
    [checked, isReadOnly, onChangeEvent, setChecked],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isDisabled || isReadOnly) return;
        setChecked(!checked);
      }
    },
    [checked, isDisabled, isReadOnly, setChecked],
  );

  const visuallyHidden = css`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    opacity: 0;
    cursor: ${isDisabled ? 'not-allowed' : isReadOnly ? 'default' : 'pointer'};
  `;

  return (
    <label
      data-selected={checked || undefined}
      data-disabled={isDisabled || undefined}
      data-readonly={isReadOnly || undefined}
      data-invalid={isInvalid || undefined}
      className={className}
      style={style}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: ${theme.spacing?.[2] ?? '8px'};
        cursor: ${isDisabled ? 'not-allowed' : isReadOnly ? 'default' : 'pointer'};
        user-select: none;
        ${isDisabled ? 'opacity: 0.5; pointer-events: none;' : ''}
      `}
    >
      <span
        css={css`
          position: relative;
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          width: ${trackWidth};
          height: ${trackHeight};
        `}
      >
        <input
          ref={mergeRefs(innerRef, ref)}
          type="checkbox"
          role="switch"
          id={id}
          name={name}
          value={value}
          checked={checked}
          disabled={isDisabled}
          readOnly={isReadOnly}
          required={isRequired}
          aria-checked={checked}
          aria-invalid={isInvalid || undefined}
          aria-required={isRequired || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          css={visuallyHidden}
          {...rest}
        />
        <span
          aria-hidden
          data-selected={checked || undefined}
          css={css`
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border-radius: 9999px;
            background-color: ${checked ? trackOnBg : trackOffBg};
            transition:
              background-color ${duration} ${easing},
              outline-color ${duration} ${easing};
            outline: 2px solid transparent;
            outline-offset: 2px;
            input:focus-visible + & {
              outline-color: ${focusColor};
            }
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
          `}
        >
          {startContent ? (
            <span
              aria-hidden
              css={css`
                position: absolute;
                top: 0;
                bottom: 0;
                left: ${padding};
                width: ${thumbSize};
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: calc(${thumbSize} * 0.65);
                color: ${scale.foreground};
                opacity: ${checked ? 1 : 0};
                transition: opacity ${duration} ${easing};
                @media (prefers-reduced-motion: reduce) {
                  transition: none;
                }
              `}
            >
              {startContent}
            </span>
          ) : null}
          {endContent ? (
            <span
              aria-hidden
              css={css`
                position: absolute;
                top: 0;
                bottom: 0;
                right: ${padding};
                width: ${thumbSize};
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: calc(${thumbSize} * 0.65);
                color: ${theme.colors.text.muted};
                opacity: ${checked ? 0 : 1};
                transition: opacity ${duration} ${easing};
                @media (prefers-reduced-motion: reduce) {
                  transition: none;
                }
              `}
            >
              {endContent}
            </span>
          ) : null}
          <span
            aria-hidden
            css={css`
              position: absolute;
              top: ${padding};
              left: ${padding};
              width: ${thumbSize};
              height: ${thumbSize};
              border-radius: 9999px;
              background-color: #ffffff;
              box-shadow: ${theme.shadows.sm};
              transform: translateX(${checked ? `${travel}px` : '0'});
              transition: transform ${duration} ${easing};
              @media (prefers-reduced-motion: reduce) {
                transition: none;
              }
            `}
          />
        </span>
      </span>
      {children ? (
        <span
          css={css`
            font-size: ${theme.components.input[size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md']
              .fontSize};
            line-height: 1.4;
            color: ${theme.colors.text.primary};
          `}
        >
          {children}
        </span>
      ) : null}
    </label>
  );
});

(Switch as unknown as { displayName: string }).displayName = 'Switch';
