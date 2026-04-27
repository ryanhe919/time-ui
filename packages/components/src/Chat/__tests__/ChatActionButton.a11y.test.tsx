/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatActionButton 模块的 a11y 行为（axe 0 violation + reduced-motion）。
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatActionButton } from '../ChatActionButton';

const Icon = () => (
  <svg viewBox="0 0 16 16" data-testid="icon">
    <path d="M0 0h16v16H0z" />
  </svg>
);

describe('ChatActionButton — a11y', () => {
  it.each([['light'], ['dark']] as const)('zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <div>
        <ChatActionButton aria-label="attach">
          <Icon />
        </ChatActionButton>
        <ChatActionButton aria-label="record" isActive>
          <Icon />
        </ChatActionButton>
        <ChatActionButton aria-label="off" isDisabled>
          <Icon />
        </ChatActionButton>
      </div>,
      { theme },
    );
    await expectA11y(container);
  });

  it('emits a prefers-reduced-motion override rule', () => {
    renderWithProviders(
      <ChatActionButton aria-label="x">
        <Icon />
      </ChatActionButton>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
