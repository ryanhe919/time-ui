import type { ChangeEvent, CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import type { FieldVariant, FieldColor } from '../utils';

export type InputVariant = FieldVariant;
export type InputColor = FieldColor;
export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputRadius = 'sm' | 'md' | 'lg' | 'full';

/**
 * The subset of `<input>` types Input explicitly supports. Any string is
 * still accepted at runtime but this narrows authoring intent.
 */
export type InputType = 'text' | 'email' | 'url' | 'tel' | 'password' | 'search' | 'number';

/**
 * Native `<input>` attributes we strip from the rest-forward (they are either
 * re-typed for our value/controlled model or conflict with TimeUI prop
 * conventions).
 */
type StrippedNativeKeys =
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'type'
  | 'disabled'
  | 'readOnly'
  | 'required';

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  StrippedNativeKeys
> {
  /** Visual recipe. Default `'flat'`. */
  variant?: InputVariant;
  /** Semantic color; auto-flips to `'danger'` when `isInvalid`. */
  color?: InputColor;
  /** Size preset. Default `'md'`. Aligns with Button scale. */
  size?: InputSize;
  /** Corner radius. Defaults to size's natural radius. */
  radius?: InputRadius;
  /** HTML input type. `'password'` enables the toggle by default. */
  type?: InputType;

  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Value-unwrapped change handler. Fires on every keystroke. */
  onChange?: (value: string) => void;
  /** Native event if consumers need the full ChangeEvent. */
  onChangeEvent?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Fires when the clear button (or Escape shortcut) empties the input. */
  onClear?: () => void;

  /** Field title. Presence triggers the implicit `FormField` wrapper. */
  label?: ReactNode;
  /** Supporting description. Triggers implicit wrapping. */
  description?: ReactNode;
  /** Error message. Presence implies `isInvalid={true}`. */
  errorMessage?: ReactNode;

  /** Slot rendered before the input text (icon, prefix). */
  startContent?: ReactNode;
  /** Slot rendered after the input text (icon, suffix). */
  endContent?: ReactNode;

  /** Render a clear (✕) button when there is a value. */
  isClearable?: boolean;
  /** Escape clears the value while focused (default `true`). */
  clearOnEscape?: boolean;
  /** tabIndex applied to the clear / password toggle buttons. Default `-1`. */
  clearButtonTabIndex?: number;

  /** Disables the field entirely. */
  isDisabled?: boolean;
  /** Field is read-only (focusable, selectable, not editable). */
  isReadOnly?: boolean;
  /** Marks the field required (native `required` + `aria-required`). */
  isRequired?: boolean;
  /** Explicit invalid override; auto-derived from `errorMessage`. */
  isInvalid?: boolean;

  /**
   * Whether to show the show/hide password toggle for `type='password'`.
   * Defaults to `true` when `type === 'password'`.
   */
  isPasswordToggleVisible?: boolean;

  /** Expand the root wrapper to 100% width. */
  fullWidth?: boolean;

  /** className is applied to the ROOT wrapper (not the `<input>`). */
  className?: string;
  /** style is applied to the ROOT wrapper (not the `<input>`). */
  style?: CSSProperties;
}
