/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 motion 设计令牌。
 */

export const duration = {
  instant: '0ms',
  fast: '120ms',
  base: '200ms',
  normal: '250ms',
  slow: '320ms',
  slower: '480ms',
} as const;

export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

export const motion = { duration, easing } as const;

export type Motion = typeof motion;
