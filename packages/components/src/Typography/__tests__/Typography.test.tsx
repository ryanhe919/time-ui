/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Typography 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Text, Heading, Paragraph, Link, Code } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

describe('Typography', () => {
  it('renders Text', () => {
    renderWithProviders(<Text>hi</Text>);
    expect(screen.getByText('hi')).toBeInTheDocument();
  });
  it('renders Heading with correct level', () => {
    renderWithProviders(<Heading level={3}>ttl</Heading>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
  it('renders Paragraph, Link, Code', () => {
    renderWithProviders(
      <>
        <Paragraph>p</Paragraph>
        <Link href="#">L</Link>
        <Code>c</Code>
      </>,
    );
    expect(screen.getByText('p')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveTextContent('L');
    expect(screen.getByText('c')).toBeInTheDocument();
  });

  it('supports isMuted and isTruncated text styling branches', () => {
    renderWithProviders(
      <Text size="lg" weight="bold" isMuted isTruncated data-testid="text">
        long text
      </Text>,
    );
    expect(screen.getByTestId('text')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain('text-overflow:ellipsis');
    expect(document.head.textContent ?? '').toContain('white-space:nowrap');
    expect(document.head.textContent ?? '').toContain('display:inline-block');
    expect(document.head.textContent ?? '').toContain('max-width:100%');
  });

  it('renders all 5 Text size tiers (xs / sm / md / lg / xl)', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    for (const s of sizes) {
      const { unmount } = renderWithProviders(
        <Text size={s} data-testid={`t-${s}`}>{`s-${s}`}</Text>,
      );
      expect(screen.getByTestId(`t-${s}`)).toBeInTheDocument();
      unmount();
    }
  });

  it('defaults heading level to h2 and maps lower heading sizes', () => {
    renderWithProviders(
      <>
        <Heading>Default heading</Heading>
        <Heading level={6}>Small heading</Heading>
      </>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Default heading');
    expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('Small heading');
    expect(document.head.textContent ?? '').toContain('font-size:14px');
  });

  it('renders paragraph, link and code style branches', () => {
    renderWithProviders(
      <>
        <Paragraph data-testid="paragraph">Body</Paragraph>
        <Link data-testid="link" href="https://example.com">
          Visit
        </Link>
        <Code data-testid="code">const a = 1</Code>
      </>,
    );
    expect(screen.getByTestId('paragraph').tagName).toBe('P');
    expect(screen.getByTestId('link')).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByTestId('code').tagName).toBe('CODE');
    expect(document.head.textContent ?? '').toContain('text-decoration:none');
    expect(document.head.textContent ?? '').toContain('text-decoration:underline');
    expect(document.head.textContent ?? '').toContain('outline:2px solid');
    expect(document.head.textContent ?? '').toContain('font-family:ui-monospace');
  });
});
