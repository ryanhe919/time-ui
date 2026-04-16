/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 theme 工具模块的行为与回归。
 */

import { describe, expect, it } from 'vitest';
import { lightTheme } from '@timeui/themes';
import { t } from './theme';

describe('utils/theme.t', () => {
  it('reads values from a full theme', () => {
    const tokens = t(lightTheme);
    expect(tokens.space(2)).not.toBe('0');
    expect(tokens.radius('md')).not.toBe('0');
    expect(tokens.shadow('sm')).not.toBe('none');
    expect(tokens.fs('md')).toMatch(/px$/);
    expect(tokens.fw('medium')).toBeGreaterThan(0);
    expect(tokens.color.primary).toBe(lightTheme.colors.action.primary.default);
    expect(tokens.color.text).toBe(lightTheme.colors.text.primary);
  });

  it('falls back to safe defaults when theme is partial', () => {
    const partialTheme = {
      tokens: {
        motion: { duration: { fast: '111ms' } },
        zIndex: { modal: 77 },
      },
    } as never;
    const tokens = t(partialTheme);
    expect(tokens.space('missing')).toBe('0');
    expect(tokens.radius('missing')).toBe('0');
    expect(tokens.shadow('missing')).toBe('none');
    expect(tokens.fs('missing')).toBe('14px');
    expect(tokens.fw('missing')).toBe(400);
    expect(tokens.font).toBe('system-ui, sans-serif');
    expect(tokens.motion.duration('fast')).toBe('111ms');
    expect(tokens.motion.duration('slow')).toBe('150ms');
    expect(tokens.z('modal')).toBe(77);
    expect(tokens.z('missing')).toBe(0);
    expect(tokens.color.primary).toBe('#1677ff');
    expect(tokens.color.neutral('404')).toBe('#999');
  });
});
