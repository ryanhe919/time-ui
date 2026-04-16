/** @jsxImportSource @emotion/react */
import { forwardRef, useId, useMemo } from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils/useControllableState';
import { RadioGroupContext, type RadioGroupContextValue } from './context';
import type { RadioGroupProps } from './Radio.types';

/**
 * `RadioGroup` — single-select wrapper that manages the selected value and
 * shares `name` + color + size with descendant `<Radio>` items via context.
 *
 * Layout uses a native `<fieldset>` + `<legend>` for standards-compliant a11y
 * without FormField's single-child `cloneElement` constraint. Keyboard
 * navigation between radio items is handled entirely by the browser because
 * every child `<input type="radio">` carries the same `name`.
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  {
    label,
    description,
    errorMessage,
    isRequired = false,
    isInvalid: isInvalidProp,
    isDisabled = false,
    orientation = 'vertical',
    value,
    defaultValue,
    onChange,
    color,
    size,
    name: nameProp,
    id: idProp,
    className,
    style,
    children,
  },
  ref,
) {
  const theme = useTheme();
  const autoId = useId();
  const groupId = idProp ?? `timeui-radio-group-${autoId}`;
  const legendId = `${groupId}-legend`;
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  const sharedName = nameProp ?? `timeui-radio-name-${autoId}`;

  const hasError = errorMessage !== undefined && errorMessage !== null && errorMessage !== false;
  const isInvalid = isInvalidProp ?? hasError;

  const [selected, setSelected] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: onChange as ((v: string | undefined) => void) | undefined,
    name: 'RadioGroup',
  });

  const contextValue = useMemo<RadioGroupContextValue>(
    () => ({
      name: sharedName,
      value: selected,
      setValue: (v: string) => setSelected(v),
      color,
      size,
      isDisabled,
      isInvalid,
      isRequired,
    }),
    [sharedName, selected, setSelected, color, size, isDisabled, isInvalid, isRequired],
  );

  const describedBy = [description ? descriptionId : null, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ')
    .trim();

  const dangerColor = theme.colors.status.danger;
  const labelColor = theme.colors.text.primary;
  const descriptionColor = theme.colors.text.secondary;
  const gap = theme.spacing?.['1.5'] ?? '6px';
  const itemGap =
    orientation === 'horizontal' ? (theme.spacing?.[4] ?? '16px') : (theme.spacing?.[2] ?? '8px');

  return (
    <fieldset
      ref={ref}
      id={groupId}
      className={className}
      style={style}
      disabled={isDisabled}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy.length > 0 ? describedBy : undefined}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
      data-orientation={orientation}
      css={css`
        display: flex;
        flex-direction: column;
        gap: ${gap};
        margin: 0;
        padding: 0;
        border: 0;
        min-width: 0;
        ${isDisabled ? 'opacity: 0.6;' : ''}
      `}
    >
      {label !== undefined && label !== null && label !== false ? (
        <legend
          id={legendId}
          css={css`
            padding: 0;
            display: inline-flex;
            align-items: center;
            font-size: 13px;
            line-height: 1.4;
            font-weight: 500;
            color: ${labelColor};
          `}
        >
          {label}
          {isRequired ? (
            <span
              aria-hidden="true"
              css={css`
                color: ${dangerColor};
                margin-inline-start: ${theme.spacing?.['0.5'] ?? '2px'};
              `}
            >
              *
            </span>
          ) : null}
        </legend>
      ) : null}
      {description ? (
        <div
          id={descriptionId}
          css={css`
            font-size: 12px;
            line-height: 1.4;
            color: ${descriptionColor};
          `}
        >
          {description}
        </div>
      ) : null}
      <RadioGroupContext.Provider value={contextValue}>
        <div
          role="radiogroup"
          aria-labelledby={
            label !== undefined && label !== null && label !== false ? legendId : undefined
          }
          aria-required={isRequired || undefined}
          aria-invalid={isInvalid || undefined}
          css={css`
            display: flex;
            flex-direction: ${orientation === 'horizontal' ? 'row' : 'column'};
            flex-wrap: ${orientation === 'horizontal' ? 'wrap' : 'nowrap'};
            gap: ${itemGap};
          `}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
      {hasError ? (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          css={css`
            font-size: 12px;
            line-height: 1.4;
            color: ${dangerColor};
          `}
        >
          {errorMessage}
        </div>
      ) : null}
    </fieldset>
  );
});

(RadioGroup as unknown as { displayName: string }).displayName = 'RadioGroup';
