/**
 * @author Ryan He
 * @date 2026-04-28
 * @description 验证 Typography 模块（Text/Heading/Paragraph/Link/Code）在 light 与 dark 主题下均无 axe 违规，且 muted 文字通过对比度。
 */

import { describe, test } from 'vitest';
import { Text, Heading, Paragraph, Link, Code } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

const themes = [{ theme: 'light' }, { theme: 'dark' }] as const;

describe('Typography — accessibility', () => {
  test.each(themes)('Text renders accessibly in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(<Text>Sample body text</Text>, { theme });
    await expectA11y(container);
  });

  test.each(themes)('muted Text passes contrast in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(<Text isMuted>Secondary helper text</Text>, {
      theme,
    });
    await expectA11y(container);
  });

  test.each(themes)('Heading hierarchy renders accessibly in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(
      <article>
        <Heading>Page title</Heading>
        <Paragraph>Lead paragraph describing this section.</Paragraph>
      </article>,
      { theme },
    );
    await expectA11y(container);
  });

  test.each(themes)('Link with discernible text passes a11y in $theme', async ({ theme }) => {
    const { container } = renderWithProviders(
      <Paragraph>
        Read the <Link href="https://example.com">project guide</Link>.
      </Paragraph>,
      { theme },
    );
    await expectA11y(container);
  });

  test.each(themes)('inline Code renders accessibly in $theme theme', async ({ theme }) => {
    const { container } = renderWithProviders(
      <Paragraph>
        Use <Code>useTheme()</Code> to consume design tokens.
      </Paragraph>,
      { theme },
    );
    await expectA11y(container);
  });
});
