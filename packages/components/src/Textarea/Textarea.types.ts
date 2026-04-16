import type { ChangeEvent, CSSProperties, ReactNode, TextareaHTMLAttributes } from 'react';
import type { FieldVariant, FieldColor } from '../utils';

export type TextareaVariant = FieldVariant;
export type TextareaColor = FieldColor;
export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextareaRadius = 'sm' | 'md' | 'lg' | 'full';

type StrippedNativeKeys =
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'rows';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  StrippedNativeKeys
> {
  /** Visual recipe. Default `'flat'`. */
  variant?: TextareaVariant;
  /** Semantic color; auto-flips to `'danger'` when `isInvalid`. */
  color?: TextareaColor;
  /** Size preset. Default `'md'`. Aligns with Input scale. */
  size?: TextareaSize;
  /** Corner radius. Defaults to size's natural radius. */
  radius?: TextareaRadius;

  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onChangeEvent?: (event: ChangeEvent<HTMLTextAreaElement>) => void;

  /** Field title — triggers the implicit FormField wrapper. */
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;

  startContent?: ReactNode;
  endContent?: ReactNode;

  /** Fixed row count when auto-size is off. Default `3`. */
  rows?: number;
  /** Lower bound for auto-sizing (in rows). Sets a min-height. */
  minRows?: number;
  /** Upper bound for auto-sizing (in rows). Beyond this, vertical scroll. */
  maxRows?: number;
  /** Explicit opt-in for auto-sizing. Defaults to true when `minRows`
   *  or `maxRows` is provided. */
  isAutoSize?: boolean;

  /** Show a `{n}/{max}` counter in the bottom-right corner. Requires maxLength. */
  showCount?: boolean;
  /** Native attribute — required when `showCount` is used. */
  maxLength?: number;

  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;

  fullWidth?: boolean;

  className?: string;
  style?: CSSProperties;
}
