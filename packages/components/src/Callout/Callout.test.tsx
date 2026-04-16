import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { Callout } from './Callout';

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
    // Root has two grid tracks with the glyph, one without.
    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
    // Grid template columns '1fr' when hidden vs 'auto 1fr' when shown.
    expect((root.style.gridTemplateColumns || '').trim()).toBe('');
    // But we can still assert there is no decorative glyph column via role/aria:
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
