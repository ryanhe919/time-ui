/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Tag 组件的渲染、关闭、交互与无障碍。
 */

import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

describe('Tag', () => {
  it('renders children', () => {
    renderWithProviders(<Tag>Label</Tag>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('supports each size', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const s of sizes) {
      const { unmount, container } = renderWithProviders(<Tag size={s}>{`s-${s}`}</Tag>);
      expect(container.querySelector(`[data-size="${s}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('supports each variant', () => {
    const variants = ['solid', 'soft', 'outline'] as const;
    for (const v of variants) {
      const { unmount, container } = renderWithProviders(<Tag variant={v}>{`v-${v}`}</Tag>);
      expect(container.querySelector(`[data-variant="${v}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('supports each color', () => {
    const colors = ['neutral', 'primary', 'secondary', 'success', 'warning', 'danger'] as const;
    for (const c of colors) {
      const { unmount, container } = renderWithProviders(<Tag color={c}>{`c-${c}`}</Tag>);
      expect(container.querySelector(`[data-color="${c}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('renders pill shape', () => {
    const { container } = renderWithProviders(<Tag shape="pill">P</Tag>);
    expect(container.querySelector('[data-shape="pill"]')).toBeTruthy();
  });

  it('shows close button and fires onClose', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Tag isClosable onClose={onClose}>
        Pill
      </Tag>,
    );
    const close = screen.getByTestId('tag-close');
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not fire onClose when disabled', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Tag isClosable isDisabled onClose={onClose}>
        Disabled
      </Tag>,
    );
    const close = screen.getByTestId('tag-close');
    await userEvent.click(close, { pointerEventsCheck: 0 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders interactive as a button and fires onPress on click', async () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Tag isInteractive onPress={onPress}>
        Press
      </Tag>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Press' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('fires onPress on Enter key', async () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Tag isInteractive onPress={onPress}>
        Press
      </Tag>,
    );
    const btn = screen.getByRole('button', { name: 'Press' });
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalled();
  });

  it('fires onPress on Space key', async () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Tag isInteractive onPress={onPress}>
        Press
      </Tag>,
    );
    const btn = screen.getByRole('button', { name: 'Press' });
    btn.focus();
    await userEvent.keyboard(' ');
    expect(onPress).toHaveBeenCalled();
  });

  it('renders as span when not interactive', () => {
    renderWithProviders(<Tag>Static</Tag>);
    expect(screen.queryByRole('button', { name: 'Static' })).not.toBeInTheDocument();
  });

  it('renders startContent and endContent', () => {
    renderWithProviders(
      <Tag
        startContent={<span data-testid="start">S</span>}
        endContent={<span data-testid="end">E</span>}
      >
        With both
      </Tag>,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });

  it('forwards ref to root element', () => {
    const ref = createRef<HTMLSpanElement>();
    renderWithProviders(<Tag ref={ref as never}>R</Tag>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('disables interactive button via disabled attr', () => {
    renderWithProviders(
      <Tag isInteractive isDisabled onPress={() => {}}>
        Off
      </Tag>,
    );
    // when disabled and interactive, we still render span (not button) per implementation
    expect(screen.queryByRole('button', { name: 'Off' })).not.toBeInTheDocument();
  });
});
