/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Radio 组件的核心渲染与交互逻辑。
 */

import { forwardRef, useCallback, useEffect, useId, useRef, type ChangeEvent } from 'react';
import { css, useTheme } from '@emotion/react';
import { isDev, mergeRefs } from '../utils';
import { useRadioGroupContext } from './context';
import type { RadioProps, RadioSize } from './Radio.types';

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value,
    color: colorProp,
    size: sizeProp,
    children,
    description,
    isDisabled: isDisabledProp,
    onChangeEvent,
    id: idProp,
    className,
    style,
    ...rest
  },
  forwardedRef,
) {
  const theme = useTheme();
  const group = useRadioGroupContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const inputId = idProp ?? `timeui-radio-${autoId}`;

  const warnedOrphanRef = useRef(false);
  useEffect(() => {
    if (!isDev) return;
    if (group !== null) return;
    if (warnedOrphanRef.current) return;
    warnedOrphanRef.current = true;

    console.warn(
      '[TimeUI] Radio: <Radio> must be rendered inside a <RadioGroup>. The Radio is disabled for safety. ' +
        'For a single-option scenario prefer a native <input type="radio"> or use a Checkbox.',
    );
  }, [group]);

  const resolvedColor = colorProp ?? group?.color ?? 'primary';
  const resolvedSize: RadioSize = sizeProp ?? group?.size ?? 'md';
  const isDisabled = group === null || Boolean(group?.isDisabled || isDisabledProp);
  const isInvalid = group?.isInvalid ?? false;
  const isRequired = group?.isRequired ?? false;
  const selected = group !== null && group.value === value;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChangeEvent?.(event);
      if (group !== null && event.target.checked) {
        group.setValue(value);
      }
    },
    [group, value, onChangeEvent],
  );

  const sizeTokens = theme.components.checkbox[resolvedSize];
  const scale = theme.colors[resolvedColor];
  const focusColor = theme.colors.focus;
  const dangerColor = theme.colors.status.danger;
  const borderStrong = theme.colors.border.strong;
  const durationFast = theme.motion.duration.fast;

  const indicatorSize = sizeTokens.indicator;
  const outerColor = isInvalid ? dangerColor : selected ? scale.DEFAULT : borderStrong;

  return (
    <label
      className={className}
      style={style}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
      data-selected={selected || undefined}
      css={css`
        position: relative;
        display: inline-flex;
        align-items: flex-start;
        gap: ${sizeTokens.gap};
        font-family: inherit;
        font-size: ${sizeTokens.fontSize};
        line-height: 1.4;
        color: ${theme.colors.text.primary};
        cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
        user-select: none;
        ${isDisabled ? 'opacity: 0.5; pointer-events: none;' : ''}
      `}
    >
      <input
        ref={mergeRefs(inputRef, forwardedRef)}
        id={inputId}
        type="radio"
        name={group?.name}
        value={value}
        checked={selected}
        onChange={handleChange}
        disabled={isDisabled}
        required={isRequired || undefined}
        aria-invalid={isInvalid || undefined}
        aria-disabled={isDisabled || undefined}
        css={css`
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          opacity: 0;
          cursor: inherit;
        `}
        {...rest}
      />
      <span
        aria-hidden="true"
        data-indicator=""
        css={css`
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: ${indicatorSize};
          height: ${indicatorSize};
          border-radius: 50%;
          border: ${theme.borders.width.thin} solid ${outerColor};
          background-color: transparent;
          transition:
            border-color ${durationFast},
            box-shadow ${durationFast};

          input:focus-visible ~ & {
            outline: 2px solid ${focusColor};
            outline-offset: 2px;
          }

          label:hover input:not(:disabled):not(:checked) ~ & {
            border-color: ${isInvalid ? dangerColor : theme.colors.border.focus};
          }

          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
        `}
      >
        <span
          data-inner-dot=""
          css={css`
            display: block;
            width: 50%;
            height: 50%;
            border-radius: 50%;
            background-color: ${scale.DEFAULT};
            transform: scale(${selected ? 1 : 0});
            transform-origin: center;
            transition: transform ${durationFast} ${theme.motion.easing.easeOut};

            @media (prefers-reduced-motion: reduce) {
              transition: none;
              transform: scale(${selected ? 1 : 0});
            }
          `}
        />
      </span>
      {(children !== undefined && children !== null && children !== false) || description ? (
        <span
          css={css`
            display: inline-flex;
            flex-direction: column;
            gap: 2px;
          `}
        >
          {children !== undefined && children !== null && children !== false ? (
            <span data-label="">{children}</span>
          ) : null}
          {description ? (
            <span
              data-description=""
              css={css`
                font-size: 12px;
                line-height: 1.4;
                color: ${theme.colors.text.secondary};
              `}
            >
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
});

(Radio as unknown as { displayName: string }).displayName = 'Radio';
