/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatAvatar 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatAvatar } from '../ChatAvatar';

describe('ChatAvatar — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (mixed roles)',
    async (theme) => {
      const { container } = renderWithProviders(
        <div>
          <ChatAvatar source={{ kind: 'text', text: 'RH' }} role="user" aria-label="Ryan" />
          <ChatAvatar source={{ kind: 'text', text: 'CL' }} role="assistant" aria-label="Claude" />
          <ChatAvatar source={{ kind: 'image', src: '/x.png' }} aria-label="image" />
          <ChatAvatar source={{ kind: 'text', text: 'SY' }} role="system" aria-label="system" />
          <ChatAvatar source={{ kind: 'text', text: 'TL' }} role="tool" aria-label="tool" />
          <ChatAvatar source={{ kind: 'text', text: 'KB' }} role="knowledge" aria-label="kb" />
        </div>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
