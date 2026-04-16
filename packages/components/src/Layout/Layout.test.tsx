/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Layout 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { Box, Flex, Grid, Stack, Container } from './Layout';

describe('Layout primitives', () => {
  it('render', () => {
    renderWithProviders(
      <Container data-testid="c">
        <Box data-testid="b">b</Box>
        <Flex data-testid="f">f</Flex>
        <Grid data-testid="g">g</Grid>
        <Stack data-testid="s">s</Stack>
      </Container>,
    );
    expect(screen.getByTestId('c')).toBeInTheDocument();
    expect(screen.getByTestId('b')).toBeInTheDocument();
    expect(screen.getByTestId('f')).toBeInTheDocument();
    expect(screen.getByTestId('g')).toBeInTheDocument();
    expect(screen.getByTestId('s')).toBeInTheDocument();
  });

  it('supports polymorphic rendering and sx styles', () => {
    renderWithProviders(
      <Box as="section" data-testid="box" sx={{ padding: 12 }}>
        content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box.tagName).toBe('SECTION');
    expect(document.head.textContent ?? '').toContain('padding:12px');
  });

  it('applies custom flex props and numeric gap conversion', () => {
    renderWithProviders(
      <Flex
        data-testid="flex"
        direction="column"
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={10}
      >
        flex
      </Flex>,
    );
    expect(screen.getByTestId('flex')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain('flex-direction:column');
    expect(document.head.textContent ?? '').toContain('align-items:center');
    expect(document.head.textContent ?? '').toContain('justify-content:space-between');
    expect(document.head.textContent ?? '').toContain('flex-wrap:wrap');
    expect(document.head.textContent ?? '').toContain('gap:10px');
  });

  it('applies grid columns and row/column gap overrides', () => {
    renderWithProviders(
      <Grid data-testid="grid" columns="1fr 2fr" gap={8} rowGap="12px" columnGap={16}>
        grid
      </Grid>,
    );
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain('grid-template-columns:1fr 2fr');
    expect(document.head.textContent ?? '').toContain('gap:8px');
    expect(document.head.textContent ?? '').toContain('row-gap:12px');
    expect(document.head.textContent ?? '').toContain('column-gap:16px');
  });

  it('uses stack spacing strings and custom alignment', () => {
    renderWithProviders(
      <Stack data-testid="stack" direction="row" spacing="1.5rem" align="center" justify="end">
        stack
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain('flex-direction:row');
    expect(document.head.textContent ?? '').toContain('gap:1.5rem');
    expect(document.head.textContent ?? '').toContain('align-items:center');
    expect(document.head.textContent ?? '').toContain('justify-content:end');
  });

  it('supports custom maxWidth strings and disabling container padding', () => {
    renderWithProviders(
      <Container as="main" data-testid="container" maxWidth="72rem" padded={false}>
        shell
      </Container>,
    );
    const container = screen.getByTestId('container');
    expect(container.tagName).toBe('MAIN');
    const className = Array.from(container.classList).find((name) => name.startsWith('css-'));
    const styles = document.head.textContent ?? '';
    expect(styles).toContain('max-width:72rem');
    expect(styles).toContain(
      `.${className}{width:100%;max-width:72rem;margin-left:auto;margin-right:auto;box-sizing:border-box;}`,
    );
  });
});
