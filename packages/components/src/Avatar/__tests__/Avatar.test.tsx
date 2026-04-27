/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Avatar / AvatarGroup 组件的核心行为与无障碍。
 */

import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Avatar, AvatarGroup } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    const { container } = renderWithProviders(<Avatar src="/me.png" alt="Me" />);
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/me.png');
    expect(img?.getAttribute('alt')).toBe('Me');
  });

  it('falls back to initials when image fails to load', () => {
    const onError = vi.fn();
    const { container } = renderWithProviders(
      <Avatar src="/broken.png" alt="Bob Lee" name="Bob Lee" onError={onError} />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    fireEvent.error(img as HTMLImageElement);
    expect(onError).toHaveBeenCalledOnce();
    expect(screen.getByText('BL')).toBeInTheDocument();
  });

  it('renders single-letter initials slice for single-name input', () => {
    renderWithProviders(<Avatar name="ada" alt="ada" />);
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('renders fallback icon when no image and no name', () => {
    renderWithProviders(<Avatar alt="Custom" fallbackIcon={<span data-testid="fb">★</span>} />);
    expect(screen.getByTestId('fb')).toBeInTheDocument();
  });

  it('renders a default user icon when nothing else is provided', () => {
    const { container } = renderWithProviders(<Avatar alt="anon" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('forwards ref to the root element', () => {
    const ref = createRef<HTMLSpanElement>();
    renderWithProviders(<Avatar alt="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('supports all named sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    for (const s of sizes) {
      const { unmount, getByRole } = renderWithProviders(<Avatar alt={`s-${s}`} size={s} />);
      expect(getByRole('img', { name: `s-${s}` })).toHaveAttribute('data-size', s);
      unmount();
    }
  });

  it('supports a numeric size', () => {
    const { getByRole } = renderWithProviders(<Avatar alt="num" size={64} />);
    expect(getByRole('img', { name: 'num' })).toHaveAttribute('data-size', 'custom');
  });

  it('renders with each named color', () => {
    const colors = ['neutral', 'primary', 'success', 'warning', 'danger'] as const;
    for (const c of colors) {
      const { unmount, getByRole } = renderWithProviders(<Avatar alt={`c-${c}`} color={c} />);
      expect(getByRole('img', { name: `c-${c}` })).toHaveAttribute('data-color', c);
      unmount();
    }
  });

  it('resolves color="auto" deterministically based on name hash', () => {
    const { getByRole } = renderWithProviders(
      <Avatar alt="auto" name="Sarah Connor" color="auto" />,
    );
    const c = getByRole('img', { name: 'auto' }).getAttribute('data-color');
    expect(c).toBeTruthy();
    expect(['primary', 'success', 'warning', 'danger', 'neutral']).toContain(c as string);
  });

  it('falls back to neutral when color="auto" without a name', () => {
    const { getByRole } = renderWithProviders(<Avatar alt="auto" color="auto" />);
    expect(getByRole('img', { name: 'auto' })).toHaveAttribute('data-color', 'neutral');
  });

  it('renders square shape when requested', () => {
    const { getByRole } = renderWithProviders(<Avatar alt="sq" shape="square" />);
    expect(getByRole('img', { name: 'sq' })).toHaveAttribute('data-shape', 'square');
  });

  it('renders status dot for each status', () => {
    const statuses = ['online', 'offline', 'busy', 'away'] as const;
    for (const s of statuses) {
      const { unmount, getByTestId } = renderWithProviders(<Avatar alt={`s-${s}`} status={s} />);
      expect(getByTestId('avatar-status-dot')).toHaveAttribute('data-status', s);
      unmount();
    }
  });

  it('renders bordered ring when isBordered', () => {
    const { getByRole } = renderWithProviders(<Avatar alt="b" isBordered />);
    expect(getByRole('img', { name: 'b' })).toHaveAttribute('data-bordered', 'true');
  });

  it('renders a small status dot for xs size (<=24px branch)', () => {
    renderWithProviders(<Avatar alt="xs" size="xs" status="online" />);
    expect(screen.getByTestId('avatar-status-dot')).toHaveAttribute('data-status', 'online');
  });

  it('renders xl size variant via data-size attribute', () => {
    const { getByRole } = renderWithProviders(<Avatar alt="xl" size="xl" />);
    expect(getByRole('img', { name: 'xl' })).toHaveAttribute('data-size', 'xl');
  });

  it('falls back to Avatar default label when alt is omitted', () => {
    const { getByRole } = renderWithProviders(<Avatar />);
    expect(getByRole('img', { name: 'Avatar' })).toBeInTheDocument();
  });

  it('uses name as label when alt omitted', () => {
    const { getByRole } = renderWithProviders(<Avatar name="Carol" />);
    expect(getByRole('img', { name: 'Carol' })).toBeInTheDocument();
  });

  it('treats blank name as no initials', () => {
    const { container } = renderWithProviders(<Avatar alt="blank" name="   " />);
    // No initials text rendered; default user icon should appear
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('resets the error state when src changes', () => {
    const { rerender, container } = renderWithProviders(
      <Avatar src="/old.png" alt="me" name="Me Test" />,
    );
    let img = container.querySelector('img') as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('MT')).toBeInTheDocument();
    rerender(<Avatar src="/new.png" alt="me" name="Me Test" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/new.png');
  });
});

describe('AvatarGroup', () => {
  it('renders all children when below max', () => {
    renderWithProviders(
      <AvatarGroup max={5}>
        <Avatar alt="a" name="A" />
        <Avatar alt="b" name="B" />
      </AvatarGroup>,
    );
    expect(screen.getByRole('img', { name: 'a' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'b' })).toBeInTheDocument();
  });

  it('truncates and shows surplus +N', () => {
    renderWithProviders(
      <AvatarGroup max={2}>
        <Avatar alt="a" name="A" />
        <Avatar alt="b" name="B" />
        <Avatar alt="c" name="C" />
        <Avatar alt="d" name="D" />
      </AvatarGroup>,
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'c' })).not.toBeInTheDocument();
  });

  it('respects total override for surplus computation', () => {
    renderWithProviders(
      <AvatarGroup max={1} total={10}>
        <Avatar alt="a" name="A" />
      </AvatarGroup>,
    );
    expect(screen.getByText('+9')).toBeInTheDocument();
  });

  it('uses renderSurplus when provided', () => {
    renderWithProviders(
      <AvatarGroup max={1}>
        <Avatar alt="a" name="A" />
        <Avatar alt="b" name="B" />
        <Avatar alt="c" name="C" />
        {/* third+ items collapse */}
      </AvatarGroup>,
    );
    expect(screen.getByText('+2')).toBeInTheDocument();

    const { container } = renderWithProviders(
      <AvatarGroup
        max={1}
        renderSurplus={(c) => <span data-testid="custom-surplus">more {c}</span>}
      >
        <Avatar alt="a" name="A" />
        <Avatar alt="b" name="B" />
      </AvatarGroup>,
    );
    expect(container.querySelector('[data-testid="custom-surplus"]')).toBeTruthy();
  });

  it('supports each spacing option', () => {
    const spacings = ['tight', 'normal', 'loose'] as const;
    for (const s of spacings) {
      const { unmount, container } = renderWithProviders(
        <AvatarGroup spacing={s}>
          <Avatar alt="a" name="A" />
          <Avatar alt="b" name="B" />
        </AvatarGroup>,
      );
      expect(container.querySelector(`[data-spacing="${s}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('forwards ref to wrapper', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithProviders(
      <AvatarGroup ref={ref}>
        <Avatar alt="a" name="A" />
      </AvatarGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders surplus with numeric size override', () => {
    renderWithProviders(
      <AvatarGroup max={1} size={32}>
        <Avatar alt="a" name="A" />
        <Avatar alt="b" name="B" />
        <Avatar alt="c" name="C" />
      </AvatarGroup>,
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders no surplus item when within max', () => {
    renderWithProviders(
      <AvatarGroup max={3}>
        <Avatar alt="a" name="A" />
        <Avatar alt="b" name="B" />
      </AvatarGroup>,
    );
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('keeps explicit child isBordered=false intact', () => {
    const { container } = renderWithProviders(
      <AvatarGroup>
        <Avatar alt="a" name="A" isBordered={false} />
      </AvatarGroup>,
    );
    expect(container.querySelector('[data-bordered="true"]')).toBeNull();
  });
});
