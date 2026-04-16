/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 breakpoints 设计令牌。
 */

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
