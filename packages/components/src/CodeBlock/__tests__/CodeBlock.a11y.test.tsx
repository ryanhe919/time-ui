/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 CodeBlock 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it, vi } from 'vitest';
import { CodeBlock } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

const shikiMock = vi.hoisted(() => ({
  getLoadedLanguages: vi.fn(() => ['tsx']),
  loadLanguage: vi.fn(),
  codeToHtml: vi.fn(() => '<pre class="shiki"><code>default</code></pre>'),
  getSingletonHighlighter: vi.fn(),
}));

vi.mock('shiki', () => ({
  getSingletonHighlighter: shikiMock.getSingletonHighlighter,
}));

describe('CodeBlock a11y', () => {
  it('passes axe with default props', async () => {
    const { container } = renderWithProviders(
      <CodeBlock code="const x = 1;" title="example.ts" noHighlight />,
    );
    await expectA11y(container);
  });

  it('passes axe without copy button', async () => {
    const { container } = renderWithProviders(
      <CodeBlock code="const x = 1;" copyable={false} noHighlight />,
    );
    await expectA11y(container);
  });
});
