/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatComposer 模块的 a11y 行为（axe 0 violation + reduced-motion）。
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatComposer } from '../ChatComposer';

describe('ChatComposer — a11y', () => {
  it.each([['light'], ['dark']] as const)('zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <ChatComposer
        aria-label="Ask the assistant"
        defaultValue="hello"
        startContent={<button aria-label="attach">+</button>}
        endContent={<button aria-label="send">→</button>}
      />,
      { theme },
    );
    await expectA11y(container);
  });

  it('emits a prefers-reduced-motion override rule', () => {
    renderWithProviders(<ChatComposer aria-label="x" />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
