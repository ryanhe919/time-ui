/**
 * @author Ryan He
 * @date 2026-04-28
 * @description 验证 Layout 原语在 light 与 dark 主题下均无 axe 违规。
 */

import { describe, test } from 'vitest';
import { Box, Flex, Grid, Stack, Container } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

const themes = [{ theme: 'light' }, { theme: 'dark' }] as const;

describe('Layout — accessibility', () => {
  test.each(themes)('Box renders accessibly in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(<Box>content</Box>, { theme });
    await expectA11y(container);
  });

  test.each(themes)('Flex renders accessibly in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(
      <Flex direction="row" gap={8}>
        <span>a</span>
        <span>b</span>
      </Flex>,
      { theme },
    );
    await expectA11y(container);
  });

  test.each(themes)('Grid renders accessibly in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(
      <Grid>
        <div>1</div>
        <div>2</div>
      </Grid>,
      { theme },
    );
    await expectA11y(container);
  });

  test.each(themes)('Stack renders accessibly in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(
      <Stack spacing={12}>
        <span>row 1</span>
        <span>row 2</span>
      </Stack>,
      { theme },
    );
    await expectA11y(container);
  });

  test.each(themes)('Container with semantic landmark passes a11y in $theme', async ({ theme }) => {
    const { container } = renderWithProviders(
      <Container as="main" aria-label="primary">
        <p>page content</p>
      </Container>,
      { theme },
    );
    await expectA11y(container);
  });
});
