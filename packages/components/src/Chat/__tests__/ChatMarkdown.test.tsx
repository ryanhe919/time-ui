/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 ChatMarkdown 模块的流式渲染、链接处理、组件覆盖与可访问性。
 */

import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, within, fireEvent, act } from '@testing-library/react';
import type { Components } from 'react-markdown';
import { renderWithProviders } from '../../test-utils';
// Subpath import `@timeui/react/chat-markdown` points at the built dist which
// may be stale in a fresh checkout; sibling Chat tests also use relative import.
// Relative import matches the neighbouring-test style and avoids needing a prior build.
import { ChatMarkdown } from '../ChatMarkdown';

describe('ChatMarkdown — inline & block rendering', () => {
  it('renders bold emphasis inside a paragraph', () => {
    renderWithProviders(<ChatMarkdown>{'hello **world**'}</ChatMarkdown>);
    const strong = screen.getByText('world');
    expect(strong.tagName).toBe('STRONG');
  });

  it('renders inline code as a <code> element', () => {
    const { container } = renderWithProviders(<ChatMarkdown>{'这是 `code` 片段'}</ChatMarkdown>);
    const codes = container.querySelectorAll('code');
    expect(codes.length).toBeGreaterThanOrEqual(1);
    const inline = Array.from(codes).find((el) => el.textContent === 'code');
    expect(inline).toBeDefined();
    // Inline code should NOT be inside a <pre>
    expect(inline?.closest('pre')).toBeNull();
  });

  it('renders a fenced code block inside <pre><code> with its source text', () => {
    const src = '```ts\nconst x = 1;\n```';
    const { container } = renderWithProviders(<ChatMarkdown>{src}</ChatMarkdown>);
    // shiki 的异步高亮未必已完成，但同步渲染路径必定有 <pre>/<code>
    // （fallback 分支渲染 `<pre><code>原始文本</code></pre>`；shiki 完成后
    // 替换为 `<pre class="shiki">...</pre>`，也仍然是 <pre>/<code>）。
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    const codeInPre = pre?.querySelector('code');
    expect(codeInPre).not.toBeNull();
    expect(pre?.textContent).toContain('const x = 1;');
  });

  it('renders a fenced code block without a language as plain <pre><code>', () => {
    const src = '```\njust text\n```';
    const { container } = renderWithProviders(<ChatMarkdown>{src}</ChatMarkdown>);
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain('just text');
    // 无语言 → 不会启动 shiki 高亮，仍应有内部 <code>
    expect(pre?.querySelector('code')).not.toBeNull();
  });

  it('renders a copy button for fenced code blocks and not for inline code', () => {
    const { container: fencedContainer } = renderWithProviders(
      <ChatMarkdown>{'```ts\nconst x = 1;\n```'}</ChatMarkdown>,
    );
    const copyBtn = fencedContainer.querySelector('button[data-timeui-copy-btn]');
    expect(copyBtn).not.toBeNull();
    expect(copyBtn?.getAttribute('aria-label')).toBeTruthy();

    const { container: inlineContainer } = renderWithProviders(
      <ChatMarkdown>{'inline `x` here'}</ChatMarkdown>,
    );
    expect(inlineContainer.querySelector('button[data-timeui-copy-btn]')).toBeNull();
    // inline <code> 仍然存在，且未被包在 <pre> 内
    const inlineCode = inlineContainer.querySelector('code');
    expect(inlineCode).not.toBeNull();
    expect(inlineCode?.closest('pre')).toBeNull();
  });

  it('copies the raw source to clipboard when the copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // jsdom doesn't implement navigator.clipboard — define it on the prototype.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { container } = renderWithProviders(
      <ChatMarkdown>{'```ts\nconst x = 1;\n```'}</ChatMarkdown>,
    );
    const btn = container.querySelector('button[data-timeui-copy-btn]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('const x = 1;');
  });

  it('renders an unordered list with three items', () => {
    const { container } = renderWithProviders(<ChatMarkdown>{'- a\n- b\n- c'}</ChatMarkdown>);
    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();
    const items = ul ? within(ul).getAllByRole('listitem') : [];
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.textContent)).toEqual(['a', 'b', 'c']);
  });

  it('renders an ordered list with two items', () => {
    const { container } = renderWithProviders(<ChatMarkdown>{'1. a\n2. b'}</ChatMarkdown>);
    const ol = container.querySelector('ol');
    expect(ol).not.toBeNull();
    const items = ol ? within(ol).getAllByRole('listitem') : [];
    expect(items).toHaveLength(2);
  });

  it('renders heading levels h1/h2/h3', () => {
    renderWithProviders(<ChatMarkdown>{'# h1\n\n## h2\n\n### h3'}</ChatMarkdown>);
    expect(screen.getByRole('heading', { level: 1, name: 'h1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'h2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'h3' })).toBeInTheDocument();
  });

  it('renders blockquotes', () => {
    const { container } = renderWithProviders(<ChatMarkdown>{'> hello'}</ChatMarkdown>);
    const blockquote = container.querySelector('blockquote');
    expect(blockquote).not.toBeNull();
    expect(blockquote?.textContent).toContain('hello');
  });

  it('renders a horizontal rule', () => {
    const { container } = renderWithProviders(<ChatMarkdown>{'a\n\n---\n\nb'}</ChatMarkdown>);
    expect(container.querySelector('hr')).not.toBeNull();
  });

  it('renders GFM tables with header and body rows', () => {
    const src = '| a | b |\n|---|---|\n| 1 | 2 |';
    const { container } = renderWithProviders(<ChatMarkdown>{src}</ChatMarkdown>);
    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    const headerCells = table?.querySelectorAll('th') ?? [];
    expect(headerCells).toHaveLength(2);
    const bodyCells = table?.querySelectorAll('tbody td') ?? [];
    expect(bodyCells).toHaveLength(2);
    expect(bodyCells[0]?.textContent).toBe('1');
    expect(bodyCells[1]?.textContent).toBe('2');
  });
});

describe('ChatMarkdown — links', () => {
  it('marks http(s) links as external with target=_blank and safe rel', () => {
    renderWithProviders(<ChatMarkdown>{'[docs](https://example.com)'}</ChatMarkdown>);
    const link = screen.getByRole('link', { name: 'docs' });
    expect(link.getAttribute('target')).toBe('_blank');
    const rel = link.getAttribute('rel') ?? '';
    expect(rel).toContain('noreferrer');
    expect(rel).toContain('noopener');
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('leaves relative / internal links without a target attribute', () => {
    renderWithProviders(<ChatMarkdown>{'[about](/about)'}</ChatMarkdown>);
    const link = screen.getByRole('link', { name: 'about' });
    expect(link.hasAttribute('target')).toBe(false);
    // Either absent or falsy — react-markdown won't populate rel for internal
    expect(link.getAttribute('rel')).toBeNull();
  });
});

describe('ChatMarkdown — streaming / degraded input', () => {
  it('does not throw when the fenced code block is unterminated', () => {
    // Streaming mid-state: ``` opened but not yet closed.
    expect(() =>
      renderWithProviders(<ChatMarkdown>{'```ts\nconst x = 1'}</ChatMarkdown>),
    ).not.toThrow();
  });

  it('does not throw when children is an empty string', () => {
    expect(() => renderWithProviders(<ChatMarkdown>{''}</ChatMarkdown>)).not.toThrow();
  });
});

describe('ChatMarkdown — props, ref & pass-through', () => {
  it('forwards ref to the root div element', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithProviders(<ChatMarkdown ref={ref}>hi</ChatMarkdown>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('applies className and style on the root element', () => {
    const { container } = renderWithProviders(
      <ChatMarkdown className="extra" style={{ marginTop: 8 }}>
        hi
      </ChatMarkdown>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('extra')).toBe(true);
    expect(root.style.marginTop).toBe('8px');
  });

  it('respects caller-provided `components` overrides over defaults', () => {
    const components: Components = {
      h1: ({ children, ...rest }) => (
        <div data-testid="custom-h1" {...rest}>
          {children}
        </div>
      ),
    };
    renderWithProviders(<ChatMarkdown components={components}>{'# title'}</ChatMarkdown>);
    const custom = screen.getByTestId('custom-h1');
    expect(custom.tagName).toBe('DIV');
    expect(custom.textContent).toBe('title');
    // And the default heading role is NOT produced
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });
});
