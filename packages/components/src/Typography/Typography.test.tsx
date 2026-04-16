import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { Text, Heading, Paragraph, Link, Code } from './Typography';

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
});
