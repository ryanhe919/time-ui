/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatTypingIndicator 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatTypingIndicator } from '../ChatTypingIndicator';

describe('ChatTypingIndicator — a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <div>
        <ChatTypingIndicator />
        <ChatTypingIndicator size="sm" label="Thinking…" />
      </div>,
      { theme },
    );
    await expectA11y(container);
  });
});
