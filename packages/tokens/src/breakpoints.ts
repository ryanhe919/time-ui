/** Responsive breakpoints (min-width). */
export const breakpoints = {
  xs: '0px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  '2xl': '1600px',
} as const;

export type Breakpoints = typeof breakpoints;
export type BreakpointKey = keyof Breakpoints;
