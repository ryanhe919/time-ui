/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 验证 PdfViewer 模块的渲染、加载/错误状态、工具条按钮、键盘交互。
 */

import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PdfViewer } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

// ─── pdfjs-dist mock ──────────────────────────────────────────────────────────
//
// Real pdfjs-dist requires a Web Worker, canvas rendering, and PostScript fonts —
// none of which work in jsdom. We replace it with a deterministic stub.

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
};
const destroyLoadingTask = vi.fn(() => Promise.resolve());

const getDocumentMock = vi.fn(() => ({
  promise: Promise.resolve(mockDoc),
  destroy: destroyLoadingTask,
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: getDocumentMock,
}));

// fetch stub so URL-string sources don't hit the network.
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
  destroyLoadingTask.mockClear();
});

// ─── 1. Rendering ─────────────────────────────────────────────────────────────

describe('PdfViewer — rendering', () => {
  it('renders a replacement document even when its page count is unchanged', async () => {
    const replacementPage = { ...mockPage, render: vi.fn(() => mockRenderTask) };
    const replacementDoc = {
      ...mockDoc,
      getPage: vi.fn(() => Promise.resolve(replacementPage)),
    };
    const destroyReplacementTask = vi.fn(() => Promise.resolve());
    const { rerender } = renderWithProviders(<PdfViewer source="/first.pdf" />);
    await waitFor(() => expect(mockPage.render).toHaveBeenCalled());
    getDocumentMock.mockReturnValueOnce({
      promise: Promise.resolve(replacementDoc),
      destroy: destroyReplacementTask,
    });
    rerender(<PdfViewer source="/second.pdf" />);
    await waitFor(() => expect(replacementPage.render).toHaveBeenCalled());
    expect(replacementDoc.getPage).toHaveBeenCalledWith(1);
    expect(destroyLoadingTask).toHaveBeenCalledOnce();
    expect(destroyReplacementTask).not.toHaveBeenCalled();
  });

  it('destroys a pending load on unmount before the document promise resolves', async () => {
    let resolveDocument: ((document: typeof mockDoc) => void) | undefined;
    const destroyPendingTask = vi.fn(() => Promise.resolve());
    getDocumentMock.mockReturnValueOnce({
      promise: new Promise((resolve) => {
        resolveDocument = resolve;
      }),
      destroy: destroyPendingTask,
    });
    const onLoad = vi.fn();
    const { unmount } = renderWithProviders(<PdfViewer source="/pending.pdf" onLoad={onLoad} />);
    await waitFor(() => expect(getDocumentMock).toHaveBeenCalled());
    unmount();
    expect(destroyPendingTask).toHaveBeenCalledOnce();
    await act(async () => resolveDocument?.(mockDoc));
    expect(onLoad).not.toHaveBeenCalled();
    expect(mockPage.render).not.toHaveBeenCalled();
    expect(destroyPendingTask).toHaveBeenCalledOnce();
  });

  it('renders a valid document after a previous source failed', async () => {
    const { rerender } = renderWithProviders(<PdfViewer source="" />);
    await screen.findByRole('alert');
    rerender(<PdfViewer source="/recovered.pdf" />);
    await waitFor(() => expect(mockPage.render).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clamps the visible page controls to the page actually rendered', async () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" defaultPage={12} />);
    await waitFor(() => expect(mockDoc.getPage).toHaveBeenCalledWith(5));
    expect(screen.getByLabelText('Current page')).toHaveValue(5);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByText('Page 5 of 5')).toBeInTheDocument();
  });

  it('renders sharp pages on high density displays without changing their CSS size', async () => {
    const pixelRatio = vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
    try {
      renderWithProviders(<PdfViewer source="/sample.pdf" defaultZoom={1} />);
      await waitFor(() => expect(mockPage.render).toHaveBeenCalled());
      const canvas = screen.getByTestId('pdf-canvas');
      expect(canvas).toHaveAttribute('width', '1200');
      expect(canvas).toHaveAttribute('height', '1600');
      expect(canvas).toHaveStyle({ width: '600px', height: '800px' });
      expect(mockPage.render).toHaveBeenCalledWith(
        expect.objectContaining({ canvas, transform: [2, 0, 0, 2, 0, 0] }),
      );
    } finally {
      pixelRatio.mockRestore();
    }
  });

  it('renders without crashing with default props', () => {
    const { container } = renderWithProviders(<PdfViewer source="/sample.pdf" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the outer wrapper with the default aria-label', () => {
    const { container } = renderWithProviders(<PdfViewer source="/sample.pdf" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('aria-label')).toBe('PDF document');
  });

  it('renders a custom aria-label when provided', () => {
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" aria-label="Manual" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('aria-label')).toBe('Manual');
  });

  it('outer wrapper has role="region"', () => {
    const { container } = renderWithProviders(<PdfViewer source="/sample.pdf" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('role')).toBe('region');
  });

  it('renders a loading state initially (data-loading=true)', () => {
    const { container } = renderWithProviders(<PdfViewer source="/sample.pdf" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-loading')).toBe('true');
  });

  it('renders the loading fallback while loading', () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" loadingFallback={<span>Wait…</span>} />);
    expect(screen.getByText('Wait…')).toBeInTheDocument();
  });

  it('renders the canvas mount slot', () => {
    const { container } = renderWithProviders(<PdfViewer source="/sample.pdf" />);
    expect(container.querySelector('[data-slot="pdf-viewer-mount"]')).not.toBeNull();
  });
});

// ─── 2. Error state ───────────────────────────────────────────────────────────

describe('PdfViewer — error state', () => {
  it('renders error fallback when source is empty', async () => {
    renderWithProviders(<PdfViewer source="" />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('calls onError when source is empty', async () => {
    const onError = vi.fn();
    renderWithProviders(<PdfViewer source="" onError={onError} />);
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('renders custom errorFallback node', async () => {
    renderWithProviders(<PdfViewer source="" errorFallback={<span>Custom err</span>} />);
    await waitFor(() => {
      expect(screen.getByText('Custom err')).toBeInTheDocument();
    });
  });

  it('supports errorFallback as a render function', async () => {
    renderWithProviders(
      <PdfViewer source="" errorFallback={(e: Error) => <span>Got: {e.message}</span>} />,
    );
    await waitFor(() => {
      expect(screen.getByText(/Got:/)).toBeInTheDocument();
    });
  });

  it('sets data-error=true when source is invalid', async () => {
    const { container } = renderWithProviders(<PdfViewer source="" />);
    await waitFor(() => {
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.getAttribute('data-error')).toBe('true');
    });
  });
});

// ─── 3. Toolbar ───────────────────────────────────────────────────────────────

describe('PdfViewer — toolbar', () => {
  it('renders the toolbar by default', async () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" />);
    expect(await screen.findByRole('toolbar')).toBeInTheDocument();
  });

  it('does not render the toolbar when showToolbar=false', () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" showToolbar={false} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('toolbar contains Previous and Next buttons', () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
  });

  it('toolbar contains zoom in / zoom out / fit width buttons', () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" />);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fit width' })).toBeInTheDocument();
  });

  it('does not render Download button by default', () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" />);
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
  });

  it('renders Download button when toolbar.download=true and source is a URL string', () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" toolbar={{ download: true }} />);
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('renders Print button when toolbar.print=true', () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" toolbar={{ print: true }} />);
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
  });

  it('hides the page input when toolbar.pageInput=false', async () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" toolbar={{ pageInput: false }} />);
    await screen.findByRole('toolbar');
    expect(screen.queryByLabelText('Current page')).toBeNull();
  });
});

// ─── 4. Page navigation ───────────────────────────────────────────────────────

describe('PdfViewer — page navigation', () => {
  it('calls onPageChange when Next is clicked (after load)', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PdfViewer source="/sample.pdf" onPageChange={onPageChange} />);

    // Wait until numPages is reflected in the toolbar.
    await waitFor(() => {
      expect(screen.getByTestId('pdf-num-pages').textContent).toBe('5');
    });

    const nextBtn = screen.getByRole('button', { name: 'Next page' });
    await user.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('Previous button is disabled on the first page', async () => {
    renderWithProviders(<PdfViewer source="/sample.pdf" />);
    await waitFor(() => {
      expect(screen.getByTestId('pdf-num-pages').textContent).toBe('5');
    });
    const prevBtn = screen.getByRole('button', { name: 'Previous page' });
    expect(prevBtn).toBeDisabled();
  });

  it('respects controlled `page` prop without internal state mutation', async () => {
    const onPageChange = vi.fn();
    const { rerender } = renderWithProviders(
      <PdfViewer source="/sample.pdf" page={1} onPageChange={onPageChange} />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('pdf-num-pages').textContent).toBe('5');
    });
    rerender(<PdfViewer source="/sample.pdf" page={3} onPageChange={onPageChange} />);
    const input = screen.getByLabelText('Current page') as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe('3');
    });
  });
});

// ─── 5. Zoom ──────────────────────────────────────────────────────────────────

describe('PdfViewer — zoom', () => {
  it('shows the fitted scale and keeps fitting when the viewport is resized', async () => {
    let resize: ResizeObserverCallback | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    try {
      const onZoomChange = vi.fn();
      const { container, unmount } = renderWithProviders(
        <PdfViewer source="/sample.pdf" onZoomChange={onZoomChange} />,
      );
      const area = container.querySelector('[data-slot="pdf-viewer-mount"]') as HTMLElement;
      Object.defineProperty(area, 'clientWidth', { configurable: true, value: 332 });
      await waitFor(() => expect(screen.getByText('50%')).toBeInTheDocument());
      expect(screen.getByTestId('pdf-canvas')).toHaveAttribute('width', '300');

      Object.defineProperty(area, 'clientWidth', { configurable: true, value: 512 });
      act(() => resize?.([], {} as ResizeObserver));
      await waitFor(() => expect(screen.getByText('80%')).toBeInTheDocument());
      expect(screen.getByTestId('pdf-canvas')).toHaveAttribute('width', '480');
      await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
      expect(onZoomChange).toHaveBeenLastCalledWith(0.9);
      unmount();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('calls onZoomChange when Zoom in is clicked', async () => {
    const onZoomChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PdfViewer source="/sample.pdf" defaultZoom={1} onZoomChange={onZoomChange} />,
    );
    await screen.findByRole('toolbar');
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomChange).toHaveBeenCalled();
  });

  it('Zoom out clamps at minZoom', async () => {
    const onZoomChange = vi.fn();
    renderWithProviders(
      <PdfViewer
        source="/sample.pdf"
        defaultZoom={0.25}
        minZoom={0.25}
        onZoomChange={onZoomChange}
      />,
    );
    await screen.findByRole('toolbar');
    const zoomOutBtn = screen.getByRole('button', { name: 'Zoom out' });
    expect(zoomOutBtn).toBeDisabled();
  });
});

// ─── 6. forwardRef ────────────────────────────────────────────────────────────

describe('PdfViewer — forwardRef', () => {
  it('forwards ref to the outer div', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithProviders(<PdfViewer source="/sample.pdf" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── 7. Keyboard ──────────────────────────────────────────────────────────────

describe('PdfViewer — keyboard', () => {
  it('ArrowRight advances to the next page', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" onPageChange={onPageChange} />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('pdf-num-pages').textContent).toBe('5');
    });
    const scrollArea = container.querySelector('[data-slot="pdf-viewer-mount"]') as HTMLElement;
    scrollArea.focus();
    await user.keyboard('{ArrowRight}');
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
