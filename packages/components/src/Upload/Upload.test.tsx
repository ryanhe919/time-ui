/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 Upload 模块的行为与回归。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef, useState } from 'react';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { Upload } from './Upload';
import type { UploadFile, UploadHandle, UploadRejection, UploadRequest } from './Upload.types';

function makeFile(name: string, content: string, type = 'text/plain'): File {
  return new File([content], name, { type });
}

async function pickFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files,
  });
  await act(async () => {
    fireEvent.change(input);
  });
}

function getHiddenInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
  if (!input) throw new Error('hidden input not found');
  return input;
}

function getDropzone(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[role="button"]') as HTMLElement | null;
  if (!el) throw new Error('dropzone not found');
  return el;
}

function makeDataTransfer(files: File[]): DataTransfer {
  return {
    files: files as unknown as FileList,
    items: files.map((f) => ({
      kind: 'file',
      type: f.type,
      getAsFile: () => f,
    })) as unknown as DataTransferItemList,
    types: ['Files'],
    dropEffect: 'copy',
    effectAllowed: 'all',
    clearData: () => {},
    getData: () => '',
    setData: () => {},
    setDragImage: () => {},
  } as unknown as DataTransfer;
}

beforeEach(() => {
  // reset ObjectURL spy counters
  if (typeof URL !== 'undefined') {
    if (!('createObjectURL' in URL)) {
      (URL as unknown as { createObjectURL: (f: File) => string }).createObjectURL = () =>
        'blob:mock';
    }
    if (!('revokeObjectURL' in URL)) {
      (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {};
    }
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Upload — rendering & ref', () => {
  it('#1 default renders + ref API exposes expected methods', () => {
    const ref = createRef<UploadHandle>();
    const { container } = renderWithProviders(<Upload ref={ref} aria-label="u" />);
    // button trigger is there
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(getHiddenInput(container)).toBeInTheDocument();
    expect(ref.current).toBeTruthy();
    const api = ref.current!;
    expect(typeof api.open).toBe('function');
    expect(typeof api.submit).toBe('function');
    expect(typeof api.retry).toBe('function');
    expect(typeof api.abort).toBe('function');
    expect(typeof api.clear).toBe('function');
  });

  it('#2 variant="dropzone" renders role="button" region and no default trigger button', () => {
    const { container } = renderWithProviders(<Upload variant="dropzone" aria-label="dz" />);
    const dropzone = getDropzone(container);
    expect(dropzone).toHaveAttribute('role', 'button');
    // only the dropzone is a button — not a separate trigger
    expect(screen.getAllByRole('button')).toHaveLength(1);
    // and the trigger <Button> text should not appear
    expect(screen.queryByText('Choose file')).toBeNull();
    expect(screen.queryByText('选择文件')).toBeNull();
  });
});

describe('Upload — controlled vs uncontrolled', () => {
  it('#3 controlled value=[] + onChange ignored internally cannot mutate value', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(<Upload value={[]} onChange={onChange} multiple />);
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'hi')]);
    // onChange was called, but since value is still [] and parent didn't update it,
    // the UI still reflects [] (no item rendered)
    expect(onChange).toHaveBeenCalled();
    const [nextValue, meta] = onChange.mock.calls[0]!;
    expect(Array.isArray(nextValue)).toBe(true);
    expect((nextValue as UploadFile[]).length).toBe(1);
    expect(meta.trigger).toBe('add');
    // UI reflects parent-held value, which is still empty
    expect(screen.queryByText('a.txt')).toBeNull();
  });

  it('#4 uncontrolled: picking a file renders UI + onChange meta.trigger="add"', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(<Upload onChange={onChange} multiple />);
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'hi')]);
    expect(screen.getByText('a.txt')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
    const [, meta] = onChange.mock.calls.at(-1) as [UploadFile[], { trigger: string }];
    expect(meta.trigger).toBe('add');
  });

  it('#5 dev warn once when both value and defaultValue are supplied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithProviders(<Upload value={[]} defaultValue={[]} onChange={() => {}} />);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('Upload — validation', () => {
  it('#6 accept filter on drop → onReject reason="accept"', async () => {
    const onReject = vi.fn();
    const { container } = renderWithProviders(
      <Upload variant="dropzone" accept="image/*" onReject={onReject} multiple />,
    );
    const dz = getDropzone(container);
    const bad = makeFile('a.txt', 'x', 'text/plain');
    await act(async () => {
      fireEvent.drop(dz, { dataTransfer: makeDataTransfer([bad]) });
    });
    expect(onReject).toHaveBeenCalled();
    const rejections = onReject.mock.calls.at(-1)?.[0] as UploadRejection[];
    expect(rejections.some((r) => r.reason === 'accept')).toBe(true);
  });

  it('#7 accept filter on click → onReject reason="accept"', async () => {
    const onReject = vi.fn();
    const { container } = renderWithProviders(
      <Upload accept="image/*" onReject={onReject} multiple />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x', 'text/plain')]);
    const rejections = onReject.mock.calls.at(-1)?.[0] as UploadRejection[];
    expect(rejections[0]!.reason).toBe('accept');
  });

  it('#8 maxSize filter → reason="size"', async () => {
    const onReject = vi.fn();
    const { container } = renderWithProviders(<Upload maxSize={2} onReject={onReject} multiple />);
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'hello')]);
    const rejections = onReject.mock.calls.at(-1)?.[0] as UploadRejection[];
    expect(rejections[0]!.reason).toBe('size');
  });

  it('#9 maxCount filter → reason="count", existing kept', async () => {
    const onReject = vi.fn();
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Upload maxCount={1} onReject={onReject} onChange={onChange} multiple />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'a')]);
    await pickFiles(input, [makeFile('b.txt', 'b')]);
    expect(screen.getByText('a.txt')).toBeInTheDocument();
    expect(screen.queryByText('b.txt')).toBeNull();
    const rejections = onReject.mock.calls.at(-1)?.[0] as UploadRejection[];
    expect(rejections[0]!.reason).toBe('count');
  });

  it('#10 beforeUpload returning false → reason="before-upload"', async () => {
    const onReject = vi.fn();
    const { container } = renderWithProviders(
      <Upload beforeUpload={() => false} onReject={onReject} multiple />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    const rejections = onReject.mock.calls.at(-1)?.[0] as UploadRejection[];
    expect(rejections[0]!.reason).toBe('before-upload');
  });

  it('#11 beforeUpload Promise<false> → item not in value during/after', async () => {
    let resolveGate: (v: boolean) => void = () => {};
    const gate = new Promise<boolean>((res) => (resolveGate = res));
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Upload beforeUpload={() => gate} onChange={onChange} multiple />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    // during pending promise, item is NOT in value
    expect(screen.queryByText('a.txt')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => {
      resolveGate(false);
      await Promise.resolve();
    });
    // after reject, still not there
    expect(screen.queryByText('a.txt')).toBeNull();
  });
});

describe('Upload — trigger interactions', () => {
  it('#12 clicking trigger invokes input.click()', async () => {
    const { container } = renderWithProviders(<Upload aria-label="u" />);
    const input = getHiddenInput(container);
    const spy = vi.spyOn(input, 'click').mockImplementation(() => {});
    await userEvent.click(screen.getByRole('button'));
    expect(spy).toHaveBeenCalled();
  });

  it('#13 dropzone keyboard Enter / Space invokes input.click()', async () => {
    const { container } = renderWithProviders(<Upload variant="dropzone" />);
    const input = getHiddenInput(container);
    const spy = vi.spyOn(input, 'click').mockImplementation(() => {});
    const dz = getDropzone(container);
    dz.focus();
    fireEvent.keyDown(dz, { key: 'Enter' });
    expect(spy).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(dz, { key: ' ' });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('#14 dragEnter sets data-dragging, dragLeave clears it', () => {
    const { container } = renderWithProviders(<Upload variant="dropzone" />);
    const dz = getDropzone(container);
    fireEvent.dragEnter(dz, { dataTransfer: makeDataTransfer([]) });
    expect(dz).toHaveAttribute('data-dragging', 'true');
    fireEvent.dragLeave(dz, { dataTransfer: makeDataTransfer([]) });
    expect(dz).not.toHaveAttribute('data-dragging');
  });

  it('#15 dragEnter with wrong accept → data-rejecting="true"', () => {
    const { container } = renderWithProviders(<Upload variant="dropzone" accept="image/*" />);
    const dz = getDropzone(container);
    fireEvent.dragEnter(dz, {
      dataTransfer: makeDataTransfer([makeFile('a.txt', 'x', 'text/plain')]),
    });
    expect(dz).toHaveAttribute('data-rejecting', 'true');
  });
});

describe('Upload — remove', () => {
  it('#16 clicking remove invokes onRemove + onChange meta.trigger="remove"', async () => {
    const onRemove = vi.fn();
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Upload onRemove={onRemove} onChange={onChange} multiple />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    const removeBtn = screen.getByRole('button', { name: /remove|删除/i });
    await act(async () => {
      await userEvent.click(removeBtn);
    });
    expect(onRemove).toHaveBeenCalledTimes(1);
    const lastCall = onChange.mock.calls.at(-1) as [UploadFile[], { trigger: string }];
    expect(lastCall[1].trigger).toBe('remove');
    expect(screen.queryByText('a.txt')).toBeNull();
  });

  it('#17 onRemove returning false keeps item', async () => {
    const onRemove = vi.fn(() => false as const);
    const { container } = renderWithProviders(<Upload onRemove={onRemove} multiple />);
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    const removeBtn = screen.getByRole('button', { name: /remove|删除/i });
    await act(async () => {
      await userEvent.click(removeBtn);
    });
    expect(screen.getByText('a.txt')).toBeInTheDocument();
  });
});

describe('Upload — customRequest pipeline', () => {
  it('#18 onProgress(50) triggers onUploadProgress but not onChange', async () => {
    let handlersCaptured: Parameters<UploadRequest>[1] | null = null;
    const customRequest: UploadRequest = (_args, handlers) => {
      handlersCaptured = handlers;
    };
    const onUploadProgress = vi.fn();
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Upload
        customRequest={customRequest}
        onUploadProgress={onUploadProgress}
        onChange={onChange}
        multiple
      />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    // add triggers onChange once
    const addCalls = onChange.mock.calls.length;
    await act(async () => {
      handlersCaptured!.onProgress(50);
    });
    expect(onUploadProgress).toHaveBeenCalled();
    const [, pct] = onUploadProgress.mock.calls.at(-1) as [UploadFile, number];
    expect(pct).toBe(50);
    // onChange should NOT have fired again for progress
    expect(onChange.mock.calls.length).toBe(addCalls);
  });

  it('#19 onSuccess sets status=success, keeps response, fires onUploadComplete once', async () => {
    let handlersCaptured: Parameters<UploadRequest>[1] | null = null;
    const customRequest: UploadRequest = (_args, handlers) => {
      handlersCaptured = handlers;
    };
    const onUploadComplete = vi.fn();
    const onChange = vi.fn();
    function H() {
      const [v, setV] = useState<UploadFile[]>([]);
      return (
        <Upload
          value={v}
          onChange={(next, meta) => {
            setV(next);
            onChange(next, meta);
          }}
          customRequest={customRequest}
          onUploadComplete={onUploadComplete}
          multiple
        />
      );
    }
    const { container } = renderWithProviders(<H />);
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    await act(async () => {
      handlersCaptured!.onSuccess({ url: '/a' });
    });
    const last = onChange.mock.calls.at(-1) as [UploadFile[], { trigger: string }];
    expect(last[0][0]!.status).toBe('success');
    expect(last[0][0]!.response).toEqual({ url: '/a' });
    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
  });

  it('#20 onError sets status=error and keeps error', async () => {
    let handlersCaptured: Parameters<UploadRequest>[1] | null = null;
    const customRequest: UploadRequest = (_args, handlers) => {
      handlersCaptured = handlers;
    };
    const onChange = vi.fn();
    function H() {
      const [v, setV] = useState<UploadFile[]>([]);
      return (
        <Upload
          value={v}
          onChange={(next, meta) => {
            setV(next);
            onChange(next, meta);
          }}
          customRequest={customRequest}
          multiple
        />
      );
    }
    const { container } = renderWithProviders(<H />);
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    await act(async () => {
      handlersCaptured!.onError(new Error('boom'));
    });
    const last = onChange.mock.calls.at(-1) as [UploadFile[], { trigger: string }];
    expect(last[0][0]!.status).toBe('error');
    expect((last[0][0]!.error as Error).message).toBe('boom');
  });

  it('#21 concurrency=2 limits uploading items to 2', async () => {
    const handlersByName = new Map<string, Parameters<UploadRequest>[1]>();
    const customRequest: UploadRequest = (args, handlers) => {
      handlersByName.set(args.file.name, handlers);
      // never settles — keeps slot busy
    };
    const { container } = renderWithProviders(
      <Upload customRequest={customRequest} concurrency={2} multiple />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [
      makeFile('a.txt', 'a'),
      makeFile('b.txt', 'b'),
      makeFile('c.txt', 'c'),
    ]);
    // queue must only admit 2 concurrent requests
    await waitFor(() => {
      expect(handlersByName.size).toBe(2);
    });
    expect(handlersByName.has('a.txt')).toBe(true);
    expect(handlersByName.has('b.txt')).toBe(true);
    expect(handlersByName.has('c.txt')).toBe(false);
  });

  it('#22 ref.abort(id) aborts signal and sets item to error', async () => {
    let capturedSignal: AbortSignal | null = null;
    let capturedId = '';
    const customRequest: UploadRequest = (args) => {
      capturedSignal = args.signal;
      capturedId = args.uploadFile.id;
    };
    const ref = createRef<UploadHandle>();
    let current: UploadFile[] = [];
    function H() {
      const [v, setV] = useState<UploadFile[]>([]);
      current = v;
      return (
        <Upload
          ref={ref}
          value={v}
          onChange={(next) => setV(next)}
          customRequest={customRequest}
          multiple
        />
      );
    }
    const { container } = renderWithProviders(<H />);
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    await waitFor(() => expect(capturedId).not.toBe(''));
    act(() => {
      ref.current!.abort(capturedId);
    });
    expect(capturedSignal!.aborted).toBe(true);
    await waitFor(() => {
      const it = current.find((f) => f.id === capturedId);
      expect(it?.status).toBe('error');
    });
  });
});

describe('Upload — read-only & duplicates', () => {
  it('#27 isReadOnly disables trigger and hides remove button', async () => {
    const { container } = renderWithProviders(
      <Upload
        isReadOnly
        defaultValue={[
          {
            id: 'x1',
            name: 'seed.txt',
            size: 2,
            type: 'text/plain',
            status: 'success',
          },
        ]}
      />,
    );
    const input = getHiddenInput(container);
    expect(input.disabled).toBe(true);
    // no remove button exists since item actions suppressed
    expect(screen.queryByRole('button', { name: /remove|删除/i })).toBeNull();
  });

  it('#28 allowDuplicates=false rejects second same-name file', async () => {
    const onReject = vi.fn();
    const { container } = renderWithProviders(
      <Upload allowDuplicates={false} onReject={onReject} multiple />,
    );
    const input = getHiddenInput(container);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    await pickFiles(input, [makeFile('a.txt', 'x')]);
    const rejections = onReject.mock.calls.at(-1)?.[0] as UploadRejection[];
    expect(rejections[0]!.reason).toBe('duplicate');
  });
});
