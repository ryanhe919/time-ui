import type { ReactNode, InputHTMLAttributes, ChangeEvent } from 'react';

/** Switch only needs the three "core" sizes — xs / xl would be too small /
 *  too large for a touch-friendly toggle per Apple HIG. */
export type SwitchSize = 'sm' | 'md' | 'lg';

/** Shared with the Button / field components so mixes stay consistent. */
export type SwitchColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * We intentionally strip the native `size` / `onChange` / `value` / `type` /
 * `role` / `aria-checked` props from `InputHTMLAttributes` because the
 * component redefines them with a richer (or different-shaped) contract.
 */
type InputPassthrough = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'size'
  | 'onChange'
  | 'value'
  | 'type'
  | 'role'
  | 'aria-checked'
  | 'checked'
  | 'defaultChecked'
  | 'children'
>;

export interface SwitchProps extends InputPassthrough {
  /** Accent color used by the `on` track. Defaults to `'success'` (iOS green). */
  color?: SwitchColor;
  /** Track / thumb geometry preset. Defaults to `'md'`. */
  size?: SwitchSize;

  /** Controlled `on` state. */
  isSelected?: boolean;
  /** Initial `on` state for the uncontrolled variant. */
  defaultSelected?: boolean;
  /** Fires when the user toggles the switch — the resolved boolean only. */
  onChange?: (checked: boolean) => void;
  /** Fires alongside `onChange`; exposes the raw native event for escape
   *  hatches (e.g. `preventDefault`, accessing `e.target`). */
  onChangeEvent?: (e: ChangeEvent<HTMLInputElement>) => void;

  /** Disable interaction and lower opacity. */
  isDisabled?: boolean;
  /** Read-only: switch still focusable but toggling is a no-op. */
  isReadOnly?: boolean;
  /** HTML + ARIA `required`. */
  isRequired?: boolean;
  /** Apply the `danger` semantic and `aria-invalid`. */
  isInvalid?: boolean;

  /** Icon displayed on the track's left (visible when `isSelected === true`). */
  startContent?: ReactNode;
  /** Icon displayed on the track's right (visible when `isSelected === false`). */
  endContent?: ReactNode;

  /** Trailing label. Rendered as a sibling `<span>` inside the `<label>`. */
  children?: ReactNode;

  /** Value submitted with the enclosing form when switched on. */
  value?: string;
  /** Form-control name. */
  name?: string;

  /** className / style forward to the **root `<label>`**, not the input. */
  className?: string;
  style?: React.CSSProperties;
}
