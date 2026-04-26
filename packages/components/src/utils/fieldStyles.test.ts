/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 fieldStyles 工具模块的行为与回归。
 */

import { describe, expect, it } from 'vitest';
import { lightTheme } from '@timeui/themes';
import { getFieldVariantStyles } from './fieldStyles';

describe('utils/getFieldVariantStyles', () => {
  it('builds underlined invalid styles with border-bottom focus path', () => {
    const styles = getFieldVariantStyles({
      theme: lightTheme,
      variant: 'underlined',
      color: 'primary',
      isInvalid: true,
    });
    expect(styles.styles).toContain('border-bottom');
    expect(styles.styles).toContain(lightTheme.colors.status.danger);
    expect(styles.styles).not.toContain('outline: 2px solid');
  });

  it('builds flat primary styles with edge-only focus path', () => {
    const styles = getFieldVariantStyles({
      theme: lightTheme,
      variant: 'flat',
      color: 'primary',
    });
    expect(styles.styles).toContain('outline: none');
    expect(styles.styles).toContain(`box-shadow: inset 0 0 0 ${lightTheme.borders.width.thick}`);
    expect(styles.styles).toContain('border-color:');
    expect(styles.styles).toContain('background-color: rgba(');
    expect(styles.styles).toContain('&:focus-visible');
  });

  it('adds disabled and readonly affordances', () => {
    const styles = getFieldVariantStyles({
      theme: lightTheme,
      variant: 'bordered',
      color: 'default',
      isDisabled: true,
      isReadOnly: true,
    });
    expect(styles.styles).toContain('opacity: 0.5');
    expect(styles.styles).toContain('cursor: not-allowed');
    expect(styles.styles).toContain('cursor: default');
  });

  it('builds faded default styles with hover background fallback', () => {
    const styles = getFieldVariantStyles({
      theme: lightTheme,
      variant: 'faded',
      color: 'default',
    });
    expect(styles.styles).toContain(`background-color: ${lightTheme.colors.default[100]}`);
    expect(styles.styles).toContain(`border-color: ${lightTheme.colors.default[600]}`);
    expect(styles.styles).toContain(`background-color: ${lightTheme.colors.default[200]}`);
  });

  it('builds bordered invalid styles with edge-only focus path', () => {
    const styles = getFieldVariantStyles({
      theme: lightTheme,
      variant: 'bordered',
      color: 'secondary',
      isInvalid: true,
    });
    expect(styles.styles).toContain(
      `border: ${lightTheme.borders.width.thin} solid ${lightTheme.colors.status.danger}`,
    );
    expect(styles.styles).toContain(`border-color: ${lightTheme.colors.secondary[500]}`);
    expect(styles.styles).toContain(
      `box-shadow: inset 0 0 0 ${lightTheme.borders.width.thick} ${lightTheme.colors.secondary[500]}`,
    );
  });
});
