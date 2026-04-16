import { createContext, useContext } from 'react';
import type { RadioColor, RadioSize } from './Radio.types';

/**
 * Context exposed by `<RadioGroup>` to descendant `<Radio>` items.
 *
 * Radio is a *strict* consumer of this context: rendering `<Radio>` outside a
 * group is an anti-pattern — the `Radio` component logs a one-time dev
 * warning and disables itself in that case (see `Radio.tsx`).
 */
export interface RadioGroupContextValue {
  /** Shared `name` attribute — required for native radio grouping. */
  name: string;
  /** Currently selected value (`undefined` → none). */
  value: string | undefined;
  /** Notify the group of a selection change. */
  setValue: (value: string) => void;
  /** Default color propagated to children. */
  color?: RadioColor;
  /** Default size propagated to children. */
  size?: RadioSize;
  /** Group-level disable flag (wins over per-item). */
  isDisabled?: boolean;
  /** Group-level invalid flag. */
  isInvalid?: boolean;
  /** Group-level required flag. */
  isRequired?: boolean;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export const useRadioGroupContext = (): RadioGroupContextValue | null =>
  useContext(RadioGroupContext);
