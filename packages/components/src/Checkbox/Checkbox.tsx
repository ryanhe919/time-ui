/** @jsxImportSource @emotion/react */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ChangeEvent,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import { useCheckboxGroupContext } from './context';
import type { CheckboxProps, CheckboxRadius, CheckboxSize } from './Checkbox.types';

const sizeToRadius: Record<CheckboxSize, CheckboxRadius> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

const radiusPx: Record<CheckboxRadius, string> = {
  sm: '4px',
  md: '6px',
};

/**
 * `Checkbox` — multi-select input with optional `indeterminate` state.
 *
 * Works stand-alone (uncontrolled via `defaultSelected`, or controlled via
 * `isSelected` + `onChange(boolean)`) and as a child of `<CheckboxGroup>`,
 * which injects `name`, shared selection state, color, size, and disabled.
 *
 * Visual structure: a `<label>` containing a visually-hidden-but-focusable
 * native `<input type="checkbox">`, a painted indicator `<span>`, and the
 * label text. `focus-visible` on the native input drives the ring on the
 * sibling indicator via a CSS adjacent-sibling selector.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    color: colorProp,
    size: sizeProp,
    radius: radiusProp,
    value,
    isSelected,
    defaultSelected = false,
    isIndeterminate = false,
    onChange,
    onChangeEvent,
    isDisabled: isDisabledProp,
    isReadOnly = false,
    isRequired = false,
    isInvalid: isInvalidProp,
    children,
    name: nameProp,
    id: idProp,
    className,
    style,
    ...rest
  },
  forwardedRef,
) {
  const theme = useTheme();
  const group = useCheckboxGroupContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const inputId = idProp ?? `timeui-checkbox-${autoId}`;

  const resolvedColor = colorProp ?? group?.color ?? 'primary';
  const resolvedSize: CheckboxSize = sizeProp ?? group?.size ?? 'md';
  const resolvedRadius: CheckboxRadius = radiusProp ?? group?.radius ?? sizeToRadius[resolvedSize];
  const resolvedName = nameProp ?? group?.name;
  const isDisabled = Boolean(group?.isDisabled || isDisabledProp);
  const isInvalid = isInvalidProp ?? group?.isInvalid ?? false;

  const [standaloneSelected, setStandaloneSelected] = useControllableState<boolean>({
    value: isSelected,
    defaultValue: (isSelected !== undefined ? undefined : (defaultSelected ?? false)) as boolean,
    onChange,
    name: 'Checkbox',
  });

  const inGroup = group !== null;
  const selected = inGroup
    ? value !== undefined && group!.value.includes(value)
    : standaloneSelected;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      // readOnly checkboxes never mutate state. Native `readOnly` is ignored
      // by `<input type=checkbox>` (and `preventDefault` on the change event
      // is a no-op for booleans), so we revert the DOM back to the logical
      // state — matching what Switch does for the same reason.
      if (isReadOnly) {
        event.currentTarget.checked = selected;
        return;
      }
      const next = event.target.checked;
      onChangeEvent?.(event);
      if (inGroup) {
        if (value !== undefined) group!.toggle(value, next);
        onChange?.(next);
      } else {
        setStandaloneSelected(next);
      }
    },
    [inGroup, group, value, onChange, onChangeEvent, setStandaloneSelected, isReadOnly, selected],
  );

  const sizeTokens = theme.components.checkbox[resolvedSize];
  const scale = theme.colors[resolvedColor];
  const focusColor = theme.colors.focus;
  const dangerColor = theme.colors.status.danger;
  const borderStrong = theme.colors.border.strong;
  const borderRadiusValue = radiusPx[resolvedRadius];
  const duration = theme.motion.duration.normal;
  const indicatorSize = sizeTokens.indicator;

  const borderColor = isInvalid
    ? dangerColor
    : selected || isIndeterminate
      ? scale.DEFAULT
      : borderStrong;
  const bgColor = selected || isIndeterminate ? scale.DEFAULT : 'transparent';
  const checkColor = scale.foreground;

  const iconSize = useMemo(() => {
    const n = parseInt(indicatorSize, 10);
    return Math.round(n * 0.7);
  }, [indicatorSize]);

  return (
    <label
      className={className}
      style={style}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
      data-selected={selected || undefined}
      data-indeterminate={isIndeterminate || undefined}
      css={css`
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: ${sizeTokens.gap};
        font-family: inherit;
        font-size: ${sizeTokens.fontSize};
        line-height: 1.4;
        color: ${theme.colors.text.primary};
        cursor: ${isDisabled ? 'not-allowed' : isReadOnly ? 'default' : 'pointer'};
        user-select: none;
        ${isDisabled ? 'opacity: 0.5; pointer-events: none;' : ''}
      `}
    >
      <input
        ref={mergeRefs(inputRef, forwardedRef)}
        id={inputId}
        type="checkbox"
        name={resolvedName}
        value={value}
        checked={selected}
        onChange={handleChange}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={isRequired}
        aria-invalid={isInvalid || undefined}
        aria-required={isRequired || undefined}
        aria-readonly={isReadOnly || undefined}
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
          border-radius: ${borderRadiusValue};
          border: ${theme.borders.width.thin} solid ${borderColor};
          background-color: ${bgColor};
          color: ${checkColor};
          transition:
            background-color ${duration},
            border-color ${duration},
            color ${duration},
            box-shadow ${duration};

          input:focus-visible ~ & {
            outline: 2px solid ${focusColor};
            outline-offset: 2px;
          }

          label:hover input:not(:disabled):not(:checked):not(:indeterminate) ~ & {
            border-color: ${isInvalid ? dangerColor : theme.colors.border.focus};
          }

          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
        `}
      >
        {isIndeterminate ? (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M3.5 8h9" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
          </svg>
        ) : selected ? (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3 8.5L6.5 12L13 5"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      {children !== undefined && children !== null && children !== false ? (
        <span
          data-label=""
          css={css`
            color: ${theme.colors.text.primary};
          `}
        >
          {children}
        </span>
      ) : null}
    </label>
  );
});

(Checkbox as unknown as { displayName: string }).displayName = 'Checkbox';
