/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Search 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { Search } from '../';

describe('Search', () => {
  it('renders the localized placeholder by default (zh)', () => {
    renderWithProviders(<Search />);
    expect(screen.getByRole('button', { name: '搜索…' })).toBeInTheDocument();
  });

  it('uses English placeholder when locale=en', () => {
    renderWithProviders(<Search />, { config: { locale: 'en' } });
    expect(screen.getByRole('button', { name: 'Search…' })).toBeInTheDocument();
  });

  it('honors a custom placeholder + shortcut hint', () => {
    renderWithProviders(<Search placeholder="搜索文档…" shortcut="⌘K" />);
    expect(screen.getByRole('button', { name: '搜索文档…' })).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const onClick = vi.fn();
    renderWithProviders(<Search onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respects disabled state', () => {
    const onClick = vi.fn();
    renderWithProviders(<Search disabled onClick={onClick} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('writes data-size + data-variant for hooks', () => {
    const { container } = renderWithProviders(<Search size="lg" variant="flat" />);
    const btn = container.querySelector('button');
    expect(btn?.getAttribute('data-size')).toBe('lg');
    expect(btn?.getAttribute('data-variant')).toBe('flat');
  });

  it('prefers explicit aria-label over placeholder text', () => {
    renderWithProviders(<Search aria-label="Open search dialog" placeholder="Ignored text" />);
    expect(screen.getByRole('button', { name: 'Open search dialog' })).toBeInTheDocument();
  });

  it('accepts a custom icon and explicit button type', () => {
    renderWithProviders(
      <Search icon={<span data-testid="custom-icon">I</span>} type="submit" placeholder="Go" />,
    );
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('supports fullWidth layout hook', () => {
    const { container } = renderWithProviders(<Search fullWidth placeholder="Wide search" />);
    const btn = container.querySelector('button');
    expect(btn).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain('width:100%');
  });

  it('uses the default icon and button type when not overridden', () => {
    const { container } = renderWithProviders(<Search placeholder="Default search" />);
    const btn = screen.getByRole('button', { name: 'Default search' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(container.querySelector('circle')).not.toBeNull();
    expect(container.querySelector('path')).not.toBeNull();
  });

  it('applies small bordered and large flat style branches', () => {
    renderWithProviders(
      <>
        <Search placeholder="Small" size="sm" variant="bordered" />
        <Search placeholder="Large" size="lg" variant="flat" />
      </>,
    );
    const styles = document.head.textContent ?? '';
    expect(styles).toContain('height:28px');
    expect(styles).toContain('font-size:12px');
    expect(styles).toContain('border:1px solid');
    expect(styles).toContain('height:44px');
    expect(styles).toContain('font-size:15px');
  });
});
