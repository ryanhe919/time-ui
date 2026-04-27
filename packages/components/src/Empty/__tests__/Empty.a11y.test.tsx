/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Empty 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { Empty } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

describe('Empty a11y', () => {
  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(
      <Empty
        image="search"
        title="No matching results"
        description="Try a different search term."
        actions={<button type="button">Reset</button>}
      />,
    );
    await expectA11y(container);
  });
});
