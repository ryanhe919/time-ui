/** Corner radius primitives. */
export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

/**
 * HeroUI-aligned radii used by component-level size maps (e.g. Button).
 * Kept separate from the generic `radius` scale so existing consumers
 * aren't broken by the rename of sm/md/lg values.
 */
export const componentRadius = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '14px',
  full: '9999px',
} as const;

export type Radius = typeof radius;
export type ComponentRadius = typeof componentRadius;
