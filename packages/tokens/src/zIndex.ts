/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 zIndex 设计令牌。
 */

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

export type ZIndex = typeof zIndex;
