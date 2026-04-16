/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 borders 设计令牌。
 */

export const borderWidth = {
  0: '0px',
  hairline: '0.5px',
  thin: '1px',
  thick: '2px',
  heavy: '4px',
} as const;

export const borderStyle = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  none: 'none',
} as const;

export const borders = { width: borderWidth, style: borderStyle } as const;

export type Borders = typeof borders;
