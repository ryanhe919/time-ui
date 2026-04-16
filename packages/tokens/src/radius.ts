/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 radius 设计令牌。
 */

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

export const componentRadius = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '14px',
  full: '9999px',
} as const;

export type Radius = typeof radius;
export type ComponentRadius = typeof componentRadius;
