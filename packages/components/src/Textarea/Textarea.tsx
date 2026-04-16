/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Textarea 组件的核心渲染与交互逻辑。
 */

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  type ChangeEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useTheme, css } from '@emotion/react';
import { getFieldVariantStyles, useControllableState, useIsomorphicLayoutEffect } from '../utils';
import { FormField } from '../FormField';
import type { TextareaProps, TextareaRadius, TextareaSize } from './Textarea.types';

const SIZE_TO_RADIUS: Record<TextareaSize, TextareaRadius> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

function parseLineHeightPx(node: HTMLElement): number | null {
  if (typeof window === 'undefined') return null;
  const computed = window.getComputedStyle(node);
  const lh = computed.lineHeight;
  if (!lh || lh === 'normal') return null;
  const parsed = parseFloat(lh);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

function getVerticalPaddingPx(node: HTMLElement): number {
  if (typeof window === 'undefined') return 0;
  const computed = window.getComputedStyle(node);
  return (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0);
}

interface TextareaShellProps {
  variant: NonNullable<TextareaProps['variant']>;
  effectiveColor: NonNullable<TextareaProps['color']>;
  size: TextareaSize;
  radius: TextareaRadius;
  currentValue: string;
  innerRef: Ref<HTMLTextAreaElement>;
  placeholder?: string;
  rows: number;
  isAutoSize: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isRequired: boolean;
  fullWidth: boolean;
  startContent?: ReactNode;
  endContent?: ReactNode;
  showCount: boolean;
  maxLength?: number;
  countStatusColor: string | null;
  countMessage: string;
  handleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  nativeProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  inputId?: string;
  ariaDescribedBy?: string;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  required?: boolean;
}

function TextareaShell({
  variant,
  effectiveColor,
  size,
  radius,
  currentValue,
  innerRef,
  placeholder,
  rows,
  isAutoSize,
  isDisabled,
  isReadOnly,
  isInvalid,
  isRequired,
  fullWidth,
  startContent,
  endContent,
  showCount,
  maxLength,
  countStatusColor,
  countMessage,
  handleChange,
  className,
  style,
  nativeProps,
  inputId,
  ariaDescribedBy,
  id: injectedId,
  'aria-describedby': injectedDescribedBy,
  'aria-invalid': injectedInvalid,
  'aria-required': injectedRequired,
  required: injectedRequiredAttr,
}: TextareaShellProps) {
  const theme = useTheme();

  const effectiveId = injectedId ?? inputId;
  const describedByDirect = injectedDescribedBy ?? ariaDescribedBy;
  const effectiveAriaInvalid = injectedInvalid ?? (isInvalid || undefined);
  const effectiveAriaRequired = injectedRequired ?? (isRequired || undefined);
  const effectiveRequired = injectedRequiredAttr ?? isRequired;

  const sizeTokens = theme.components.input[size];
  const borderRadius = radius === 'full' ? '9999px' : theme.componentRadius[radius];

  const countNodeId = effectiveId ? `${effectiveId}-count` : undefined;

  const combinedDescribedBy =
    countNodeId && showCount && maxLength !== undefined
      ? [describedByDirect, countNodeId].filter(Boolean).join(' ') || undefined
      : describedByDirect;

  const variantStyles = getFieldVariantStyles({
    theme,
    variant,
    color: effectiveColor,
    isInvalid,
    isDisabled,
    isReadOnly,
  });

  const wrapperCss = css`
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    width: ${fullWidth ? '100%' : 'auto'};
    min-width: 0;
    padding: ${theme.spacing['2'] ?? '8px'} ${sizeTokens.paddingX};
    gap: ${sizeTokens.gap};
    font-family: inherit;
    font-size: ${sizeTokens.fontSize};
    line-height: ${sizeTokens.lineHeight};
    color: ${theme.colors.text.primary};
    border-radius: ${variant === 'underlined' ? '0' : borderRadius};
    ${isDisabled ? 'pointer-events: none;' : ''}
  `;

  const textareaCss = css`
    flex: 1 1 auto;
    min-width: 0;
    padding: 0;
    margin: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    width: 100%;
    resize: ${isAutoSize ? 'none' : 'vertical'};
    appearance: none;

    &::placeholder {
      color: ${theme.colors.text.muted};
      opacity: 1;
    }
    &:disabled {
      cursor: not-allowed;
      color: ${theme.colors.text.disabled};
      -webkit-text-fill-color: ${theme.colors.text.disabled};
    }
  `;

  const slotCss = css`
    display: inline-flex;
    align-items: center;
    color: ${theme.colors.text.muted};
  `;

  const counterCss = css`
    position: absolute;
    right: ${sizeTokens.paddingX};
    bottom: ${theme.spacing['1'] ?? '4px'};
    font-size: 11px;
    line-height: 1.2;
    color: ${countStatusColor ?? theme.colors.text.muted};
    pointer-events: none;
    user-select: none;
  `;

  const srOnlyCss = css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  return (
    <div
      data-variant={variant}
      data-color={effectiveColor}
      data-size={size}
      data-disabled={isDisabled || undefined}
      data-readonly={isReadOnly || undefined}
      data-invalid={isInvalid || undefined}
      data-full-width={fullWidth || undefined}
      aria-disabled={isDisabled || undefined}
      className={className}
      style={style}
      css={[wrapperCss, variantStyles]}
    >
      {startContent ? (
        <span css={slotCss} data-slot="start">
          {startContent}
        </span>
      ) : null}

      <textarea
        {...nativeProps}
        ref={innerRef}
        id={effectiveId}
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={effectiveRequired}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={effectiveAriaInvalid}
        aria-required={effectiveAriaRequired}
        aria-describedby={combinedDescribedBy}
        aria-disabled={isDisabled || undefined}
        aria-readonly={isReadOnly || undefined}
        css={textareaCss}
      />

      {endContent ? (
        <span css={slotCss} data-slot="end">
          {endContent}
        </span>
      ) : null}

      {showCount && maxLength !== undefined ? (
        <>
          <span aria-hidden="true" data-slot="count" css={counterCss}>
            {currentValue.length}/{maxLength}
          </span>
          <span id={countNodeId} aria-live="polite" css={srOnlyCss} data-slot="count-a11y">
            {countMessage}
          </span>
        </>
      ) : null}
    </div>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    variant = 'flat',
    color = 'default',
    size = 'md',
    radius: radiusProp,
    value,
    defaultValue,
    onChange,
    onChangeEvent,
    label,
    description,
    errorMessage,
    startContent,
    endContent,
    rows = 3,
    minRows,
    maxRows,
    isAutoSize: isAutoSizeProp,
    showCount = false,
    maxLength,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    isInvalid: isInvalidProp,
    fullWidth = false,
    className,
    style,
    id: idProp,
    placeholder,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `timeui-textarea-${autoId}`;

  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

  const [rawValue, setValue] = useControllableState<string>({
    value,
    defaultValue: defaultValue as string,
    onChange,
    name: 'Textarea',
  });
  const currentValue = rawValue ?? '';

  const hasError = errorMessage !== undefined && errorMessage !== null && errorMessage !== false;
  const isInvalid = isInvalidProp ?? hasError;
  const effectiveColor = isInvalid ? 'danger' : color;
  const radius: TextareaRadius = radiusProp ?? SIZE_TO_RADIUS[size];

  const isAutoSize = isAutoSizeProp ?? (minRows !== undefined || maxRows !== undefined);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      onChangeEvent?.(e);
    },
    [setValue, onChangeEvent],
  );

  useIsomorphicLayoutEffect(() => {
    if (!isAutoSize) return;
    const el = innerRef.current;
    if (!el) return;

    const lineHeightPx =
      parseLineHeightPx(el) ?? (parseFloat(window.getComputedStyle(el).fontSize) || 14) * 1.4;
    const padding = getVerticalPaddingPx(el);

    const minHeight = minRows !== undefined ? lineHeightPx * minRows + padding : 0;
    const maxHeight = maxRows !== undefined ? lineHeightPx * maxRows + padding : Infinity;

    el.style.height = 'auto';
    const natural = el.scrollHeight;
    const clamped = Math.max(minHeight, Math.min(natural, maxHeight));
    el.style.height = `${clamped}px`;
    el.style.overflowY = natural > maxHeight ? 'auto' : 'hidden';
  }, [currentValue, isAutoSize, minRows, maxRows]);

  const theme = useTheme();
  let countStatusColor: string | null = null;
  let countMessage = '';
  if (showCount && maxLength !== undefined) {
    const len = currentValue.length;
    if (len > maxLength) {
      countStatusColor = theme.colors.status.danger;
    } else if (len > maxLength * 0.9) {
      countStatusColor = theme.colors.status.warning;
    }
    countMessage = `${len} of ${maxLength} characters used`;
  }

  const shell = (
    <TextareaShell
      variant={variant}
      effectiveColor={effectiveColor}
      size={size}
      radius={radius}
      currentValue={currentValue}
      innerRef={innerRef}
      placeholder={placeholder}
      rows={rows}
      isAutoSize={isAutoSize}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isInvalid={isInvalid}
      isRequired={isRequired}
      fullWidth={fullWidth}
      startContent={startContent}
      endContent={endContent}
      showCount={showCount}
      maxLength={maxLength}
      countStatusColor={countStatusColor}
      countMessage={countMessage}
      handleChange={handleChange}
      className={className}
      style={style}
      nativeProps={rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
      inputId={id}
    />
  );

  const needsFormField =
    (label !== undefined && label !== null && label !== false) ||
    (description !== undefined && description !== null && description !== false) ||
    hasError;

  if (!needsFormField) {
    return shell;
  }

  return (
    <FormField
      label={label}
      description={description}
      errorMessage={errorMessage}
      isRequired={isRequired}
      isInvalid={isInvalidProp}
      isDisabled={isDisabled}
      id={id}
    >
      {shell}
    </FormField>
  );
});

(Textarea as unknown as { displayName: string }).displayName = 'Textarea';
