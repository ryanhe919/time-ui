/** Animation durations and easing curves. */
export const duration = {
  instant: '0ms',
  fast: '120ms',
  base: '200ms',
  /** HeroUI-standard transition duration (0.25s). */
  normal: '250ms',
  slow: '320ms',
  slower: '480ms',
} as const;

export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** A bouncy spring-like curve for playful motion. */
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

export const motion = { duration, easing } as const;

export type Motion = typeof motion;
