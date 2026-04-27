/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Pagination 组件的可访问性（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Pagination } from '../';

describe('Pagination — accessibility', () => {
  it('passes axe with default config', async () => {
    const { container } = renderWithProviders(<Pagination total={50} defaultPage={2} />);
    await expectA11y(container);
  });

  it('passes axe with all add-ons enabled', async () => {
    const { container } = renderWithProviders(
      <Pagination
        total={500}
        defaultPage={3}
        showQuickJumper
        showSizeChanger
        aria-label="Posts pagination"
      />,
    );
    await expectA11y(container);
  });

  it('passes axe in simple variant', async () => {
    const { container } = renderWithProviders(
      <Pagination total={100} defaultPage={3} variant="simple" />,
    );
    await expectA11y(container);
  });
});
