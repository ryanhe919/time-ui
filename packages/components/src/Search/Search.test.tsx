import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { Search } from './Search';

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
});
