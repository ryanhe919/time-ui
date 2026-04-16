import { describe, it, expect } from 'vitest';
import { tokens, palette, spacing, radius, shadows, zIndex, breakpoints, motion } from './index';

describe('@timeui/tokens', () => {
  it('exposes a full primitive surface', () => {
    expect(tokens.palette).toBe(palette);
    expect(tokens.spacing).toBe(spacing);
    expect(tokens.radius).toBe(radius);
    expect(tokens.shadows).toBe(shadows);
    expect(tokens.zIndex).toBe(zIndex);
    expect(tokens.breakpoints).toBe(breakpoints);
    expect(tokens.motion).toBe(motion);
  });

  it('has ten color ramps with a 500 step', () => {
    const ramps = [
      'gray',
      'blue',
      'green',
      'red',
      'orange',
      'yellow',
      'purple',
      'cyan',
      'magenta',
      'volcano',
    ] as const;
    for (const r of ramps) {
      expect(palette[r]).toBeDefined();
      expect(palette[r]).toHaveProperty('500');
    }
  });

  it('spacing scale is 4px-based', () => {
    expect(spacing[1]).toBe('4px');
    expect(spacing[4]).toBe('16px');
    expect(spacing[96]).toBe('384px');
  });

  it('z-index layers are ordered correctly', () => {
    expect(zIndex.dropdown).toBeLessThan(zIndex.modal);
    expect(zIndex.modal).toBeLessThan(zIndex.popover);
    expect(zIndex.popover).toBeLessThan(zIndex.tooltip);
  });
});
