import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react';
import type { FieldVariant, FieldColor } from '../utils/fieldStyles';

export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type SelectRadius = 'sm' | 'md' | 'lg' | 'full';

export interface SelectItem {
  value: string;
  label: ReactNode;
  isDisabled?: boolean;
  description?: ReactNode;
}

/** Native <button> props we redefine / strip so callers don't clash. */
type SelectPassthrough = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'size' | 'onChange' | 'value' | 'defaultValue' | 'children' | 'type' | 'role' | 'disabled'
>;

export interface SelectProps extends SelectPassthrough {
  /** One of the four shared field variants. Default `'flat'`. */
  variant?: FieldVariant;
  /** Semantic color. `isInvalid=true` forces `'danger'`. Default `'default'`. */
  color?: FieldColor;
  /** Size preset shared with Input / Textarea. Default `'md'`. */
  size?: SelectSize;
  /** Corner radius. Defaults from size. */
  radius?: SelectRadius;
  /** Stretch the trigger + popover to fill the parent width. */
  fullWidth?: boolean;

  /** String value (controlled). */
  value?: string;
  /** Initial value (uncontrolled). */
  defaultValue?: string;
  /** Called with the unwrapped string value when a user selects an option. */
  onChange?: (value: string) => void;

  /** Shown in the trigger when no value is selected. */
  placeholder?: string;

  /** Declarative `items` array — preferred form. Mutually exclusive with `children`. */
  items?: SelectItem[];

  /** Node form — typically `<SelectOption>` children (props extracted at runtime). */
  children?: ReactNode;

  /** FormField composition — if any of the three is provided the component
   *  renders itself wrapped in `FormField` internally. */
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;

  /** Left slot (e.g. icon), inside the trigger. */
  startContent?: ReactNode;
  /** Right slot — overrides the default chevron glyph. */
  endContent?: ReactNode;

  /** Show a search box at the top of the popover. Filters `items` by
   *  case-insensitive substring match on the label. */
  isSearchable?: boolean;
  /** Placeholder text for the search box. */
  searchPlaceholder?: string;
  /** Rendered inside the listbox when the filter matches zero items. */
  emptyMessage?: ReactNode;
  /** Max height of the scrollable option list. Accepts any CSS length; a
   *  bare number is treated as pixels. Default `280`. */
  maxListHeight?: number | string;

  /** `name` attribute forwarded to a hidden `<input>` so the current value
   *  still round-trips through native form submission. */
  name?: string;

  /** className / style forward to the **root wrapper**, not the trigger. */
  className?: string;
  style?: CSSProperties;
}

/**
 * Props for `<SelectOption>`. Runtime-wise `SelectOption` is metadata only —
 * its parent `<Select>` reads these props at render time to build its own
 * listbox items. The component itself renders nothing directly.
 */
export interface SelectOptionProps {
  value: string;
  children?: ReactNode;
  /** Disable selection (matches native `<option disabled>` + TimeUI camelCase). */
  disabled?: boolean;
  isDisabled?: boolean;
  /** Optional supporting text rendered as a secondary line inside the option. */
  description?: ReactNode;
}
