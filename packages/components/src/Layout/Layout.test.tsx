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
});
