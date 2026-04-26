/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 验证 PdfViewer 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it, vi, beforeEach } from 'vitest';
import { PdfViewer } from '@timeui/react/pdf-viewer';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

// Match the unit-test mock so the canvas page slot doesn't blow up axe.
const mockRenderTask = { promise: Promise.resolve(), cancel: vi.fn() };
const mockPage = {
  getViewport: vi.fn(({ scale }: { scale: number }) => ({
    width: 600 * scale,
    height: 800 * scale,
  })),
  render: vi.fn(() => mockRenderTask),
};
const mockDoc = {
  numPages: 3,
  getPage: vi.fn(() => Promise.resolve(mockPage)),
  destroy: vi.fn(() => Promise.resolve()),
};

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({ promise: Promise.resolve(mockDoc) })),
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
});

describe('PdfViewer a11y', () => {
  it('has no violations with default props', async () => {
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" aria-label="Sample PDF" />,
    );
    await expectA11y(container);
  });

  it('has no violations without toolbar', async () => {
    const { container } = renderWithProviders(
      <PdfViewer source="/sample.pdf" aria-label="Sample PDF" showToolbar={false} />,
    );
    await expectA11y(container);
  });

  it('has no violations on error fallback', async () => {
    const { container } = renderWithProviders(<PdfViewer source="" aria-label="Empty PDF" />);
    await expectA11y(container);
  });
});
