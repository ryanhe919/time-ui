/** Border width primitives. */
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
