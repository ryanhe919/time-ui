import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expectA11y, renderWithProviders } from '../test-utils';
import { CodeBlock } from './CodeBlock';

const sample = "const x = 'hi';";

describe('CodeBlock', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('renders the code text', () => {
    renderWithProviders(<CodeBlock code={sample} />);
    expect(screen.getByText(sample)).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderWithProviders(<CodeBlock code={sample} title="example.ts" />);
    expect(screen.getByText('example.ts')).toBeInTheDocument();
  });

  it('shows localized Copy label (zh by default)', () => {
    renderWithProviders(<CodeBlock code={sample} />);
    expect(screen.getByRole('button', { name: '复制代码' })).toBeInTheDocument();
    expect(screen.getByText('复制')).toBeInTheDocument();
  });

  it('shows English labels when locale=en', () => {
    renderWithProviders(<CodeBlock code={sample} />, {
      config: { locale: 'en' },
    });
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('copies to clipboard and flips label transiently', async () => {
    const onCopy = vi.fn();
    renderWithProviders(<CodeBlock code={sample} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: '复制代码' }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(sample);
      expect(onCopy).toHaveBeenCalledWith(sample);
      expect(screen.getByText('已复制')).toBeInTheDocument();
    });
  });

  it('hides copy button when copyable=false', () => {
    renderWithProviders(<CodeBlock code={sample} copyable={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('passes axe with default props', async () => {
    const { container } = renderWithProviders(
      <CodeBlock code="const x = 1;" title="example.ts" noHighlight />,
    );
    await expectA11y(container);
  });

  it('passes axe without copy button', async () => {
    const { container } = renderWithProviders(
      <CodeBlock code="const x = 1;" copyable={false} noHighlight />,
    );
    await expectA11y(container);
  });
});
