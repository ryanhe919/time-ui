/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Callout 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Callout } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

describe('Callout', () => {
  it('renders title and children', () => {
    renderWithProviders(<Callout title="注意">请仔细阅读说明。</Callout>);
    expect(screen.getByText('注意')).toBeInTheDocument();
    expect(screen.getByText('请仔细阅读说明。')).toBeInTheDocument();
  });

  it('uses role=alert for warning and danger', () => {
    const { rerender } = renderWithProviders(<Callout variant="warning">Warning body</Callout>);
    expect(screen.getByRole('alert')).toHaveTextContent('Warning body');
    rerender(<Callout variant="danger">Danger body</Callout>);
    expect(screen.getByRole('alert')).toHaveTextContent('Danger body');
  });

  it('uses role=status for info, tip, success', () => {
    renderWithProviders(<Callout variant="info">Info body</Callout>);
    expect(screen.getByRole('status')).toHaveTextContent('Info body');
  });

  it('hides the icon slot when icon={false}', () => {
    const { container } = renderWithProviders(<Callout icon={false}>No glyph here.</Callout>);
    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
    expect((root.style.gridTemplateColumns || '').trim()).toBe('');
    expect(root.querySelectorAll('[aria-hidden]').length).toBe(0);
  });

  it('allows overriding the glyph', () => {
    renderWithProviders(<Callout icon={<span data-testid="custom">🚧</span>}>Body</Callout>);
    expect(screen.getByTestId('custom')).toHaveTextContent('🚧');
  });

  it('writes data-variant for style hooks', () => {
    const { container } = renderWithProviders(<Callout variant="success">ok</Callout>);
    expect(container.querySelector('[data-variant="success"]')).toBeTruthy();
  });
});
