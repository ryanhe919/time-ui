/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatMessageList 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatMessageList } from '../ChatMessageList';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessageList — a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <ChatMessageList maxHeight={300}>
        <ChatMessage role="user" name="Ryan">
          Hi
        </ChatMessage>
        <ChatMessage role="assistant" name="Claude">
          Hello!
        </ChatMessage>
        <ChatMessage role="system">Connected</ChatMessage>
      </ChatMessageList>,
      { theme },
    );
    await expectA11y(container);
  });
});
