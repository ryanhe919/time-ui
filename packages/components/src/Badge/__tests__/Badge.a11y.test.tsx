/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Badge 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { Badge } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

describe('Badge a11y', () => {
  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(
      <Badge content={3} aria-label="3 unread items">
        <button type="button">Inbox</button>
      </Badge>,
    );
    await expectA11y(container);
  });
});
