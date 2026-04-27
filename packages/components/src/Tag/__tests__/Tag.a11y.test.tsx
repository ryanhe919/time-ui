/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Tag 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { Tag } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

describe('Tag a11y', () => {
  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(
      <Tag isClosable onClose={() => {}} aria-label="Remove tag">
        Tag
      </Tag>,
    );
    await expectA11y(container);
  });
});
