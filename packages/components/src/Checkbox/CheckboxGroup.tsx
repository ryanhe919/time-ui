/** @jsxImportSource @emotion/react */
import { forwardRef, useCallback, useId, useMemo } from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import { CheckboxGroupContext, type CheckboxGroupContextValue } from './context';
import type { CheckboxGroupProps } from './Checkbox.types';

/**
 * `CheckboxGroup` — multi-select wrapper that manages a shared `string[]` of
 * selected values, propagates a common `name` + color + size to descendant
 * `<Checkbox>` instances, and renders the group with native `<fieldset>` +
 * `<legend>` semantics.
 *
 * We deliberately opt **out** of `FormField` here: `FormField.cloneElement`
 * targets a single interactive child, whereas a checkbox group wraps N
 * children inside a container — `<fieldset>` is both more standard and avoids
 * the clone gymnastics. Error messages are rendered with `role="alert"` +
 * `aria-live="polite"` to match FormField's a11y behaviour.
 */
export const CheckboxGroup = forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  function CheckboxGroup(
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
      radius,
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
    const groupId = idProp ?? `timeui-checkbox-group-${autoId}`;
    const legendId = `${groupId}-legend`;
    const descriptionId = `${groupId}-description`;
    const errorId = `${groupId}-error`;
    const sharedName = nameProp ?? `timeui-cb-name-${autoId}`;

    const hasError = errorMessage !== undefined && errorMessage !== null && errorMessage !== false;
    const isInvalid = isInvalidProp ?? hasError;

    const [selected, setSelected] = useControllableState<string[]>({
      value,
      defaultValue: (value !== undefined ? undefined : (defaultValue ?? [])) as string[],
      onChange,
      name: 'CheckboxGroup',
    });

    const toggle = useCallback(
      (val: string, nextChecked: boolean) => {
        const current = selected;
        if (nextChecked) {
          if (current.includes(val)) {
            setSelected([...current]);
            return;
          }
          setSelected([...current, val]);
        } else {
          setSelected(current.filter((v) => v !== val));
        }
      },
      [selected, setSelected],
    );

    const contextValue = useMemo<CheckboxGroupContextValue>(
      () => ({
        name: sharedName,
        value: selected,
        toggle,
        color,
        size,
        radius,
        isDisabled,
        isInvalid,
        isRequired,
      }),
      [sharedName, selected, toggle, color, size, radius, isDisabled, isInvalid, isRequired],
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
        <CheckboxGroupContext.Provider value={contextValue}>
          <div
            css={css`
              display: flex;
              flex-direction: ${orientation === 'horizontal' ? 'row' : 'column'};
              flex-wrap: ${orientation === 'horizontal' ? 'wrap' : 'nowrap'};
              gap: ${itemGap};
            `}
          >
            {children}
          </div>
        </CheckboxGroupContext.Provider>
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
  },
);

(CheckboxGroup as unknown as { displayName: string }).displayName = 'CheckboxGroup';
