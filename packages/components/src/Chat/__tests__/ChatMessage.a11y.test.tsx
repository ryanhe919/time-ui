/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatMessage 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations across all roles in %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        <div>
          <ChatMessage role="user" name="Ryan" timestamp="10:00">
            Hello
          </ChatMessage>
          <ChatMessage role="assistant" name="Claude" timestamp="10:01" isStreaming>
            Hi there!
          </ChatMessage>
          <ChatMessage role="system">Connected</ChatMessage>
          <ChatMessage role="tool" name="search_web" attachments={<div>tool card</div>}>
            {null}
          </ChatMessage>
          <ChatMessage role="knowledge" name="Docs" attachments={<div>refs</div>}>
            {null}
          </ChatMessage>
        </div>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
