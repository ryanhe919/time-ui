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

/**
 * Input / Textarea / Select shared size table.
 *
 * Heights align with `buttonSizes` for visual harmony when an Input and a
 * Button sit side-by-side in a form row. `iconSize` drives `startContent` /
 * `endContent` / clear / password-toggle glyphs.
 */
export const inputSizes = {
  xs: {
    height: '28px',
    fontSize: '12px',
    lineHeight: '16px',
    paddingX: '10px',
    iconSize: '14px',
    gap: '6px',
  },
  sm: {
    height: '32px',
    fontSize: '13px',
    lineHeight: '18px',
    paddingX: '12px',
    iconSize: '14px',
    gap: '8px',
  },
  md: {
    height: '40px',
    fontSize: '14px',
    lineHeight: '20px',
    paddingX: '14px',
    iconSize: '16px',
    gap: '8px',
  },
  lg: {
    height: '48px',
    fontSize: '16px',
    lineHeight: '24px',
    paddingX: '16px',
    iconSize: '18px',
    gap: '10px',
  },
  xl: {
    height: '56px',
    fontSize: '18px',
    lineHeight: '28px',
    paddingX: '20px',
    iconSize: '20px',
    gap: '12px',
  },
} as const;

/**
 * Checkbox / Radio indicator sizes. `indicator` is the square side; Radio
 * re-uses the same dimension for its outer circle so inline Checkbox + Radio
 * mixes stay visually balanced.
 */
export const checkboxSizes = {
  sm: {
    indicator: '16px',
    fontSize: '13px',
    gap: '8px',
  },
  md: {
    indicator: '20px',
    fontSize: '14px',
    gap: '8px',
  },
  lg: {
    indicator: '24px',
    fontSize: '16px',
    gap: '8px',
  },
} as const;

/**
 * Switch track / thumb geometry. `padding` is the gap between the thumb and
 * track edge at rest. Thumb diameter equals `trackHeight - padding * 2`
 * (see `Switch` spec §2.6).
 */
export const switchSizes = {
  sm: {
    trackWidth: '32px',
    trackHeight: '20px',
    thumbSize: '16px',
    padding: '2px',
  },
  md: {
    trackWidth: '48px',
    trackHeight: '28px',
    thumbSize: '24px',
    padding: '2px',
  },
  lg: {
    trackWidth: '56px',
    trackHeight: '32px',
    thumbSize: '28px',
    padding: '2px',
  },
} as const;

export const components = {
  button: buttonSizes,
  input: inputSizes,
  checkbox: checkboxSizes,
  switch: switchSizes,
} as const;

export type ButtonSizes = typeof buttonSizes;
export type InputSizes = typeof inputSizes;
export type CheckboxSizes = typeof checkboxSizes;
export type SwitchSizes = typeof switchSizes;
export type Components = typeof components;
