/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Search 模块的可访问性行为。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Search } from './Search';

describe('Search (a11y)', () => {
  it('is accessible (default)', async () => {
    const { container } = renderWithProviders(<Search />);
    await expectA11y(container);
  });

  it('is accessible with shortcut hint', async () => {
    const { container } = renderWithProviders(<Search placeholder="Search docs" shortcut="⌘K" />);
    await expectA11y(container);
  });
});
