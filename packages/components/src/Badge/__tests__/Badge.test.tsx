/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Badge 组件的各种渲染规则与无障碍。
 */

import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Badge } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

describe('Badge', () => {
  it('renders standard with content', () => {
    renderWithProviders(<Badge content={5} />);
    expect(screen.getByTestId('badge')).toHaveTextContent('5');
  });

  it('formats numeric overflow with max+ suffix', () => {
    renderWithProviders(<Badge content={123} max={99} />);
    expect(screen.getByTestId('badge')).toHaveTextContent('99+');
  });

  it('hides 0 unless showZero', () => {
    const { rerender, queryByTestId } = renderWithProviders(<Badge content={0} />);
    expect(queryByTestId('badge')).not.toBeInTheDocument();
    rerender(<Badge content={0} showZero />);
    expect(queryByTestId('badge')).toBeInTheDocument();
  });

  it('renders dot variant without content', () => {
    renderWithProviders(<Badge variant="dot" aria-label="status" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'dot');
    expect(badge.textContent).toBe('');
  });

  it('renders pulsing dot', () => {
    renderWithProviders(<Badge variant="dot" isPulse aria-label="live" />);
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'dot');
  });

  it('supports each placement', () => {
    const placements = ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;
    for (const p of placements) {
      const { unmount, container } = renderWithProviders(
        <Badge content={1} placement={p}>
          <button type="button">child</button>
        </Badge>,
      );
      expect(container.querySelector(`[data-placement="${p}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('supports each color', () => {
    const colors = ['neutral', 'primary', 'success', 'warning', 'danger'] as const;
    for (const c of colors) {
      const { unmount, container } = renderWithProviders(<Badge content={3} color={c} />);
      expect(container.querySelector(`[data-color="${c}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('wraps children with positioned badge', () => {
    renderWithProviders(
      <Badge content={9}>
        <button type="button">target</button>
      </Badge>,
    );
    expect(screen.getByRole('button', { name: 'target' })).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveTextContent('9');
  });

  it('isInvisible hides the badge in standalone mode', () => {
    const { container } = renderWithProviders(<Badge content={5} isInvisible />);
    expect(container.querySelector('[data-invisible="true"]')).toBeTruthy();
  });

  it('isInvisible hides only the badge when wrapping children', () => {
    renderWithProviders(
      <Badge content={5} isInvisible>
        <button type="button">child</button>
      </Badge>,
    );
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'child' })).toBeInTheDocument();
  });

  it('isOneCharacter triggers compact styling for content=1', () => {
    renderWithProviders(<Badge content={1} isOneCharacter />);
    expect(screen.getByTestId('badge')).toHaveTextContent('1');
  });

  it('renders custom non-numeric content', () => {
    renderWithProviders(<Badge content="NEW" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('NEW');
  });

  it('respects showOutline=false', () => {
    renderWithProviders(<Badge content={1} showOutline={false} />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('forwards ref to root element', () => {
    const ref = createRef<HTMLSpanElement>();
    renderWithProviders(<Badge content={1} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
