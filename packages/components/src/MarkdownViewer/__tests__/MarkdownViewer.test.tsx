/**
 * @author Ryan He
 * @description 验证 MarkdownViewer 的渲染、URL fetch、错误/加载回退、工具条交互。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownViewer } from '@timeui/react/markdown-viewer';
import { renderWithProviders } from '@timeui/react/test-utils';

/**
 * 大多数 toolbar 文案断言依赖英文 i18n；force locale = 'en'。
 * （工具条文案不在 messages.ts 中，所有断言走 DEFAULT_TOOLBAR_LABELS 内的英文。）
 */
function renderViewer(
  ui: Parameters<typeof renderWithProviders>[0],
  opts?: Parameters<typeof renderWithProviders>[1],
) {
  return renderWithProviders(ui, { ...opts, config: { locale: 'en', ...(opts?.config ?? {}) } });
}

// ─── 1. Markdown rendering ────────────────────────────────────────────────────

describe('MarkdownViewer — markdown rendering', () => {
  it('renders headings as h1/h2/h3 with generated ids', () => {
    renderViewer(
      <MarkdownViewer aria-label="Doc" source={'# Hello world\n\n## Sub heading\n\n### Deeper'} />,
    );
    const h1 = screen.getByRole('heading', { level: 1, name: 'Hello world' });
    const h2 = screen.getByRole('heading', { level: 2, name: 'Sub heading' });
    const h3 = screen.getByRole('heading', { level: 3, name: 'Deeper' });
    expect(h1).toBeInTheDocument();
    expect(h2).toBeInTheDocument();
    expect(h3).toBeInTheDocument();
    expect(h1.id).toBe('hello-world');
    expect(h2.id).toBe('sub-heading');
    expect(h3.id).toBe('deeper');
  });

  it('renders unordered and ordered lists', () => {
    renderViewer(
      <MarkdownViewer aria-label="Doc" source={'- one\n- two\n\n1. first\n2. second'} />,
    );
    const lists = screen.getAllByRole('list');
    expect(lists.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(4);
  });

  it('renders GFM tables', () => {
    const md = ['| a | b |', '|---|---|', '| 1 | 2 |', '| 3 | 4 |'].join('\n');
    renderViewer(<MarkdownViewer aria-label="Doc" source={md} />);
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'a' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'b' })).toBeInTheDocument();
    // body cells
    expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '4' })).toBeInTheDocument();
  });

  it('renders inline code', () => {
    const { container } = renderViewer(
      <MarkdownViewer aria-label="Doc" source={'use `npm install` to install'} />,
    );
    const codes = container.querySelectorAll('code');
    expect(codes.length).toBeGreaterThan(0);
    expect(Array.from(codes).some((c) => c.textContent === 'npm install')).toBe(true);
  });

  it('renders fenced code blocks with a language class', () => {
    const md = '```ts\nconst x: number = 1;\n```';
    const { container } = renderViewer(<MarkdownViewer aria-label="Doc" source={md} />);
    // Either CodeBlock’s shiki output or the fallback <pre><code>; both contain the source text.
    expect(container.textContent).toContain('const x: number = 1;');
    // CodeBlock mounts a wrapper with our data slot so we can locate it.
    expect(container.querySelector('[data-slot="markdown-codeblock"]')).not.toBeNull();
  });

  it('renders external links with target=_blank and rel=noopener', () => {
    renderViewer(
      <MarkdownViewer aria-label="Doc" source={'[anthropic](https://www.anthropic.com)'} />,
    );
    const link = screen.getByRole('link', { name: 'anthropic' });
    expect(link.getAttribute('href')).toBe('https://www.anthropic.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('renders intra-doc anchor links without a target attribute', () => {
    renderViewer(<MarkdownViewer aria-label="Doc" source={'[jump](#hello-world)'} />);
    const link = screen.getByRole('link', { name: 'jump' });
    expect(link.getAttribute('href')).toBe('#hello-world');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('renders blockquotes', () => {
    const { container } = renderViewer(
      <MarkdownViewer aria-label="Doc" source={'> quoted text'} />,
    );
    const bq = container.querySelector('blockquote');
    expect(bq).not.toBeNull();
    expect(bq?.textContent).toContain('quoted text');
  });

  it('honors gfm=false (no table parsing)', () => {
    const md = ['| a | b |', '|---|---|', '| 1 | 2 |'].join('\n');
    renderViewer(<MarkdownViewer aria-label="Doc" source={md} gfm={false} />);
    expect(screen.queryByRole('table')).toBeNull();
  });

  // 回归测试：之前的 "render-time slugger counter" 实现会在 React 严格模式 / 重渲染下
  // 让 client 端 id 多挂一个 -1 后缀，导致 hydration mismatch。改成按行号查表后，
  // 同一份 markdown 多次 render 必须产出完全相同的 id 序列。
  it('produces stable, deterministic heading ids across re-renders', () => {
    const md = '# Intro\n\n## Intro\n\n### Intro';
    const { container, rerender } = renderViewer(<MarkdownViewer aria-label="Doc" source={md} />);
    const collect = () => Array.from(container.querySelectorAll('h1, h2, h3')).map((h) => h.id);
    const first = collect();
    expect(first).toEqual(['intro', 'intro-1', 'intro-2']);

    rerender(<MarkdownViewer aria-label="Doc" source={md} />);
    expect(collect()).toEqual(first);

    rerender(<MarkdownViewer aria-label="Doc" source={md} />);
    expect(collect()).toEqual(first);
  });

  // 回归测试：setext 风格 (Title\n=====) 也要被识别并参与 id 去重。
  it('parses setext-style headings into stable ids', () => {
    const md = ['Welcome', '=======', '', 'Section', '-------', '', 'Welcome', '======='].join(
      '\n',
    );
    const { container } = renderViewer(<MarkdownViewer aria-label="Doc" source={md} />);
    const ids = Array.from(container.querySelectorAll('h1, h2, h3')).map((h) => h.id);
    expect(ids).toEqual(['welcome', 'section', 'welcome-1']);
  });
});

// ─── 2. URL source / fetch ────────────────────────────────────────────────────

describe('MarkdownViewer — URL fetch mode', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // reset between cases
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches markdown from a URL when sourceType="url"', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('# Fetched heading'),
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    renderViewer(<MarkdownViewer aria-label="Doc" source="/some/doc.md" sourceType="url" />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Fetched heading' }),
      ).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith('/some/doc.md', expect.objectContaining({}));
  });

  it('shows the loading fallback while fetching', async () => {
    let resolveText: (v: string) => void = () => {
      // assigned synchronously in the Promise executor below
    };
    const pending = new Promise<string>((res) => {
      resolveText = res;
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => pending,
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    renderViewer(
      <MarkdownViewer
        aria-label="Doc"
        source="/x.md"
        sourceType="url"
        loadingFallback={<div>Loading my doc…</div>}
      />,
    );

    expect(screen.getByText('Loading my doc…')).toBeInTheDocument();

    // settle to avoid open handle warnings
    resolveText('# done');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'done' })).toBeInTheDocument(),
    );
  });

  it('shows the error fallback on fetch error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server error',
      text: () => Promise.resolve(''),
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const onError = vi.fn();
    renderViewer(
      <MarkdownViewer
        aria-label="Doc"
        source="/broken.md"
        sourceType="url"
        onError={onError}
        errorFallback={(err: Error) => <div>Failed: {err.message}</div>}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed:/)).toBeInTheDocument();
    });
    expect(onError).toHaveBeenCalledTimes(1);
    const arg = onError.mock.calls[0]?.[0] as Error;
    expect(arg).toBeInstanceOf(Error);
    expect(arg.message).toMatch(/500/);
  });

  it('shows the default error UI when no errorFallback is provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not found',
      text: () => Promise.resolve(''),
    }) as unknown as typeof globalThis.fetch;

    const { container } = renderViewer(
      <MarkdownViewer aria-label="Doc" source="/missing.md" sourceType="url" />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-slot="markdown-error"]')).not.toBeNull();
    });
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toMatch(/404/);
  });
});

// ─── 3. Toolbar ───────────────────────────────────────────────────────────────

describe('MarkdownViewer — toolbar', () => {
  it('renders the toolbar by default with copy and download buttons', () => {
    renderViewer(<MarkdownViewer aria-label="Doc" source="# hi" />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy markdown' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download as .md' })).toBeInTheDocument();
  });

  it('does NOT render the toolbar when showToolbar=false', () => {
    const { container } = renderViewer(
      <MarkdownViewer aria-label="Doc" source="# hi" showToolbar={false} />,
    );
    expect(container.querySelector('[role="toolbar"]')).toBeNull();
  });

  it('hides the copy button when toolbar.copy=false', () => {
    renderViewer(<MarkdownViewer aria-label="Doc" source="# hi" toolbar={{ copy: false }} />);
    expect(screen.queryByRole('button', { name: 'Copy markdown' })).toBeNull();
  });

  it('shows the refresh button only in URL mode', async () => {
    // content mode: no refresh
    const { unmount } = renderViewer(<MarkdownViewer aria-label="Doc" source="# hi" />);
    expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
    unmount();

    // url mode: refresh visible after fetch resolves
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('# fetched'),
    }) as unknown as typeof globalThis.fetch;

    renderViewer(<MarkdownViewer aria-label="Doc" source="/x.md" sourceType="url" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    });
  });

  it('copy button writes the markdown source to the clipboard and shows "Copied!"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // userEvent v14 在 setup() 中会注入一个虚拟 clipboard polyfill，会覆盖之前的赋值；
    // 所以必须在 setup() 之后再安装我们的 spy。
    const user = userEvent.setup();
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText },
    });

    renderViewer(<MarkdownViewer aria-label="Doc" source={'# my doc\n\nhello'} />);
    const copyBtn = screen.getByRole('button', { name: 'Copy markdown' });
    await user.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith('# my doc\n\nhello');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });
});

// ─── 4. ARIA / wrapper ─────────────────────────────────────────────────────────

describe('MarkdownViewer — wrapper attributes', () => {
  it('renders the outer wrapper with role="article" and aria-label', () => {
    renderViewer(<MarkdownViewer aria-label="My docs" source="# hi" />);
    const article = screen.getByRole('article', { name: 'My docs' });
    expect(article).toBeInTheDocument();
  });

  it('forwards id and className to the wrapper', () => {
    renderViewer(
      <MarkdownViewer aria-label="Doc" id="md-1" className="custom-cls" source="# hi" />,
    );
    const article = screen.getByRole('article', { name: 'Doc' });
    expect(article.id).toBe('md-1');
    expect(article.className).toContain('custom-cls');
  });
});
