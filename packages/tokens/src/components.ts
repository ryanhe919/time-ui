/**
 * Component-level size / geometry tokens.
 *
 * These are "primitive-adjacent": they name specific component sizes
 * (e.g. `button.md.height`) so component implementations don't have to
 * hard-code magic numbers. Spec baseline comes from HeroUI Button; xs/xl
 * extrapolate the same scale.
 */

export const buttonSizes = {
  xs: {
    height: '28px',
    minWidth: '56px',
    fontSize: '11px',
    lineHeight: '14px',
    paddingX: '10px',
    gap: '6px',
    radius: '6px',
  },
  sm: {
    height: '32px',
    minWidth: '64px',
    fontSize: '12px',
    lineHeight: '16px',
    paddingX: '12px',
    gap: '8px',
    radius: '8px',
  },
  md: {
    height: '40px',
    minWidth: '80px',
    fontSize: '14px',
    lineHeight: '20px',
    paddingX: '16px',
    gap: '8px',
    radius: '12px',
  },
  lg: {
    height: '48px',
    minWidth: '96px',
    fontSize: '16px',
    lineHeight: '24px',
    paddingX: '24px',
    gap: '12px',
    radius: '14px',
  },
  xl: {
    height: '56px',
    minWidth: '112px',
    fontSize: '18px',
    lineHeight: '28px',
    paddingX: '28px',
    gap: '12px',
    radius: '16px',
  },
} as const;

export const components = { button: buttonSizes } as const;

export type ButtonSizes = typeof buttonSizes;
export type Components = typeof components;
