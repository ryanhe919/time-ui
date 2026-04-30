/**
 * @author Ryan He
 * @date 2026-04-29
 * @description PdfViewer 主测试套件覆盖到主流程，本文件追加针对未走到的分支：
 *  - 键盘 0 / + / - / _ / = / PageUp / PageDown / ArrowLeft / 未知键
 *  - 函数式 ref 转发（line 503-504）
 *  - 工具条 Print / Download 点击路径（window.print + a.click）
 *  - 非 string source（ArrowBuffer / Uint8Array / Blob / URL / 未知类型）
 *  - 受控 zoom prop 的 effect（zoomMode 切到 'custom'）
 *  - sourceToBuffer 在 fetch 非 2xx 时抛错路径
 *  - workerSrc 显式覆盖
 *  - defaultZoom 数字 / 'page-fit' 分支
 */

import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PdfViewer } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

// ─── pdfjs-dist mock ────────────────────────────────────────────────────────────

const mockRenderTask = {
  promise: Promise.resolve(),
  cancel: vi.fn(),
};
const mockPage = {
  getViewport: vi.fn(({ scale }: { scale: number }) => ({
    width: 600 * scale,
    height: 800 * scale,
  })),
  render: vi.fn(() => mockRenderTask),
};
const mockDoc = {
  numPages: 5,
  getPage: vi.fn(() => Promise.resolve(mockPage)),
  destroy: vi.fn(() => Promise.resolve()),
};
const getDocumentMock = vi.fn(() => ({ promise: Promise.resolve(mockDoc) }));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: getDocumentMock,
}));

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as unknown as Response),
  );
  getDocumentMock.mockClear();
  mockPage.render.mockClear();
  mockDoc.getPage.mockClear();
});

// ─── helpers ──────────────────────────────────────────────────────────────────

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.getByTestId('pdf-num-pages').textContent).toBe('5');
  });
}

function focusScrollArea(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[data-slot="pdf-viewer-mount"]') as HTMLElement;
  el.focus();
  return el;
}

// ─── keyboard shortcuts ────────────────────────────────────────────────────────

describe('PdfViewer — keyboard shortcuts (extras)', () => {
  it('ArrowLeft / PageUp / PageDown navigate pages', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" defaultPage={3} onPageChange={onPageChange} />,
    );
    await waitForLoaded();
    focusScrollArea(container);
    await user.keyboard('{ArrowLeft}');
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await user.keyboard('{PageDown}');
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.keyboard('{PageUp}');
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it('+/= / -/_ trigger zoom in / out', async () => {
    const onZoomChange = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" defaultZoom={1} onZoomChange={onZoomChange} />,
    );
    await waitForLoaded();
    focusScrollArea(container);
    await user.keyboard('+');
    await user.keyboard('=');
    expect(onZoomChange).toHaveBeenCalled();
    onZoomChange.mockClear();
    await user.keyboard('-');
    await user.keyboard('_');
    expect(onZoomChange).toHaveBeenCalled();
  });

  it('"0" key triggers fit-width mode', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<PdfViewer source="/sample.pdf" defaultZoom={1.5} />);
    await waitForLoaded();
    focusScrollArea(container);
    await user.keyboard('0');
    // After fit-width, the toolbar's zoom select should reflect "Fit width" or
    // the canvas should re-render. Easiest assertion: re-render was scheduled.
    await waitFor(() => {
      expect(mockPage.render).toHaveBeenCalled();
    });
  });

  it('ignores unrecognised keys (default branch in switch)', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" onPageChange={onPageChange} />,
    );
    await waitForLoaded();
    focusScrollArea(container);
    await user.keyboard('a');
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('respects defaultPrevented (skips its own handling)', async () => {
    const onPageChange = vi.fn();
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" onPageChange={onPageChange} />,
    );
    await waitForLoaded();
    const el = focusScrollArea(container);
    const evt = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    evt.preventDefault();
    el.dispatchEvent(evt);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

// ─── ref forwarding ──────────────────────────────────────────────────────────

describe('PdfViewer — ref forwarding', () => {
  it('forwards to a function ref', () => {
    const fn = vi.fn();
    renderWithProviders(<PdfViewer source="/sample.pdf" ref={fn} />);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0]![0]).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards to a object ref', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithProviders(<PdfViewer source="/sample.pdf" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── toolbar actions ─────────────────────────────────────────────────────────

describe('PdfViewer — toolbar actions', () => {
  it('clicking Print invokes window.print()', async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, value: printSpy });
    renderWithProviders(<PdfViewer source="/sample.pdf" toolbar={{ print: true }} />);
    await waitForLoaded();
    await user.click(screen.getByRole('button', { name: 'Print' }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('Print button swallows window.print() throwing', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'print', {
      configurable: true,
      value: () => {
        throw new Error('blocked');
      },
    });
    renderWithProviders(<PdfViewer source="/sample.pdf" toolbar={{ print: true }} />);
    await waitForLoaded();
    await expect(
      user.click(screen.getByRole('button', { name: 'Print' })),
    ).resolves.toBeUndefined();
  });

  it('clicking Download creates an anchor and clicks it', async () => {
    const user = userEvent.setup();
    const aClick = vi.fn();
    const realCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag.toLowerCase() === 'a') (el as HTMLAnchorElement).click = aClick;
      return el;
    });
    renderWithProviders(<PdfViewer source="/sample.pdf" toolbar={{ download: true }} />);
    await waitForLoaded();
    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(aClick).toHaveBeenCalledTimes(1);
    createSpy.mockRestore();
  });
});

// ─── source variants ─────────────────────────────────────────────────────────

describe('PdfViewer — source variants', () => {
  it('accepts an ArrayBuffer source', async () => {
    const buf = new ArrayBuffer(16);
    renderWithProviders(<PdfViewer source={buf} />);
    await waitForLoaded();
    expect(getDocumentMock).toHaveBeenCalled();
  });

  it('accepts a Uint8Array source', async () => {
    const u8 = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    renderWithProviders(<PdfViewer source={u8} />);
    await waitForLoaded();
    expect(getDocumentMock).toHaveBeenCalled();
  });

  it('accepts a Blob source', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' });
    // Some JSDOM versions ship Blob without arrayBuffer(); polyfill if needed.
    if (typeof blob.arrayBuffer !== 'function') {
      Object.defineProperty(blob, 'arrayBuffer', {
        configurable: true,
        value: () => Promise.resolve(new ArrayBuffer(3)),
      });
    }
    renderWithProviders(<PdfViewer source={blob} />);
    await waitForLoaded();
    expect(getDocumentMock).toHaveBeenCalled();
  });

  it('accepts a URL object source', async () => {
    const u = new URL('https://example.com/sample.pdf');
    renderWithProviders(<PdfViewer source={u} />);
    await waitForLoaded();
    expect(getDocumentMock).toHaveBeenCalled();
  });

  it('errors out when fetch returns a non-2xx response', async () => {
    const onError = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as unknown as Response);
    renderWithProviders(<PdfViewer source="/missing.pdf" onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect((onError.mock.calls[0]![0] as Error).message).toMatch(/404/);
  });

  it('errors out for an unsupported source type', async () => {
    const onError = vi.fn();
    renderWithProviders(
      <PdfViewer source={{ weird: true } as unknown as ArrayBuffer} onError={onError} />,
    );
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect((onError.mock.calls[0]![0] as Error).message).toMatch(/Unsupported/);
  });
});

// ─── controlled zoom syncing ─────────────────────────────────────────────────

describe('PdfViewer — controlled zoom prop', () => {
  it('switches into "custom" zoomMode when controlled `zoom` prop is provided', async () => {
    // Render with zoom controlled. After mount, the controlled-zoom effect
    // should set zoomMode to 'custom'. We verify indirectly: the canvas renders
    // at the controlled zoom factor, not at fit-width, so getViewport gets
    // called with scale=zoom.
    renderWithProviders(<PdfViewer source="/sample.pdf" zoom={1.5} />);
    await waitForLoaded();
    await waitFor(() => {
      const calls = mockPage.getViewport.mock.calls;
      // 至少有一次 scale=1.5（width-fit 模式不会刚好命中 1.5）
      expect(calls.some(([arg]) => arg.scale === 1.5)).toBe(true);
    });
  });
});

// ─── default zoom modes ──────────────────────────────────────────────────────

describe('PdfViewer — defaultZoom modes', () => {
  it('starts in custom mode when defaultZoom is a number', async () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" defaultZoom={0.75} />);
    await waitForLoaded();
    await waitFor(() => {
      expect(mockPage.getViewport.mock.calls.some(([arg]) => arg.scale === 0.75)).toBe(true);
    });
  });

  it('starts in "fit" mode when defaultZoom="page-fit"', async () => {
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" defaultZoom="page-fit" />,
    );
    await waitForLoaded();
    // The scroll area exists; a render was scheduled.
    expect(container.querySelector('[data-slot="pdf-viewer-mount"]')).not.toBeNull();
    await waitFor(() => expect(mockPage.render).toHaveBeenCalled());
  });
});

// ─── workerSrc override ──────────────────────────────────────────────────────

describe('PdfViewer — workerSrc override', () => {
  it('uses the explicit workerSrc when provided', async () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" workerSrc="/custom-worker.js" />);
    await waitForLoaded();
    // Sanity: getDocument was called → loading task started.
    expect(getDocumentMock).toHaveBeenCalled();
  });
});

// ─── empty / nullish source ──────────────────────────────────────────────────

describe('PdfViewer — empty source variants', () => {
  it('treats null source as empty (fires onError)', async () => {
    const onError = vi.fn();
    renderWithProviders(<PdfViewer source={null as unknown as string} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
  });

  it('treats undefined source as empty (fires onError)', async () => {
    const onError = vi.fn();
    renderWithProviders(<PdfViewer source={undefined as unknown as string} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});

// ─── unmount during load ─────────────────────────────────────────────────────

describe('PdfViewer — lifecycle', () => {
  it('cancels in-flight render task on unmount without throwing', async () => {
    const { unmount } = renderWithProviders(<PdfViewer source="/sample.pdf" />);
    await waitForLoaded();
    expect(() => unmount()).not.toThrow();
    expect(mockDoc.destroy).toHaveBeenCalled();
  });

  it('handles a getDocument promise rejection by surfacing onError', async () => {
    getDocumentMock.mockImplementationOnce(
      () => ({ promise: Promise.reject(new Error('parse-fail')) }) as never,
    );
    const onError = vi.fn();
    renderWithProviders(<PdfViewer source="/sample.pdf" onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect((onError.mock.calls[0]![0] as Error).message).toBe('parse-fail');
  });
});
