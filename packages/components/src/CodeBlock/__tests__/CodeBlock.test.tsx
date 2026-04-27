/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 CodeBlock 模块的行为与回归。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeBlock } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

const sample = "const x = 'hi';";
const shikiMock = vi.hoisted(() => {
  return {
    getLoadedLanguages: vi.fn(() => ['tsx']),
    loadLanguage: vi.fn(),
    codeToHtml: vi.fn(),
    getSingletonHighlighter: vi.fn(),
  };
});

vi.mock('shiki', () => ({
  getSingletonHighlighter: shikiMock.getSingletonHighlighter,
}));

describe('CodeBlock', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    shikiMock.getLoadedLanguages.mockReset();
    shikiMock.getLoadedLanguages.mockReturnValue(['tsx']);
    shikiMock.loadLanguage.mockReset();
    shikiMock.codeToHtml.mockReset();
    shikiMock.getSingletonHighlighter.mockReset();
    shikiMock.getSingletonHighlighter.mockImplementation(async () => ({
      getLoadedLanguages: shikiMock.getLoadedLanguages,
      loadLanguage: shikiMock.loadLanguage,
      codeToHtml: shikiMock.codeToHtml,
    }));
    shikiMock.codeToHtml.mockReturnValue('<pre class="shiki"><code>default</code></pre>');
  });

  it('renders the code text', () => {
    renderWithProviders(<CodeBlock code={sample} />);
    expect(screen.getByText(sample)).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderWithProviders(<CodeBlock code={sample} title="example.ts" />);
    expect(screen.getByText('example.ts')).toBeInTheDocument();
  });

  it('shows localized Copy label (zh by default)', () => {
    renderWithProviders(<CodeBlock code={sample} />);
    expect(screen.getByRole('button', { name: '复制代码' })).toBeInTheDocument();
    expect(screen.getByText('复制')).toBeInTheDocument();
  });

  it('shows English labels when locale=en', () => {
    renderWithProviders(<CodeBlock code={sample} />, {
      config: { locale: 'en' },
    });
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('copies to clipboard and flips label transiently', async () => {
    const onCopy = vi.fn();
    renderWithProviders(<CodeBlock code={sample} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: '复制代码' }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(sample);
      expect(onCopy).toHaveBeenCalledWith(sample);
      expect(screen.getByText('已复制')).toBeInTheDocument();
    });
  });

  it('hides copy button when isCopyable=false', () => {
    renderWithProviders(<CodeBlock code={sample} isCopyable={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders highlighted html when shiki is available', async () => {
    shikiMock.codeToHtml.mockReturnValue('<pre class="shiki"><code>highlighted</code></pre>');
    renderWithProviders(<CodeBlock code={sample} language="tsx" />);
    await waitFor(() => {
      expect(screen.getByText('highlighted')).toBeInTheDocument();
      expect(shikiMock.codeToHtml).toHaveBeenCalled();
    });
  });

  it('falls back to plain text when highlighter throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    shikiMock.getSingletonHighlighter.mockRejectedValueOnce(new Error('boom'));
    renderWithProviders(<CodeBlock code={sample} language="tsx" />);
    await waitFor(() => {
      expect(screen.getByText(sample)).toBeInTheDocument();
      expect(warn).toHaveBeenCalled();
    });
  });

  it('loads the language on demand when it is not preloaded', async () => {
    shikiMock.getLoadedLanguages.mockReturnValueOnce([]);
    shikiMock.codeToHtml.mockReturnValue('<pre class="shiki"><code>loaded</code></pre>');
    renderWithProviders(<CodeBlock code={sample} language="ts" />);
    await waitFor(() => {
      expect(shikiMock.loadLanguage).toHaveBeenCalledWith('ts');
      expect(screen.getByText('loaded')).toBeInTheDocument();
    });
  });

  it('swallows clipboard errors without throwing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderWithProviders(<CodeBlock code={sample} />);
    await expect(
      userEvent.click(screen.getByRole('button', { name: '复制代码' })),
    ).resolves.toBeUndefined();
  });
});
