/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 验证 CodeEditor 模块的渲染、状态、工具条、ref 传递、语言与 AI 按钮行为。
 */

import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CodeEditor } from '@timeui/react/code-editor';
import { renderWithProviders } from '@timeui/react/test-utils';

/**
 * Toolbar tests assert against English labels.
 * Force locale to 'en' via ConfigProvider for label-asserting tests.
 */
function renderEditor(
  ui: Parameters<typeof renderWithProviders>[0],
  opts?: Parameters<typeof renderWithProviders>[1],
) {
  return renderWithProviders(ui, { ...opts, config: { locale: 'en', ...(opts?.config ?? {}) } });
}

// ─── 1. Rendering ─────────────────────────────────────────────────────────────

describe('CodeEditor — rendering', () => {
  it('renders without crashing with default props', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the outer wrapper with the provided aria-label', () => {
    const { container } = renderEditor(<CodeEditor aria-label="My editor" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('aria-label')).toBe('My editor');
  });

  it('renders data-size attribute matching the size prop', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" size="lg" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-size')).toBe('lg');
  });

  it('defaults to data-size="md"', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-size')).toBe('md');
  });

  it('renders data-variant attribute matching the variant prop', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" variant="flat" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-variant')).toBe('flat');
  });

  it('defaults to data-variant="bordered"', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-variant')).toBe('bordered');
  });

  it('renders data-disabled attribute when isDisabled=true', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" isDisabled />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('data-disabled')).toBe(true);
  });

  it('does NOT render data-disabled when isDisabled is false', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" isDisabled={false} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('data-disabled')).toBe(false);
  });

  it('renders data-readonly attribute when isReadOnly=true', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" isReadOnly />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('data-readonly')).toBe(true);
  });

  it('renders data-invalid attribute when isInvalid=true', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" isInvalid />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('data-invalid')).toBe(true);
  });

  it('does NOT render data-fullscreen by default', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('data-fullscreen')).toBe(false);
  });

  it('renders data-fullscreen when fullscreen is toggled via toolbar button', async () => {
    const user = userEvent.setup();
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" />);
    const fullscreenBtn = screen.getByRole('button', { name: 'Fullscreen' });
    await user.click(fullscreenBtn);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-fullscreen')).toBe('true');
  });

  it('mounts the code-editor-mount container inside the wrapper', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" />);
    const mountSlot = container.querySelector('[data-slot="code-editor-mount"]');
    expect(mountSlot).not.toBeNull();
  });
});

// ─── 2. Controlled value / editor mount ───────────────────────────────────────

describe('CodeEditor — controlled value', () => {
  it('mounts the editor container (data-slot="code-editor-mount")', () => {
    const { container } = renderEditor(
      <CodeEditor aria-label="Test editor" defaultValue="const x = 1;" />,
    );
    const mount = container.querySelector('[data-slot="code-editor-mount"]');
    expect(mount).not.toBeNull();
  });

  it('accepts a value prop without error', () => {
    expect(() =>
      renderEditor(<CodeEditor aria-label="Test editor" value="const y = 2;" onChange={vi.fn()} />),
    ).not.toThrow();
  });

  it('accepts a defaultValue prop without error', () => {
    expect(() =>
      renderEditor(<CodeEditor aria-label="Test editor" defaultValue="const z = 3;" />),
    ).not.toThrow();
  });
});

// ─── 3. Toolbar ───────────────────────────────────────────────────────────────

describe('CodeEditor — toolbar', () => {
  it('renders the toolbar by default (no toolbar prop)', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('renders the toolbar when toolbar={true}', () => {
    renderEditor(<CodeEditor aria-label="Test editor" toolbar={true} />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('does NOT render the toolbar when toolbar={false}', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" toolbar={false} />);
    expect(container.querySelector('[role="toolbar"]')).toBeNull();
  });

  it('renders the toolbar with a ToolbarConfig object', () => {
    renderEditor(<CodeEditor aria-label="Test editor" toolbar={{ showCopy: true }} />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('toolbar has an accessible label', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar.getAttribute('aria-label')).toBeTruthy();
  });

  it('toolbar contains a Copy button', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('toolbar contains a line wrap toggle button', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    expect(screen.getByRole('button', { name: 'Toggle line wrap' })).toBeInTheDocument();
  });

  it('toolbar contains a line numbers toggle button', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    expect(screen.getByRole('button', { name: 'Toggle line numbers' })).toBeInTheDocument();
  });

  it('toolbar contains a Fullscreen button', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    expect(screen.getByRole('button', { name: 'Fullscreen' })).toBeInTheDocument();
  });

  it('toolbar hides Copy button when showCopy=false', () => {
    renderEditor(<CodeEditor aria-label="Test editor" toolbar={{ showCopy: false }} />);
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
  });

  it('toolbar hides Fullscreen button when showFullscreen=false', () => {
    renderEditor(<CodeEditor aria-label="Test editor" toolbar={{ showFullscreen: false }} />);
    expect(screen.queryByRole('button', { name: 'Fullscreen' })).toBeNull();
  });
});

// ─── 4. Language select ───────────────────────────────────────────────────────

describe('CodeEditor — language select', () => {
  it('renders the language select dropdown', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toBeInTheDocument();
  });

  it('language select has all 6 language options', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    const select = screen.getByRole('combobox', { name: 'Language' });
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('javascript');
    expect(options).toContain('typescript');
    expect(options).toContain('python');
    expect(options).toContain('css');
    expect(options).toContain('html');
    expect(options).toContain('json');
    expect(options).toHaveLength(6);
  });

  it('language select shows JavaScript as default selected option', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    const select = screen.getByRole('combobox', { name: 'Language' }) as HTMLSelectElement;
    expect(select.value).toBe('javascript');
  });

  it('language select reflects the language prop', () => {
    renderEditor(<CodeEditor aria-label="Test editor" language="python" />);
    const select = screen.getByRole('combobox', { name: 'Language' }) as HTMLSelectElement;
    expect(select.value).toBe('python');
  });

  it('language options display correct labels', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    const select = screen.getByRole('combobox', { name: 'Language' });
    const labels = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toContain('JavaScript');
    expect(labels).toContain('TypeScript');
    expect(labels).toContain('Python');
    expect(labels).toContain('CSS');
    expect(labels).toContain('HTML');
    expect(labels).toContain('JSON');
  });

  it('language select is hidden when showLanguageSelect=false', () => {
    renderEditor(<CodeEditor aria-label="Test editor" toolbar={{ showLanguageSelect: false }} />);
    expect(screen.queryByRole('combobox', { name: 'Language' })).toBeNull();
  });

  it('changing language select fires an update (select value changes)', async () => {
    const user = userEvent.setup();
    renderEditor(<CodeEditor aria-label="Test editor" language="javascript" />);
    const select = screen.getByRole('combobox', { name: 'Language' }) as HTMLSelectElement;
    await user.selectOptions(select, 'typescript');
    expect(select.value).toBe('typescript');
  });
});

// ─── 5. forwardRef ────────────────────────────────────────────────────────────

describe('CodeEditor — forwardRef', () => {
  it('forwards ref to the outer HTMLDivElement', () => {
    const ref = createRef<HTMLDivElement>();
    renderEditor(<CodeEditor aria-label="Test editor" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('ref.current has the expected data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    renderEditor(<CodeEditor aria-label="Test editor" ref={ref} size="sm" variant="faded" />);
    expect(ref.current?.getAttribute('data-size')).toBe('sm');
    expect(ref.current?.getAttribute('data-variant')).toBe('faded');
  });
});

// ─── 6. Languages ─────────────────────────────────────────────────────────────

describe('CodeEditor — language prop', () => {
  it.each(['javascript', 'typescript', 'python', 'css', 'html', 'json'] as const)(
    'accepts language="%s" without error',
    (lang) => {
      expect(() =>
        renderEditor(<CodeEditor aria-label="Test editor" language={lang} />),
      ).not.toThrow();
    },
  );
});

// ─── 7. AI suggestion button ──────────────────────────────────────────────────

describe('CodeEditor — AI suggestion button', () => {
  it('does NOT render AI button when onAISuggest is not provided', () => {
    renderEditor(<CodeEditor aria-label="Test editor" />);
    expect(screen.queryByRole('button', { name: 'AI suggestions' })).toBeNull();
  });

  it('renders AI button when onAISuggest prop is provided', () => {
    const onAISuggest = vi.fn().mockResolvedValue([]);
    renderEditor(<CodeEditor aria-label="Test editor" onAISuggest={onAISuggest} />);
    expect(screen.getByRole('button', { name: 'AI suggestions' })).toBeInTheDocument();
  });

  it('AI button is hidden when onAISuggest is not provided (hasAI=false)', () => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" toolbar={true} />);
    // SparklesIcon button should not be present
    const aiBtn = container.querySelector('[aria-label="AI suggestions"]');
    expect(aiBtn).toBeNull();
  });
});

// ─── 8. Size and variant combinations ─────────────────────────────────────────

describe('CodeEditor — size combinations', () => {
  it.each(['sm', 'md', 'lg'] as const)('renders size="%s" without error', (size) => {
    const { container } = renderEditor(<CodeEditor aria-label="Test editor" size={size} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-size')).toBe(size);
  });
});

describe('CodeEditor — variant combinations', () => {
  it.each(['flat', 'bordered', 'faded'] as const)(
    'renders variant="%s" without error',
    (variant) => {
      const { container } = renderEditor(<CodeEditor aria-label="Test editor" variant={variant} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.getAttribute('data-variant')).toBe(variant);
    },
  );
});

// ─── 9. ARIA props forwarding ─────────────────────────────────────────────────

describe('CodeEditor — ARIA props forwarding', () => {
  it('forwards aria-labelledby to the wrapper div', () => {
    const { container } = renderEditor(<CodeEditor aria-labelledby="label-id" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('aria-labelledby')).toBe('label-id');
  });

  it('forwards aria-describedby to the wrapper div', () => {
    const { container } = renderEditor(
      <CodeEditor aria-label="Test editor" aria-describedby="desc-id" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('aria-describedby')).toBe('desc-id');
  });
});

// ─── 10. Copy button interaction ──────────────────────────────────────────────

describe('CodeEditor — copy button interaction', () => {
  it('copy button shows "Copied!" label after click when clipboard is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // jsdom's navigator.clipboard is undefined; define it before rendering
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText },
    });

    const user = userEvent.setup();
    renderEditor(<CodeEditor aria-label="Test editor" defaultValue="hello" />);
    const copyBtn = screen.getByRole('button', { name: 'Copy' });

    await user.click(copyBtn);

    // After a successful copy, the toolbar shows "Copied!" button label
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });
});
