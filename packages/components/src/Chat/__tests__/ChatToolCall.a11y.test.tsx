/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatToolCall 模块的 a11y 行为（axe 0 violation + reduced-motion）。
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatToolCall } from '../ChatToolCall';

describe('ChatToolCall — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (expanded with all sections)',
    async (theme) => {
      const { container } = renderWithProviders(
        <ChatToolCall
          name="search_web"
          status="success"
          defaultExpanded
          arguments={{ query: 'tokens' }}
          result={{ items: 3 }}
        />,
        { theme },
      );
      await expectA11y(container);
    },
  );

  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(<ChatToolCall name="x" status="running" />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
