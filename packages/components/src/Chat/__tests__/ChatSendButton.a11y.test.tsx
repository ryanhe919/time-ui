/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatSendButton 模块的 a11y 行为（axe 0 violation + reduced-motion）。
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatSendButton } from '../ChatSendButton';

describe('ChatSendButton — a11y', () => {
  it.each([['light'], ['dark']] as const)('zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <div>
        <ChatSendButton />
        <ChatSendButton isDisabled />
        <ChatSendButton isStreaming onStop={() => {}} />
      </div>,
      { theme },
    );
    await expectA11y(container);
  });

  it('emits a prefers-reduced-motion override rule', () => {
    renderWithProviders(<ChatSendButton />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
