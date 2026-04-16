import type { ElementType, ReactNode, ComponentPropsWithRef, Ref } from 'react';

/**
 * HeroUI-aligned button variants.
 * Legacy values ('primary' | 'secondary' | 'outline' | 'danger') remain
 * accepted for backward compatibility and are mapped internally.
 */
export type ButtonVariant =
  | 'solid'
  | 'bordered'
  | 'light'
  | 'flat'
  | 'faded'
  | 'shadow'
  | 'ghost'
  // legacy
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger';

export type ButtonColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonRadius = 'sm' | 'md' | 'lg' | 'full';

export interface ButtonOwnProps {
  /** Visual style. Default `'solid'`. */
  variant?: ButtonVariant;
  /** Semantic color. Default `'default'`. */
  color?: ButtonColor;
  /** Size preset. Default `'md'`. */
  size?: ButtonSize;
  /** Corner radius. Defaults to size's natural radius. */
  radius?: ButtonRadius;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children?: ReactNode;
}

export type ButtonProps<C extends ElementType = 'button'> = ButtonOwnProps & {
  as?: C;
  ref?: Ref<Element>;
} & Omit<ComponentPropsWithRef<C>, keyof ButtonOwnProps | 'as'>;
