/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Switch 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Switch } from '../';

describe('Switch a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <Switch defaultSelected aria-label="notifications" />,
      { theme },
    );
    await expectA11y(container);
  });
});
