/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Avatar / AvatarGroup 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { Avatar, AvatarGroup } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

describe('Avatar a11y', () => {
  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(<Avatar src="/a.png" alt="A friendly avatar" />);
    await expectA11y(container);
  });
});

describe('AvatarGroup a11y', () => {
  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(
      <AvatarGroup max={2}>
        <Avatar alt="a" name="Alice" />
        <Avatar alt="b" name="Bob" />
        <Avatar alt="c" name="Carol" />
      </AvatarGroup>,
    );
    await expectA11y(container);
  });
});
