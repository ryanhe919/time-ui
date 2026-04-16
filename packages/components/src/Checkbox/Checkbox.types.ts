import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import type { ButtonColor } from '../Button/Button.types';

/** Checkbox / Radio share a reduced size set (no xs/xl). */
export type CheckboxSize = 'sm' | 'md' | 'lg';

/** Corner radius preset for the checkbox indicator. */
export type CheckboxRadius = 'sm' | 'md';

/** Re-export the shared semantic color union so consumers only need one type. */
export type CheckboxColor = ButtonColor;

/** Group layout direction. */
export type CheckboxGroupOrientation = 'horizontal' | 'vertical';

/**
 * Native input attributes we explicitly override or surface through typed
 * TimeUI props. Keeping this list narrow avoids duplicate/ambiguous entries on
 * the public type.
 */
type OmittedNativeCheckboxProps =
  | 'size'
  | 'type'
  | 'value'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'color';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  OmittedNativeCheckboxProps
> {
  /** Semantic color used when selected. Defaults to `'primary'`. */
  color?: CheckboxColor;
  /** Size preset. Defaults to `'md'` (or inherits from `CheckboxGroup`). */
  size?: CheckboxSize;
  /** Corner radius preset; defaults to a size-derived value. */
  radius?: CheckboxRadius;
  /**
   * Option value — **required** inside a `CheckboxGroup` so the group can
   * track which checkboxes are selected; optional when the Checkbox stands
   * on its own.
   */
  value?: string;
  /** Controlled selection state. */
  isSelected?: boolean;
  /** Uncontrolled initial state. */
  defaultSelected?: boolean;
  /**
   * Renders the tri-state "mixed" indicator. Orthogonal to `isSelected`
   * (Apple-style batch-select pattern). Synced to the underlying DOM
   * `input.indeterminate`.
   */
  isIndeterminate?: boolean;
  /** Fired with the unwrapped boolean (not the event). */
  onChange?: (checked: boolean) => void;
  /** Native change event escape-hatch. */
  onChangeEvent?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Disables the checkbox. `aria-disabled` + `pointer-events: none`. */
  isDisabled?: boolean;
  /** Visual read-only — focusable but never mutated by user interaction. */
  isReadOnly?: boolean;
  /** Required field marker (mirrored to `aria-required` + native `required`). */
  isRequired?: boolean;
  /** Invalid state (`aria-invalid` + danger-colored indicator border). */
  isInvalid?: boolean;
  /** Label text; rendered next to the indicator inside the wrapping `<label>`. */
  children?: ReactNode;
  /** Shared across a radio-like set; auto-injected by `CheckboxGroup`. */
  name?: string;
}

export interface CheckboxGroupProps {
  /** Group label (string → `<legend>`, ReactNode → `<legend>` with any content). */
  label?: ReactNode;
  /** Supporting helper text. */
  description?: ReactNode;
  /** Error message — presence auto-sets `isInvalid=true`. */
  errorMessage?: ReactNode;
  /** Required marker on the legend. */
  isRequired?: boolean;
  /** Explicit invalid flag override. */
  isInvalid?: boolean;
  /** Group-level disable flag; always wins over per-checkbox `isDisabled`. */
  isDisabled?: boolean;
  /** Layout direction for child checkboxes. Defaults to `'vertical'`. */
  orientation?: CheckboxGroupOrientation;
  /** Controlled selected values. */
  value?: string[];
  /** Uncontrolled initial selected values. Defaults to `[]`. */
  defaultValue?: string[];
  /** Called with the next `string[]` whenever selection changes. */
  onChange?: (value: string[]) => void;
  /** Default color for all descendant checkboxes (child `color` still wins). */
  color?: CheckboxColor;
  /** Default size for all descendant checkboxes (child `size` still wins). */
  size?: CheckboxSize;
  /** Default radius for all descendant checkboxes. */
  radius?: CheckboxRadius;
  /** Shared `name` for all descendant checkboxes (form submission). */
  name?: string;
  /** Explicit id; auto-generated via `useId()` when omitted. */
  id?: string;
  /** Passes through to the root `<fieldset>`. */
  className?: string;
  style?: React.CSSProperties;
  /** Descendant `<Checkbox>` elements. */
  children?: ReactNode;
}
