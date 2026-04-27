/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatKnowledgeRefs 模块的 a11y 行为（axe 0 violation + reduced-motion）。
 */

import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatKnowledgeRefs } from '../ChatKnowledgeRefs';
import type { ChatKnowledgeReference } from '../Chat.types';

const SAMPLE: ReadonlyArray<ChatKnowledgeReference> = [
  { id: '1', title: 'React Docs', source: 'web', href: 'https://react.dev', snippet: 'Official' },
  { id: '2', title: 'Design Brief.pdf', source: 'pdf', snippet: 'Internal v2' },
  { id: '3', title: 'Notes 2026-04', source: 'note' },
];

describe('ChatKnowledgeRefs — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (links + buttons + spans)',
    async (theme) => {
      const onSelect = vi.fn();
      const { container } = renderWithProviders(
        <ChatKnowledgeRefs references={SAMPLE} onSelect={onSelect} />,
        { theme },
      );
      await expectA11y(container);
    },
  );

  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(<ChatKnowledgeRefs references={SAMPLE} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
