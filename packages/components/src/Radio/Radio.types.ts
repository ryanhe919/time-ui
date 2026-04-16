import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import type { ButtonColor } from '../Button/Button.types';

/** Radio shares the reduced size set with Checkbox (no xs/xl). */
export type RadioSize = 'sm' | 'md' | 'lg';

/** Semantic color union — aligned with Button / Checkbox. */
export type RadioColor = ButtonColor;

/** Group layout direction. */
export type RadioGroupOrientation = 'horizontal' | 'vertical';

type OmittedNativeRadioProps =
  | 'size'
  | 'type'
  | 'value'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'color'
  | 'name';

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  OmittedNativeRadioProps
> {
  /** Option value — **required** (a Radio without a value makes no sense). */
  value: string;
  /** Overrides the group's color for this specific item. */
  color?: RadioColor;
  /** Overrides the group's size for this specific item. */
  size?: RadioSize;
  /** Label text; rendered inside the wrapping `<label>`. */
  children?: ReactNode;
  /** Secondary caption shown under the label. */
  description?: ReactNode;
  /** Per-item disable; the group's `isDisabled` always wins. */
  isDisabled?: boolean;
  /** Native change escape-hatch — rarely needed. */
  onChangeEvent?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export interface RadioGroupProps {
  /** Group label — rendered as `<legend>`. */
  label?: ReactNode;
  /** Supporting helper text. */
  description?: ReactNode;
  /** Error message — presence auto-sets `isInvalid=true`. */
  errorMessage?: ReactNode;
  /** Required marker on the legend. Sets `aria-required` on the fieldset. */
  isRequired?: boolean;
  /** Explicit invalid flag override. */
  isInvalid?: boolean;
  /** Group-level disable flag; overrides per-item `isDisabled`. */
  isDisabled?: boolean;
  /** Layout direction. Defaults to `'vertical'`. */
  orientation?: RadioGroupOrientation;
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial selected value. */
  defaultValue?: string;
  /** Called with the newly-selected value. */
  onChange?: (value: string) => void;
  /** Default color for all descendant radios. */
  color?: RadioColor;
  /** Default size for all descendant radios. */
  size?: RadioSize;
  /** Shared `name` for all descendant radios (required for native grouping). */
  name?: string;
  /** Explicit id for the fieldset; auto-generated via `useId()` when omitted. */
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Descendant `<Radio>` elements. */
  children?: ReactNode;
}
