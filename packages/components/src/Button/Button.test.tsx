/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Button 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { Button } from './Button';
import { lightTheme } from '@timeui/themes';

const getHeadCss = () => document.head.textContent ?? '';

describe('Button', () => {
  it('renders children', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const fn = vi.fn();
    renderWithProviders(<Button onClick={fn}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('respects disabled', async () => {
    const fn = vi.fn();
    renderWithProviders(
      <Button disabled onClick={fn}>
        Nope
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn, { pointerEventsCheck: 0 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    renderWithProviders(<Button loading>Load</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('renders polymorphic as anchor', () => {
    renderWithProviders(
      <Button as="a" href="#x">
        link
      </Button>,
    );
    expect(screen.getByRole('link', { name: /link/i })).toBeInTheDocument();
  });

  it('maps legacy variants to expected data attributes', () => {
    const { rerender } = renderWithProviders(<Button variant="primary">P</Button>);
    let btn = screen.getByRole('button', { name: 'P' });
    expect(btn).toHaveAttribute('data-variant', 'solid');
    expect(btn).toHaveAttribute('data-color', 'primary');

    rerender(<Button variant="outline">O</Button>);
    btn = screen.getByRole('button', { name: 'O' });
    expect(btn).toHaveAttribute('data-variant', 'bordered');
    expect(btn).toHaveAttribute('data-color', 'primary');

    rerender(<Button variant="danger">D</Button>);
    btn = screen.getByRole('button', { name: 'D' });
    expect(btn).toHaveAttribute('data-variant', 'solid');
    expect(btn).toHaveAttribute('data-color', 'danger');

    rerender(<Button variant="secondary">S</Button>);
    btn = screen.getByRole('button', { name: 'S' });
    expect(btn).toHaveAttribute('data-variant', 'solid');
    expect(btn).toHaveAttribute('data-color', 'secondary');
  });

  it('keeps ghost variant and uses default color when color is omitted', () => {
    renderWithProviders(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn).toHaveAttribute('data-variant', 'ghost');
    expect(btn).toHaveAttribute('data-color', 'default');
  });

  it('keeps ghost variant when explicit color is provided', () => {
    renderWithProviders(
      <Button variant="ghost" color="secondary">
        GhostSecondary
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'GhostSecondary' });
    expect(btn).toHaveAttribute('data-variant', 'ghost');
    expect(btn).toHaveAttribute('data-color', 'secondary');
  });

  it('supports all modern variants through data-variant', () => {
    const variants = ['solid', 'bordered', 'light', 'flat', 'faded', 'shadow', 'ghost'] as const;
    for (const variant of variants) {
      const label = `v-${variant}`;
      const { unmount } = renderWithProviders(<Button variant={variant}>{label}</Button>);
      const btn = screen.getByRole('button', { name: label });
      expect(btn).toHaveAttribute('data-variant', variant);
      unmount();
    }
  });

  it('replaces startIcon with spinner and hides endIcon while loading', () => {
    renderWithProviders(
      <Button
        loading
        startIcon={<span data-testid="start-icon">S</span>}
        endIcon={<span data-testid="end-icon">E</span>}
      >
        Submit
      </Button>,
    );
    expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('data-loading', 'true');
  });

  it('converts 3-digit hex theme colors to rgba in generated shadow styles', () => {
    const theme = {
      ...lightTheme,
      colors: {
        ...lightTheme.colors,
        primary: {
          ...lightTheme.colors.primary,
          DEFAULT: '#abc',
        },
      },
    };

    renderWithProviders(
      <Button variant="shadow" color="primary">
        HexShadow
      </Button>,
      { theme },
    );

    expect(getHeadCss()).toContain('rgba(170, 187, 204, 0.4)');
  });

  it('keeps unsupported 4-digit hex input unchanged in generated styles', () => {
    const theme = {
      ...lightTheme,
      colors: {
        ...lightTheme.colors,
        warning: {
          ...lightTheme.colors.warning,
          DEFAULT: '#abcd',
        },
      },
    };

    renderWithProviders(
      <Button variant="flat" color="warning">
        HexFlat
      </Button>,
      { theme },
    );

    expect(getHeadCss()).toContain('#abcd');
  });
});
