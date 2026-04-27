/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Textarea 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Textarea } from '../';

describe('Textarea — a11y', () => {
  it.each([['light'], ['dark']] as const)('passes axe in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <Textarea label="Bio" description="Tell us something" defaultValue="Hi." />,
      { theme },
    );
    await expectA11y(container);
  });
});
