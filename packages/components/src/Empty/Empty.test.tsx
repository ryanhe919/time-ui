/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Empty 组件的渲染、预设插画、无障碍等。
 */

import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Empty } from './Empty';

describe('Empty', () => {
  it('renders default with title and description', () => {
    renderWithProviders(<Empty title="No items" description="Try a different filter" />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('No items');
    expect(screen.getByTestId('empty-desc')).toHaveTextContent('Try a different filter');
  });

  it('renders each preset image', () => {
    const presets = ['default', 'search', 'error', 'no-data'] as const;
    for (const p of presets) {
      const { unmount, getByTestId } = renderWithProviders(<Empty image={p} title={p} />);
      expect(getByTestId('empty-image')).toBeInTheDocument();
      unmount();
    }
  });

  it('renders custom ReactNode image', () => {
    renderWithProviders(<Empty image={<span data-testid="custom-img">!</span>} title="Custom" />);
    expect(screen.getByTestId('custom-img')).toBeInTheDocument();
  });

  it('supports each size', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const s of sizes) {
      const { unmount, container } = renderWithProviders(<Empty size={s} title={`s-${s}`} />);
      expect(container.querySelector(`[data-size="${s}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('supports inline variant', () => {
    const { container } = renderWithProviders(<Empty variant="inline" title="t" />);
    expect(container.querySelector('[data-variant="inline"]')).toBeTruthy();
  });

  it('renders actions', () => {
    renderWithProviders(<Empty title="Nothing" actions={<button type="button">Refresh</button>} />);
    expect(screen.getByTestId('empty-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithProviders(
      <Empty title="t">
        <span data-testid="empty-extra">extra</span>
      </Empty>,
    );
    expect(screen.getByTestId('empty-extra')).toBeInTheDocument();
  });

  it('omits image block when image is null', () => {
    renderWithProviders(<Empty image={null} title="No image" />);
    expect(screen.queryByTestId('empty-image-wrap')).not.toBeInTheDocument();
  });

  it('forwards ref to root element', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithProviders(<Empty title="t" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(
      <Empty
        image="search"
        title="No matching results"
        description="Try a different search term."
        actions={<button type="button">Reset</button>}
      />,
    );
    await expectA11y(container);
  });

  it('exposes status role', () => {
    renderWithProviders(<Empty title="x" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
