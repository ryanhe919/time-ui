import { createContext, useContext } from 'react';
import type { CheckboxColor, CheckboxRadius, CheckboxSize } from './Checkbox.types';

/**
 * Shared state exposed to descendant `<Checkbox>` instances. When a Checkbox
 * is rendered inside `CheckboxGroup` it reads every field below from context
 * instead of its own props.
 */
export interface CheckboxGroupContextValue {
  /** Shared `name` attribute (ties checkboxes together for a11y / form submission). */
  name: string;
  /** Current selected values. */
  value: string[];
  /** Toggle a single checkbox by its value. */
  toggle: (value: string, nextChecked: boolean) => void;
  /** Default color propagated to children. */
  color?: CheckboxColor;
  /** Default size propagated to children. */
  size?: CheckboxSize;
  /** Default radius propagated to children. */
  radius?: CheckboxRadius;
  /** Group-level disable flag (wins over per-item). */
  isDisabled?: boolean;
  /** Group-level invalid flag (falls through to children). */
  isInvalid?: boolean;
  /** Group-level required flag — informational; the fieldset legend carries the `*`. */
  isRequired?: boolean;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

/**
 * Returns the nearest `CheckboxGroupContext` or `null` when a `Checkbox` is
 * used stand-alone.
 */
export const useCheckboxGroupContext = (): CheckboxGroupContextValue | null =>
  useContext(CheckboxGroupContext);
