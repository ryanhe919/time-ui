/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 FormField 组件的核心渲染与交互逻辑。
 */

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type ReactElement,
} from 'react';
import { useTheme, css } from '@emotion/react';
import type { FormFieldProps, FormFieldInjectedChildProps } from './FormField.types';

function mergeIdList(...parts: (string | undefined | null | false)[]): string | undefined {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    for (const tok of String(part).split(/\s+/)) {
      if (!tok) continue;
      if (seen.has(tok)) continue;
      seen.add(tok);
      out.push(tok);
    }
  }
  return out.length > 0 ? out.join(' ') : undefined;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  {
    label,
    labelPlacement = 'top',
    description,
    errorMessage,
    isRequired = false,
    isInvalid: isInvalidProp,
    isDisabled = false,
    id: idProp,
    children,
    className,
    style,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const autoId = useId();
  const fieldId = idProp ?? `timeui-field-${autoId}`;
  const labelId = `${fieldId}-label`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  const hasError = errorMessage !== undefined && errorMessage !== null && errorMessage !== false;
  const isInvalid = isInvalidProp ?? hasError;

  if (process.env.NODE_ENV !== 'production') {
    Children.only(children);
  }

  const isLabelString = typeof label === 'string';
  const hasLabel = label !== undefined && label !== null && label !== false;

  const describedBy = mergeIdList(
    description ? descriptionId : null,
    hasError ? errorId : null,
    (children as ReactElement<FormFieldInjectedChildProps>).props?.['aria-describedby'],
  );

  const childProps =
    (children as ReactElement<FormFieldInjectedChildProps & { disabled?: boolean }>).props ?? {};
  const isDomChild = isValidElement(children) && typeof children.type === 'string';
  const controlId = childProps.id ?? fieldId;

  const merged: FormFieldInjectedChildProps & { disabled?: boolean } = isDomChild
    ? {
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': isInvalid || undefined,
        'aria-required': isRequired || undefined,
        required: isRequired || childProps.required || undefined,
        disabled: isDisabled || childProps.disabled || undefined,
      }
    : {
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': isInvalid || undefined,
        'aria-required': isRequired || undefined,
        required: isRequired || childProps.required || undefined,
        isDisabled: isDisabled || childProps.isDisabled,
        isInvalid: isInvalid || childProps.isInvalid,
        isRequired: isRequired || childProps.isRequired,
      };

  const injectedChild = isValidElement(children)
    ? cloneElement(children as ReactElement<FormFieldInjectedChildProps>, merged)
    : children;

  const isVertical = labelPlacement === 'top';
  const rootGap = theme.spacing?.['1.5'] ?? '6px';

  const labelFontSize = '13px';
  const helpFontSize = '12px';
  const labelColor = theme.colors.text.primary;
  const descriptionColor = theme.colors.text.secondary;
  const dangerColor = theme.colors.status.danger;

  const labelNode = hasLabel ? (
    isLabelString ? (
      <label
        htmlFor={controlId}
        css={css`
          display: inline-flex;
          align-items: center;
          font-size: ${labelFontSize};
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
      </label>
    ) : (
      <span
        id={labelId}
        css={css`
          display: inline-flex;
          align-items: center;
          font-size: ${labelFontSize};
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
      </span>
    )
  ) : null;

  const finalChild =
    hasLabel && !isLabelString && isValidElement(injectedChild)
      ? cloneElement(
          injectedChild as ReactElement<
            FormFieldInjectedChildProps & { 'aria-labelledby'?: string }
          >,
          { 'aria-labelledby': labelId },
        )
      : injectedChild;
  // 非纯文本 label 没有可直接关联的 htmlFor，需要通过 aria-labelledby 建立语义关系。

  return (
    <div
      ref={ref}
      role={hasLabel ? 'group' : undefined}
      className={className}
      style={style}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
      css={css`
        display: flex;
        flex-direction: ${isVertical ? 'column' : 'row'};
        gap: ${rootGap};
        ${isDisabled ? 'opacity: 0.6;' : ''}
        ${!isVertical ? 'align-items: flex-start;' : ''}
      `}
      {...rest}
    >
      {labelNode ? (
        <div
          css={css`
            ${isVertical
              ? ''
              : `min-width: ${theme.spacing?.[20] ?? '80px'}; width: 30%; padding-top: 8px;`}
            display: flex;
            flex-direction: row;
            align-items: center;
          `}
        >
          {labelNode}
        </div>
      ) : null}
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: ${rootGap};
          flex: 1;
          min-width: 0;
        `}
      >
        {finalChild}
        {description && !hasError ? (
          <div
            id={descriptionId}
            css={css`
              font-size: ${helpFontSize};
              line-height: 1.4;
              font-weight: 400;
              color: ${descriptionColor};
            `}
          >
            {description}
          </div>
        ) : null}
        {description && hasError ? (
          <div
            id={descriptionId}
            css={css`
              font-size: ${helpFontSize};
              line-height: 1.4;
              font-weight: 400;
              color: ${descriptionColor};
            `}
          >
            {description}
          </div>
        ) : null}
        {hasError ? (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            css={css`
              font-size: ${helpFontSize};
              line-height: 1.4;
              font-weight: 400;
              color: ${dangerColor};
            `}
          >
            {errorMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
});

(FormField as unknown as { displayName: string }).displayName = 'FormField';
