/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 通过 mock `shiki` 走通 ChatMarkdown 的异步高亮分支：
 *  - 高亮成功（line 240：`<div dangerouslySetInnerHTML={{ __html }} />`）
 *  - 高亮失败（catch + dev warn）
 *  - 已加载语言 vs 需 loadLanguage 预加载
 *  - dark theme 分支
 *  - 复制按钮：clipboard 缺失 / writeText reject 静默路径
 *
 *  ChatMarkdown.test.tsx 已经覆盖 markdown 主体渲染，这里只补它没动到的支线。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, act, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { ChatMarkdown } from '../ChatMarkdown';

const shikiMock = vi.hoisted(() => ({
  getLoadedLanguages: vi.fn(() => ['ts']),
  loadLanguage: vi.fn(async () => {}),
  codeToHtml: vi.fn(),
  getSingletonHighlighter: vi.fn(),
}));

vi.mock('shiki', () => ({
  getSingletonHighlighter: shikiMock.getSingletonHighlighter,
}));

beforeEach(() => {
  shikiMock.getLoadedLanguages.mockReset();
  shikiMock.getLoadedLanguages.mockReturnValue(['ts']);
  shikiMock.loadLanguage.mockReset();
  shikiMock.loadLanguage.mockImplementation(async () => {});
  shikiMock.codeToHtml.mockReset();
  shikiMock.codeToHtml.mockReturnValue(
    '<pre class="shiki"><code><span style="color:#000">x</span></code></pre>',
  );
  shikiMock.getSingletonHighlighter.mockReset();
  shikiMock.getSingletonHighlighter.mockImplementation(async () => ({
    getLoadedLanguages: shikiMock.getLoadedLanguages,
    loadLanguage: shikiMock.loadLanguage,
    codeToHtml: shikiMock.codeToHtml,
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChatMarkdown — shiki async highlighting', () => {
  it('renders highlighted HTML once shiki returns', async () => {
    const { container } = renderWithProviders(
      <ChatMarkdown>{'```ts\nconst x = 1;\n```'}</ChatMarkdown>,
    );
    await waitFor(() => {
      expect(container.querySelector('pre.shiki')).not.toBeNull();
    });
    expect(shikiMock.getSingletonHighlighter).toHaveBeenCalledTimes(1);
    expect(shikiMock.codeToHtml).toHaveBeenCalledTimes(1);
  });

  it('shows newly streamed code immediately while its highlighting is pending', async () => {
    shikiMock.codeToHtml.mockReturnValue('<pre class="shiki"><code>old source</code></pre>');
    const { container, rerender } = renderWithProviders(
      <ChatMarkdown>{'```ts\nold source\n```'}</ChatMarkdown>,
    );
    await waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull());
    let complete: ((highlighter: unknown) => void) | undefined;
    shikiMock.getSingletonHighlighter.mockReturnValueOnce(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    rerender(<ChatMarkdown>{'```ts\nnew source\n```'}</ChatMarkdown>);
    expect(container.querySelector('pre')?.textContent).toBe('new source');
    expect(container.querySelector('pre.shiki')).toBeNull();
    await waitFor(() => expect(complete).toBeDefined());
    shikiMock.codeToHtml.mockReturnValue('<pre class="shiki"><code>new source</code></pre>');
    await act(async () => {
      complete?.(shikiMock);
    });
    expect(container.querySelector('pre.shiki')?.textContent).toBe('new source');
  });

  it('preloads a language that is not yet in getLoadedLanguages', async () => {
    shikiMock.getLoadedLanguages.mockReturnValue(['js']); // 'ts' missing
    const { container } = renderWithProviders(
      <ChatMarkdown>{'```ts\nconst y = 2;\n```'}</ChatMarkdown>,
    );
    await waitFor(() => {
      expect(shikiMock.loadLanguage).toHaveBeenCalledTimes(1);
    });
    expect(shikiMock.loadLanguage).toHaveBeenCalledWith('ts');
    await waitFor(() => {
      expect(container.querySelector('pre.shiki')).not.toBeNull();
    });
  });

  it('skips loadLanguage when language is already loaded', async () => {
    shikiMock.getLoadedLanguages.mockReturnValue(['ts']);
    renderWithProviders(<ChatMarkdown>{'```ts\nx\n```'}</ChatMarkdown>);
    await waitFor(() => {
      expect(shikiMock.codeToHtml).toHaveBeenCalled();
    });
    expect(shikiMock.loadLanguage).not.toHaveBeenCalled();
  });

  it('falls back to plain <pre><code> when shiki throws', async () => {
    shikiMock.getSingletonHighlighter.mockRejectedValue(new Error('shiki down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = renderWithProviders(
      <ChatMarkdown>{'```ts\nconst x = 1;\n```'}</ChatMarkdown>,
    );
    await waitFor(() => {
      expect(warn).toHaveBeenCalled();
    });
    // No shiki output, but our fallback <pre> still has the source
    expect(container.querySelector('pre.shiki')).toBeNull();
    expect(container.querySelector('pre')!.textContent).toContain('const x = 1;');
  });

  it('passes the active theme.mode to shiki defaultColor', async () => {
    renderWithProviders(<ChatMarkdown>{'```ts\nconst x = 1;\n```'}</ChatMarkdown>, {
      theme: 'dark',
    });
    await waitFor(() => {
      expect(shikiMock.codeToHtml).toHaveBeenCalled();
    });
    const opts = shikiMock.codeToHtml.mock.calls.at(-1)?.[1] as { defaultColor?: string };
    expect(opts?.defaultColor).toBe('dark');
  });
});

describe('ChatMarkdown — copy button degraded paths', () => {
  it('is a no-op when navigator.clipboard is undefined', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const { container } = renderWithProviders(
      <ChatMarkdown>{'```ts\nconst x = 1;\n```'}</ChatMarkdown>,
    );
    const btn = container.querySelector('button[data-timeui-copy-btn]') as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(btn);
    });
    // No "copied" state should ever flip on, since writeText was never reachable
    expect(btn.getAttribute('data-copied')).toBeNull();
  });

  it('swallows clipboard.writeText rejections without flipping the copied state', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const { container } = renderWithProviders(
      <ChatMarkdown>{'```ts\nconst x = 1;\n```'}</ChatMarkdown>,
    );
    const btn = container.querySelector('button[data-timeui-copy-btn]') as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(btn.getAttribute('data-copied')).toBeNull();
  });
});
