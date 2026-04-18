/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 Upload 模块的可访问性与生命周期行为。
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { renderWithProviders, expectA11y, TimeUIProvider } from '../test-utils';
import { Upload } from './Upload';
import type { UploadFile } from './Upload.types';

const seed: UploadFile[] = [
  {
    id: 'a',
    name: 'a.txt',
    size: 12,
    type: 'text/plain',
    status: 'success',
    percent: 100,
  },
  {
    id: 'b',
    name: 'b.png',
    size: 34,
    type: 'image/png',
    status: 'error',
    error: new Error('boom'),
  },
];

// JSDOM lacks URL.createObjectURL / revokeObjectURL. Install minimal stubs first so vi.spyOn can wrap them.
if (typeof URL !== 'undefined') {
  if (typeof (URL as unknown as { createObjectURL?: unknown }).createObjectURL !== 'function') {
    (URL as unknown as { createObjectURL: (f: File) => string }).createObjectURL = () => 'blob:x';
  }
  if (typeof (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL !== 'function') {
    (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {};
  }
}

describe('Upload — a11y & SSR & lifecycle', () => {
  it('#23 unmount revokes the same number of ObjectURLs it created', () => {
    const created: string[] = [];
    const revoked: string[] = [];
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      const u = `blob:${Math.random()}`;
      created.push(u);
      return u;
    });
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation((u: string) => {
      revoked.push(u);
    });

    const files: UploadFile[] = [
      {
        id: 'p1',
        name: 'x.png',
        size: 10,
        type: 'image/png',
        status: 'ready',
        file: new File(['x'], 'x.png', { type: 'image/png' }),
      },
      {
        id: 'p2',
        name: 'y.png',
        size: 10,
        type: 'image/png',
        status: 'ready',
        file: new File(['y'], 'y.png', { type: 'image/png' }),
      },
    ];
    const { unmount } = renderWithProviders(<Upload defaultValue={files} multiple />);
    unmount();
    expect(created.length).toBeGreaterThan(0);
    expect(revoked.length).toBe(created.length);
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it('#24 SSR: renderToString does not throw', () => {
    expect(() =>
      renderToString(
        <TimeUIProvider>
          <Upload aria-label="u" />
        </TimeUIProvider>,
      ),
    ).not.toThrow();
    expect(() =>
      renderToString(
        <TimeUIProvider>
          <Upload variant="dropzone" defaultValue={seed} />
        </TimeUIProvider>,
      ),
    ).not.toThrow();
  });

  it('#25 dropzone ships a prefers-reduced-motion rule disabling transitions', () => {
    renderWithProviders(<Upload variant="dropzone" />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[^}]*transition:\s*none/);
  });

  it('#26 axe: 5 snapshots — button, dropzone, error, disabled, with list', async () => {
    const snapshots = [
      renderWithProviders(<Upload aria-label="pick file" />).container,
      renderWithProviders(<Upload variant="dropzone" aria-label="drop" />).container,
      renderWithProviders(
        <Upload label="Avatar" errorMessage="Required" isRequired aria-label="av" />,
      ).container,
      renderWithProviders(<Upload isDisabled aria-label="off" />).container,
      renderWithProviders(<Upload aria-label="list" defaultValue={seed} />).container,
    ];
    for (const c of snapshots) {
      await expectA11y(c);
    }
  });
});
