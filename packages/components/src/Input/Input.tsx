/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Input 组件的核心渲染与交互逻辑。
 */

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useTheme, css } from '@emotion/react';
import { useI18n } from '@timeui/core';
import { getFieldVariantStyles, useControllableState } from '../utils';
import { FormField } from '../FormField';
import type { InputProps, InputRadius, InputSize } from './Input.types';

const SIZE_TO_RADIUS: Record<InputSize, InputRadius> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

const ClearIcon = ({ size }: { size: number }) => (
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
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const EyeIcon = ({ size }: { size: number }) => (
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
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ size }: { size: number }) => (
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
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

interface InputControlProps {
  variant: NonNullable<InputProps['variant']>;
  effectiveColor: NonNullable<InputProps['color']>;
  size: InputSize;
  radius: InputRadius;
  type: string;
  currentValue: string;
  placeholder?: string;
  innerInputRef: Ref<HTMLInputElement>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleWrapperMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isRequired: boolean;
  fullWidth: boolean;
  startContent?: ReactNode;
  endContent?: ReactNode;
  showClearButton: boolean;
  onClear: () => void;
  clearButtonTabIndex: number;
  clearLabel: string;
  showPasswordToggle: boolean;
  showPassword: boolean;
  togglePassword: () => void;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  className?: string;
  style?: React.CSSProperties;
  nativeInputProps: React.InputHTMLAttributes<HTMLInputElement>;
  inputId?: string;
  ariaDescribedBy?: string;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  required?: boolean;
}

function InputControl({
  variant,
  effectiveColor,
  size,
  radius,
  type,
  currentValue,
  placeholder,
  innerInputRef,
  handleChange,
  handleKeyDown,
  handleWrapperMouseDown,
  isDisabled,
  isReadOnly,
  isInvalid,
  isRequired,
  fullWidth,
  startContent,
  endContent,
  showClearButton,
  onClear,
  clearButtonTabIndex,
  clearLabel,
  showPasswordToggle,
  showPassword,
  togglePassword,
  showPasswordLabel,
  hidePasswordLabel,
  className,
  style,
  nativeInputProps,
  inputId,
  ariaDescribedBy,
  id: injectedId,
  'aria-describedby': injectedDescribedBy,
  'aria-invalid': injectedInvalid,
  'aria-required': injectedRequired,
  required: injectedRequiredAttr,
}: InputControlProps) {
  const theme = useTheme();

  const effectiveId = injectedId ?? inputId;
  const effectiveDescribedBy = injectedDescribedBy ?? ariaDescribedBy;
  const effectiveAriaInvalid = injectedInvalid ?? (isInvalid || undefined);
  const effectiveAriaRequired = injectedRequired ?? (isRequired || undefined);
  const effectiveRequired = injectedRequiredAttr ?? isRequired;

  const sizeTokens = theme.components.input[size];
  const borderRadius = radius === 'full' ? '9999px' : theme.componentRadius[radius];
  const duration = theme.motion.duration.normal ?? '250ms';
  const iconSize = parseInt(sizeTokens.iconSize, 10) || 16;

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
    align-items: center;
    box-sizing: border-box;
    width: ${fullWidth ? '100%' : 'auto'};
    min-width: 0;
    height: ${sizeTokens.height};
    padding: 0 ${sizeTokens.paddingX};
    gap: ${sizeTokens.gap};
    font-family: inherit;
    font-size: ${sizeTokens.fontSize};
    line-height: ${sizeTokens.lineHeight};
    color: ${theme.colors.text.primary};
    border-radius: ${variant === 'underlined' ? '0' : borderRadius};
    ${isDisabled ? 'pointer-events: none;' : ''}
    ${isDisabled ? '' : 'cursor: text;'}
  `;

  const inputCss = css`
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
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
    &[type='search']::-webkit-search-decoration,
    &[type='search']::-webkit-search-cancel-button {
      display: none;
    }
  `;

  const slotCss = css`
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: ${theme.colors.text.muted};
    pointer-events: auto;
  `;

  const adornmentButtonCss = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    width: ${iconSize + 4}px;
    height: ${iconSize + 4}px;
    border: 0;
    border-radius: ${theme.componentRadius.sm};
    background: transparent;
    color: ${theme.colors.text.muted};
    cursor: pointer;
    flex-shrink: 0;
    transition:
      color ${duration},
      background-color ${duration};

    &:hover:not(:disabled) {
      color: ${theme.colors.text.primary};
    }
    &:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 ${theme.borders.width.thick} ${theme.colors.focus};
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  return (
    <div
      role="presentation"
      onMouseDown={handleWrapperMouseDown}
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

      <input
        {...nativeInputProps}
        ref={innerInputRef}
        id={effectiveId}
        type={type}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={effectiveRequired}
        aria-invalid={effectiveAriaInvalid}
        aria-required={effectiveAriaRequired}
        aria-describedby={effectiveDescribedBy}
        aria-disabled={isDisabled || undefined}
        aria-readonly={isReadOnly || undefined}
        css={inputCss}
      />

      {endContent ? (
        <span css={slotCss} data-slot="end">
          {endContent}
        </span>
      ) : null}

      {showClearButton ? (
        <button
          type="button"
          tabIndex={clearButtonTabIndex}
          aria-label={clearLabel}
          onClick={onClear}
          disabled={isDisabled || isReadOnly}
          css={adornmentButtonCss}
          data-slot="clear"
        >
          <ClearIcon size={iconSize} />
        </button>
      ) : null}

      {showPasswordToggle ? (
        <button
          type="button"
          tabIndex={clearButtonTabIndex}
          aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={showPassword}
          onClick={togglePassword}
          disabled={isDisabled}
          css={adornmentButtonCss}
          data-slot="password-toggle"
        >
          {showPassword ? <EyeOffIcon size={iconSize} /> : <EyeIcon size={iconSize} />}
        </button>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant = 'flat',
    color = 'default',
    size = 'md',
    radius: radiusProp,
    type = 'text',
    value,
    defaultValue,
    onChange,
    onChangeEvent,
    onClear,
    label,
    description,
    errorMessage,
    startContent,
    endContent,
    isClearable = false,
    clearOnEscape = true,
    clearButtonTabIndex = -1,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    isInvalid: isInvalidProp,
    isPasswordToggleVisible,
    fullWidth = false,
    className,
    style,
    id: idProp,
    placeholder,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `timeui-input-${autoId}`;

  const innerRef = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, []);

  const [rawValue, setValue] = useControllableState<string>({
    value,
    defaultValue: defaultValue as string,
    onChange,
    name: 'Input',
  });
  const currentValue = rawValue ?? '';

  const hasError = errorMessage !== undefined && errorMessage !== null && errorMessage !== false;
  const isInvalid = isInvalidProp ?? hasError;
  const effectiveColor = isInvalid ? 'danger' : color;
  const radius: InputRadius = radiusProp ?? SIZE_TO_RADIUS[size];

  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const showPasswordToggle = isPasswordType && (isPasswordToggleVisible ?? true);
  const effectiveType = isPasswordType && showPassword ? 'text' : type;

  const showClearButton = isClearable && currentValue.length > 0 && !isDisabled && !isReadOnly;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onChangeEvent?.(e);
    },
    [setValue, onChangeEvent],
  );

  const handleClear = useCallback(() => {
    setValue('');
    onClear?.();
    innerRef.current?.focus();
  }, [setValue, onClear]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (
        clearOnEscape &&
        isClearable &&
        e.key === 'Escape' &&
        currentValue.length > 0 &&
        !isDisabled &&
        !isReadOnly
      ) {
        e.preventDefault();
        setValue('');
        onClear?.();
      }
      onKeyDown?.(e);
    },
    [
      clearOnEscape,
      isClearable,
      currentValue.length,
      isDisabled,
      isReadOnly,
      setValue,
      onClear,
      onKeyDown,
    ],
  );

  const handleWrapperMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      innerRef.current?.focus();
    }
  }, []);

  const togglePassword = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const i18n = useI18n();

  const control = (
    <InputControl
      variant={variant}
      effectiveColor={effectiveColor}
      size={size}
      radius={radius}
      type={effectiveType}
      currentValue={currentValue}
      placeholder={placeholder}
      innerInputRef={innerRef}
      handleChange={handleChange}
      handleKeyDown={handleKeyDown}
      handleWrapperMouseDown={handleWrapperMouseDown}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isInvalid={isInvalid}
      isRequired={isRequired}
      fullWidth={fullWidth}
      startContent={startContent}
      endContent={endContent}
      showClearButton={showClearButton}
      onClear={handleClear}
      clearButtonTabIndex={clearButtonTabIndex}
      clearLabel={i18n.common.clear}
      showPasswordToggle={showPasswordToggle}
      showPassword={showPassword}
      togglePassword={togglePassword}
      showPasswordLabel={i18n.common.showPassword}
      hidePasswordLabel={i18n.common.hidePassword}
      className={className}
      style={style}
      inputId={id}
      nativeInputProps={rest as React.InputHTMLAttributes<HTMLInputElement>}
    />
  );

  const needsFormField =
    (label !== undefined && label !== null && label !== false) ||
    (description !== undefined && description !== null && description !== false) ||
    hasError;

  if (!needsFormField) {
    return control;
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
      {control}
    </FormField>
  );
});

(Input as unknown as { displayName: string }).displayName = 'Input';
