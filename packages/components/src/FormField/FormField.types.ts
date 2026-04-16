import type { ReactElement, ReactNode, HTMLAttributes } from 'react';

export type FormFieldLabelPlacement = 'top' | 'start';

/**
 * Shape of the props that `FormField` injects into its single child via
 * `cloneElement`. Form controls that want to be composable inside a
 * `FormField` should accept this superset (all optional — the controls work
 * stand-alone too).
 */
export interface FormFieldInjectedChildProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  required?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
}

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Field title. A plain string is rendered as `<label htmlFor>`; a
   * `ReactNode` is rendered as `<span>` + `aria-labelledby` (so icons,
   * tooltips, etc. stay valid HTML).
   */
  label?: ReactNode;
  /** `'top'` stacks vertically; `'start'` puts the label on the left. */
  labelPlacement?: FormFieldLabelPlacement;
  /** Supporting description. */
  description?: ReactNode;
  /** Error message — presence implies `isInvalid=true`. */
  errorMessage?: ReactNode;
  /** Marks the field required; renders `*` and sets `aria-required`. */
  isRequired?: boolean;
  /** Explicit invalid flag; overrides the automatic derivation from
   *  `errorMessage` when set explicitly (including `false`). */
  isInvalid?: boolean;
  /** Disables the field; lowers wrapper opacity and forwards to children. */
  isDisabled?: boolean;
  /** Explicit id for the field element; auto-generated via `useId()` when
   *  omitted. */
  id?: string;
  /**
   * The actual form control. **Must** be a single React element — it will
   * be cloned and injected with `id`, `aria-describedby`, `aria-invalid`,
   * `aria-required`, `required`, `isDisabled`, `isInvalid`.
   */
  children: ReactElement;
}
