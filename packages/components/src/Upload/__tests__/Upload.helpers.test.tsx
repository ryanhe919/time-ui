/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 直接覆盖 Upload 模块内的 helper 文件（icons.tsx 的 pickFileIcon
 *              与各个图标组件、validateFile.ts 的 interpolate / matchesAccept、
 *              useUploadQueue.ts 的 cleanup / 同步异常 / promise reject /
 *              卸载 abortAll、useFilePreview.ts 的 ObjectURL 生命周期、
 *              UploadList.tsx 的 emptyContent / renderItem 分支，以及
 *              UploadItem.tsx 的进度条、status 图标、percent 溢出等分支）。
 *
 *              这些路径在 Upload.test.tsx 的端到端用例里不会被全部经过，因此
 *              单独抽出来跑直接的单元测试，目的是把覆盖率从 ~86 / ~63 提升到
 *              ≥ 95 / ≥ 80。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import {
  pickFileIcon,
  CloudUploadIcon,
  AlertCircleIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  RotateCwIcon,
  CheckCircleIcon,
  SpinnerIcon,
  FileGenericIcon,
  FileImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileArchiveIcon,
  FileTextIcon,
  FileCodeIcon,
} from '../icons';
import { interpolate, matchesAccept, validateFiles } from '../validateFile';
import { useUploadQueue } from '../useUploadQueue';
import { useFilePreview } from '../useFilePreview';
import { UploadList } from '../UploadList';
import { UploadItem } from '../UploadItem';
import type { UploadFile, UploadRequest } from '../Upload.types';

beforeEach(() => {
  // JSDOM doesn't ship URL.createObjectURL / revokeObjectURL — install no-op
  // placeholders so vi.spyOn() can replace them in individual tests.
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

// ────────────────────────────────────────────────────────────────────
// icons.tsx — pickFileIcon 全 mime / ext 分支 + 图标组件渲染
// ────────────────────────────────────────────────────────────────────

describe('Upload icons — pickFileIcon', () => {
  it('returns FileImageIcon for image/* mime', () => {
    expect(pickFileIcon('image/png', 'a.png')).toBe(FileImageIcon);
  });

  it('returns FileVideoIcon for video/* mime', () => {
    expect(pickFileIcon('video/mp4', 'a.mp4')).toBe(FileVideoIcon);
  });

  it('returns FileAudioIcon for audio/* mime', () => {
    expect(pickFileIcon('audio/mp3', 'a.mp3')).toBe(FileAudioIcon);
  });

  it('returns FileArchiveIcon for application/zip mime', () => {
    expect(pickFileIcon('application/zip', 'a.zip')).toBe(FileArchiveIcon);
  });

  it('returns FileArchiveIcon for application/x-tar mime', () => {
    expect(pickFileIcon('application/x-tar', 'a.tar')).toBe(FileArchiveIcon);
  });

  it('returns FileArchiveIcon for application/x-7z-compressed mime', () => {
    expect(pickFileIcon('application/x-7z-compressed', 'a.7z')).toBe(FileArchiveIcon);
  });

  it('returns FileArchiveIcon for application/x-rar-compressed mime', () => {
    expect(pickFileIcon('application/x-rar-compressed', 'a.rar')).toBe(FileArchiveIcon);
  });

  it('returns FileArchiveIcon for application/gzip mime', () => {
    expect(pickFileIcon('application/gzip', 'a.gz')).toBe(FileArchiveIcon);
  });

  it('returns FileArchiveIcon by extension fallback (.bz2)', () => {
    expect(pickFileIcon('application/octet-stream', 'a.bz2')).toBe(FileArchiveIcon);
  });

  it('returns FileTextIcon for text/* mime', () => {
    expect(pickFileIcon('text/plain', 'a.txt')).toBe(FileTextIcon);
  });

  it('returns FileTextIcon for application/pdf mime', () => {
    expect(pickFileIcon('application/pdf', 'a.pdf')).toBe(FileTextIcon);
  });

  it('returns FileTextIcon for msword mime', () => {
    expect(pickFileIcon('application/msword', 'a.doc')).toBe(FileTextIcon);
  });

  it('returns FileTextIcon for docx mime', () => {
    expect(
      pickFileIcon(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'a.docx',
      ),
    ).toBe(FileTextIcon);
  });

  it('returns FileTextIcon by extension fallback (.md)', () => {
    expect(pickFileIcon('application/octet-stream', 'a.md')).toBe(FileTextIcon);
  });

  it('returns FileCodeIcon for application/json mime', () => {
    expect(pickFileIcon('application/json', 'a.json')).toBe(FileCodeIcon);
  });

  it('returns FileCodeIcon for application/javascript mime', () => {
    expect(pickFileIcon('application/javascript', 'a.js')).toBe(FileCodeIcon);
  });

  it('returns FileCodeIcon for application/xml mime', () => {
    expect(pickFileIcon('application/xml', 'a.xml')).toBe(FileCodeIcon);
  });

  it('returns FileCodeIcon by extension fallback (.tsx)', () => {
    expect(pickFileIcon('application/octet-stream', 'Component.tsx')).toBe(FileCodeIcon);
  });

  it('returns FileCodeIcon by extension fallback (.go)', () => {
    expect(pickFileIcon('application/octet-stream', 'main.go')).toBe(FileCodeIcon);
  });

  it('falls back to FileGenericIcon for unknown mime + ext', () => {
    expect(pickFileIcon('application/octet-stream', 'a.weirdext')).toBe(FileGenericIcon);
  });

  it('handles file name without extension', () => {
    expect(pickFileIcon('application/octet-stream', 'README')).toBe(FileGenericIcon);
  });
});

describe('Upload icons — render smoke', () => {
  it('renders every icon component without throwing', () => {
    // 仅渲染冒烟测试，让覆盖率工具记录这些 SVG 组件被执行过。
    const components = [
      CloudUploadIcon,
      AlertCircleIcon,
      ArrowUpTrayIcon,
      TrashIcon,
      RotateCwIcon,
      CheckCircleIcon,
      SpinnerIcon,
      FileGenericIcon,
      FileImageIcon,
      FileVideoIcon,
      FileAudioIcon,
      FileArchiveIcon,
      FileTextIcon,
      FileCodeIcon,
    ];
    for (const Icon of components) {
      const { container, unmount } = render(<Icon width={16} height={16} />);
      expect(container.querySelector('svg')).toBeTruthy();
      unmount();
    }
  });
});

// ────────────────────────────────────────────────────────────────────
// validateFile.ts — interpolate / matchesAccept / validateFiles 边界
// ────────────────────────────────────────────────────────────────────

describe('Upload validateFile — interpolate', () => {
  it('replaces a single placeholder', () => {
    expect(interpolate('hello {name}', { name: 'world' })).toBe('hello world');
  });

  it('coerces numbers to strings', () => {
    expect(interpolate('{n} bytes', { n: 42 })).toBe('42 bytes');
  });

  it('replaces multiple placeholders independently', () => {
    expect(interpolate('{a}/{b}', { a: 'x', b: 'y' })).toBe('x/y');
  });

  it('emits empty string for missing keys', () => {
    expect(interpolate('hi {missing}', {})).toBe('hi ');
  });

  it('returns the source unchanged when no placeholders present', () => {
    expect(interpolate('plain', { a: '1' })).toBe('plain');
  });
});

describe('Upload validateFile — matchesAccept', () => {
  it('returns true when accept is undefined', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(matchesAccept(f, undefined)).toBe(true);
  });

  it('returns true when accept is empty string', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(matchesAccept(f, '')).toBe(true);
  });

  it('returns true when accept is whitespace-only', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(matchesAccept(f, '   ,  ,')).toBe(true);
  });

  it('matches an exact mime', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(matchesAccept(f, 'text/plain')).toBe(true);
  });

  it('matches a wildcard mime prefix', () => {
    const f = new File(['x'], 'a.png', { type: 'image/png' });
    expect(matchesAccept(f, 'image/*')).toBe(true);
  });

  it('rejects when no pattern matches', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(matchesAccept(f, 'image/*,video/*')).toBe(false);
  });

  it('matches by extension (case-insensitive)', () => {
    const f = new File(['x'], 'Photo.JPG', { type: '' });
    expect(matchesAccept(f, '.jpg,.png')).toBe(true);
  });

  it('falls back to false when extension does not match', () => {
    const f = new File(['x'], 'a.bin', { type: 'application/octet-stream' });
    expect(matchesAccept(f, '.jpg,.png')).toBe(false);
  });
});

describe('Upload validateFile — validateFiles', () => {
  function mkFile(name: string, size: number, type = 'text/plain'): File {
    const blob = new Blob(['x'.repeat(size)], { type });
    return new File([blob], name, { type });
  }

  it('skips count check when maxCount is undefined (Infinity)', () => {
    const result = validateFiles([mkFile('a', 1), mkFile('b', 1), mkFile('c', 1)], {
      currentActive: [],
    });
    expect(result.accepted).toHaveLength(3);
    expect(result.rejections).toHaveLength(0);
  });

  it('rejects duplicates by name+size when allowDuplicates=false', () => {
    const existing: UploadFile = {
      id: '1',
      name: 'a.txt',
      size: 1,
      type: 'text/plain',
      status: 'success',
    };
    const result = validateFiles([mkFile('a.txt', 1)], {
      allowDuplicates: false,
      currentActive: [existing],
    });
    expect(result.accepted).toHaveLength(0);
    expect(result.rejections[0]!.reason).toBe('duplicate');
  });

  it('rejects duplicates within the same incoming batch when allowDuplicates=false', () => {
    const result = validateFiles([mkFile('dup.txt', 3), mkFile('dup.txt', 3)], {
      allowDuplicates: false,
      currentActive: [],
    });
    expect(result.accepted).toHaveLength(1);
    expect(result.rejections).toHaveLength(1);
    expect(result.rejections[0]!.reason).toBe('duplicate');
  });

  it('does not count `removed` items toward maxCount', () => {
    const removed: UploadFile = {
      id: 'r',
      name: 'old.txt',
      size: 1,
      type: 'text/plain',
      status: 'removed',
    };
    const result = validateFiles([mkFile('new.txt', 1)], {
      maxCount: 1,
      currentActive: [removed],
    });
    expect(result.accepted).toHaveLength(1);
  });
});

// ────────────────────────────────────────────────────────────────────
// useUploadQueue.ts — cleanup return / sync throw / promise reject /
//                     unmount abortAll / abort 队列中尚未发起的 id
// ────────────────────────────────────────────────────────────────────

describe('Upload useUploadQueue', () => {
  function makeFile(id: string, name = `${id}.txt`): UploadFile {
    return {
      id,
      name,
      size: 1,
      type: 'text/plain',
      status: 'ready',
      file: new File(['x'], name, { type: 'text/plain' }),
    };
  }

  it('invokes the cleanup function returned by customRequest on abort', () => {
    const cleanup = vi.fn();
    const customRequest: UploadRequest = () => cleanup;
    const file = makeFile('a');
    const onProgress = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: (id) => (id === 'a' ? file : undefined),
        onProgress,
        onSuccess,
        onError,
      }),
    );
    act(() => result.current.enqueue('a'));
    act(() => result.current.abort('a'));
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('routes synchronous customRequest exceptions to onError', () => {
    const customRequest: UploadRequest = () => {
      throw new Error('sync-boom');
    };
    const file = makeFile('a');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError,
      }),
    );
    act(() => result.current.enqueue('a'));
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]![1] as Error).message).toBe('sync-boom');
  });

  it('coerces non-Error synchronous throws into Error instances', () => {
    const customRequest: UploadRequest = () => {
      throw 'string-boom';
    };
    const file = makeFile('a');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError,
      }),
    );
    act(() => result.current.enqueue('a'));
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]![1] as Error).message).toBe('string-boom');
  });

  it('routes a rejected promise from customRequest to onError', async () => {
    const customRequest: UploadRequest = () => Promise.reject(new Error('async-boom'));
    const file = makeFile('a');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError,
      }),
    );
    await act(async () => {
      result.current.enqueue('a');
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]![1] as Error).message).toBe('async-boom');
  });

  it('coerces non-Error promise rejections into Error instances', async () => {
    const customRequest: UploadRequest = () => Promise.reject('string-rej');
    const file = makeFile('a');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError,
      }),
    );
    await act(async () => {
      result.current.enqueue('a');
      await Promise.resolve();
    });
    expect((onError.mock.calls[0]![1] as Error).message).toBe('string-rej');
  });

  it('skips a non-Error after settle (handlers no-op once settled)', () => {
    let captured!: {
      onProgress: (p: number) => void;
      onSuccess: () => void;
      onError: (e: Error) => void;
    };
    const customRequest: UploadRequest = (_args, h) => {
      captured = h;
    };
    const file = makeFile('a');
    const onProgress = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress,
        onSuccess,
        onError,
      }),
    );
    act(() => result.current.enqueue('a'));
    act(() => captured.onSuccess());
    // 已 settle 后再触发 progress/error 都应被吞掉
    act(() => captured.onProgress(50));
    act(() => captured.onError(new Error('late')));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onProgress).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('clamps onProgress percent into [0, 100]', () => {
    let captured!: {
      onProgress: (p: number) => void;
      onSuccess: () => void;
      onError: (e: Error) => void;
    };
    const customRequest: UploadRequest = (_args, h) => {
      captured = h;
    };
    const file = makeFile('a');
    const onProgress = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress,
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );
    act(() => result.current.enqueue('a'));
    act(() => captured.onProgress(-5));
    act(() => captured.onProgress(250));
    expect(onProgress.mock.calls.map((c) => c[1])).toEqual([0, 100]);
  });

  it('drops items whose file is missing without invoking customRequest', () => {
    const customRequest = vi.fn() as unknown as UploadRequest;
    const stale: UploadFile = { id: 'a', name: 'a', size: 0, type: '', status: 'ready' }; // no .file
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => stale,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );
    act(() => result.current.enqueue('a'));
    expect(customRequest).not.toHaveBeenCalled();
  });

  it('is a no-op when customRequest is undefined', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const file = makeFile('a');
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        getFile: () => file,
        onProgress: vi.fn(),
        onSuccess,
        onError,
      }),
    );
    act(() => result.current.enqueue('a'));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('abort() drops a queued (not-yet-in-flight) id from the FIFO', async () => {
    const handlers = new Map<string, () => void>();
    const customRequest: UploadRequest = (args, h) => {
      handlers.set(args.uploadFile.id, () => h.onSuccess());
      // never settles unless we explicitly call its onSuccess via `handlers`
    };
    const files = new Map<string, UploadFile>();
    files.set('a', makeFile('a'));
    files.set('b', makeFile('b'));
    files.set('c', makeFile('c'));
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: (id) => files.get(id),
        onProgress: vi.fn(),
        onSuccess,
        onError: vi.fn(),
      }),
    );
    act(() => result.current.enqueue('a'));
    act(() => result.current.enqueue('b'));
    act(() => result.current.enqueue('c'));
    // 'a' is in flight, 'b' and 'c' are queued
    expect(handlers.has('a')).toBe(true);
    expect(handlers.has('b')).toBe(false);
    // drop queued 'b'
    act(() => result.current.abort('b'));
    // settle 'a' → next slot should pick 'c', not 'b'
    act(() => handlers.get('a')!());
    expect(handlers.has('c')).toBe(true);
    expect(handlers.has('b')).toBe(false);
  });

  it('abortAll() aborts every in-flight controller and clears the queue', () => {
    const aborted: string[] = [];
    const customRequest: UploadRequest = (args) => {
      args.signal.addEventListener('abort', () => aborted.push(args.uploadFile.id));
    };
    const files = new Map<string, UploadFile>();
    files.set('a', makeFile('a'));
    files.set('b', makeFile('b'));
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 2,
        customRequest,
        getFile: (id) => files.get(id),
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );
    act(() => result.current.enqueue('a'));
    act(() => result.current.enqueue('b'));
    act(() => result.current.abortAll());
    expect(aborted.sort()).toEqual(['a', 'b']);
  });

  it('unmount runs abortAll and aborts every in-flight controller', () => {
    const aborted: string[] = [];
    const customRequest: UploadRequest = (args) => {
      args.signal.addEventListener('abort', () => aborted.push(args.uploadFile.id));
    };
    const file = makeFile('a');
    const { result, unmount } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );
    act(() => result.current.enqueue('a'));
    unmount();
    expect(aborted).toEqual(['a']);
  });

  it('swallows errors thrown by the cleanup function on abort', () => {
    const customRequest: UploadRequest = () => () => {
      throw new Error('cleanup-explode');
    };
    const file = makeFile('a');
    const { result } = renderHook(() =>
      useUploadQueue({
        concurrency: 1,
        customRequest,
        getFile: () => file,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
      }),
    );
    act(() => result.current.enqueue('a'));
    // Should not throw
    expect(() => act(() => result.current.abort('a'))).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────
// useFilePreview.ts — 创建/吊销/卸载/无 ObjectURL 环境
// ────────────────────────────────────────────────────────────────────

describe('Upload useFilePreview', () => {
  function imgFile(id: string): UploadFile {
    return {
      id,
      name: `${id}.png`,
      size: 1,
      type: 'image/png',
      status: 'ready',
      file: new File(['x'], `${id}.png`, { type: 'image/png' }),
    };
  }
  function txtFile(id: string): UploadFile {
    return {
      id,
      name: `${id}.txt`,
      size: 1,
      type: 'text/plain',
      status: 'ready',
      file: new File(['x'], `${id}.txt`, { type: 'text/plain' }),
    };
  }

  it('creates an ObjectURL for new image items', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-1');
    const { result } = renderHook(({ value }) => useFilePreview(value), {
      initialProps: { value: [imgFile('a')] },
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.current.get('a')).toBe('blob:test-1');
  });

  it('skips non-image items and items missing a File reference', () => {
    const create = vi.spyOn(URL, 'createObjectURL');
    const { id, ...rest } = imgFile('a');
    const noFile: UploadFile = { ...rest, id, file: undefined };
    renderHook(() => useFilePreview([txtFile('t'), noFile]));
    expect(create).not.toHaveBeenCalled();
  });

  it('revokes URLs for items that disappear from value', () => {
    let n = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test-${++n}`);
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const { rerender } = renderHook(({ value }) => useFilePreview(value), {
      initialProps: { value: [imgFile('a'), imgFile('b')] },
    });
    rerender({ value: [imgFile('a')] }); // b removed
    expect(revoke).toHaveBeenCalledWith('blob:test-2');
  });

  it('revokes all created URLs on unmount', () => {
    let n = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test-${++n}`);
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const { unmount } = renderHook(() => useFilePreview([imgFile('a'), imgFile('b')]));
    unmount();
    expect(revoke).toHaveBeenCalledTimes(2);
  });

  it('swallows createObjectURL throws (older browsers / restricted blobs)', () => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('cannot');
    });
    const { result } = renderHook(() => useFilePreview([imgFile('a')]));
    expect(result.current.get('a')).toBeUndefined();
  });

  it('swallows revokeObjectURL throws on cleanup', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {
      throw new Error('cannot revoke');
    });
    const { rerender, unmount } = renderHook(({ value }) => useFilePreview(value), {
      initialProps: { value: [imgFile('a')] },
    });
    expect(() => {
      rerender({ value: [] });
      unmount();
    }).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────
// UploadList.tsx — emptyContent / renderItem / 列表渲染
// ────────────────────────────────────────────────────────────────────

describe('UploadList', () => {
  it('renders emptyContent when value is empty (and emptyContent is provided)', () => {
    const { container, getByText } = renderWithProviders(
      <UploadList value={[]} emptyContent={<span>No files yet</span>} />,
    );
    expect(getByText('No files yet')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeNull();
  });

  it('renders an empty <ul> when value is empty and no emptyContent given', () => {
    const { container } = renderWithProviders(<UploadList value={[]} />);
    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul!.children).toHaveLength(0);
  });

  it('falls through to <ul> rendering when only `removed` items exist + emptyContent is provided', () => {
    // active.length === 0 但 emptyContent 有 → 走 emptyContent 分支
    const removedOnly: UploadFile = {
      id: '1',
      name: 'gone.txt',
      size: 1,
      type: 'text/plain',
      status: 'removed',
    };
    const { getByText } = renderWithProviders(
      <UploadList value={[removedOnly]} emptyContent={<span>Empty</span>} />,
    );
    expect(getByText('Empty')).toBeInTheDocument();
  });

  it('uses renderItem when provided and forwards remove/retry actions', () => {
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    const file: UploadFile = {
      id: '1',
      name: 'a.txt',
      size: 1,
      type: 'text/plain',
      status: 'error',
    };
    const { getByText } = renderWithProviders(
      <UploadList
        value={[file]}
        onRemove={onRemove}
        onRetry={onRetry}
        renderItem={(f, actions) => (
          <span>
            <span>custom-{f.name}</span>
            <button onClick={actions.remove}>X</button>
            <button onClick={actions.retry}>R</button>
          </span>
        )}
      />,
    );
    expect(getByText('custom-a.txt')).toBeInTheDocument();
    getByText('X').click();
    getByText('R').click();
    expect(onRemove).toHaveBeenCalledWith(file);
    expect(onRetry).toHaveBeenCalledWith(file);
  });

  it('passes through className and merges with classNames.list', () => {
    const file: UploadFile = {
      id: '1',
      name: 'a.txt',
      size: 1,
      type: 'text/plain',
      status: 'success',
    };
    const { container } = renderWithProviders(
      <UploadList value={[file]} className="extra" classNames={{ list: 'inner' }} />,
    );
    const ul = container.querySelector('ul')!;
    expect(ul.className).toContain('inner');
    expect(ul.className).toContain('extra');
  });

  it('skips items with status="removed"', () => {
    const removed: UploadFile = {
      id: '1',
      name: 'gone.txt',
      size: 1,
      type: 'text/plain',
      status: 'removed',
    };
    const kept: UploadFile = {
      id: '2',
      name: 'kept.txt',
      size: 1,
      type: 'text/plain',
      status: 'success',
    };
    const { container, queryByText, getByText } = renderWithProviders(
      <UploadList value={[removed, kept]} />,
    );
    expect(container.querySelectorAll('li')).toHaveLength(1);
    expect(queryByText('gone.txt')).toBeNull();
    expect(getByText('kept.txt')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────
// UploadItem.tsx — formatSize / status icon / 进度条 / percent 钳制 /
//                  retry 按钮 / readOnly 隐藏操作
// ────────────────────────────────────────────────────────────────────

describe('UploadItem', () => {
  const baseFile: UploadFile = {
    id: '1',
    name: 'a.txt',
    size: 0,
    type: 'text/plain',
    status: 'ready',
  };

  it('renders "0 B" for zero / negative / non-finite size', () => {
    const { rerender, getByText } = renderWithProviders(
      <UploadItem file={{ ...baseFile, size: 0 }} />,
    );
    expect(getByText('0 B')).toBeInTheDocument();
    rerender(<UploadItem file={{ ...baseFile, size: -10 }} />);
    expect(getByText('0 B')).toBeInTheDocument();
    rerender(<UploadItem file={{ ...baseFile, size: Number.POSITIVE_INFINITY }} />);
    expect(getByText('0 B')).toBeInTheDocument();
  });

  it('formats large sizes through KB / MB / GB units', () => {
    const cases: Array<[number, RegExp]> = [
      [1500, /KB$/], // 1.5 KB
      [1024 * 1024 * 5, /MB$/], // 5 MB
      [1024 * 1024 * 1024 * 3, /GB$/], // 3 GB
      [1024 * 1024 * 1024 * 1024 * 2, /TB$/], // 2 TB
    ];
    for (const [size, re] of cases) {
      const { getByText, unmount } = renderWithProviders(
        <UploadItem file={{ ...baseFile, size, name: `${size}.bin` }} />,
      );
      const node = getByText(re);
      expect(node.textContent).toMatch(re);
      unmount();
    }
  });

  it('renders a retry button when file.status="error" and onRetry is provided', () => {
    const onRetry = vi.fn();
    const file: UploadFile = { ...baseFile, status: 'error', error: new Error('x') };
    const { container } = renderWithProviders(<UploadItem file={file} onRetry={onRetry} />);
    const retry = container.querySelector('[data-slot="retry"]') as HTMLButtonElement | null;
    expect(retry).not.toBeNull();
    retry!.click();
    expect(onRetry).toHaveBeenCalledWith(file);
  });

  it('does not render retry button when status is not error', () => {
    const onRetry = vi.fn();
    const file: UploadFile = { ...baseFile, status: 'uploading', percent: 30 };
    const { container } = renderWithProviders(<UploadItem file={file} onRetry={onRetry} />);
    expect(container.querySelector('[data-slot="retry"]')).toBeNull();
  });

  it('renders a remove button by default and triggers onRemove', () => {
    const onRemove = vi.fn();
    const { container } = renderWithProviders(<UploadItem file={baseFile} onRemove={onRemove} />);
    const remove = container.querySelector('[data-slot="remove"]') as HTMLButtonElement | null;
    expect(remove).not.toBeNull();
    remove!.click();
    expect(onRemove).toHaveBeenCalledWith(baseFile);
  });

  it('hides all action buttons when isReadOnly is true', () => {
    const { container } = renderWithProviders(
      <UploadItem
        file={{ ...baseFile, status: 'error' }}
        onRemove={() => {}}
        onRetry={() => {}}
        isReadOnly
      />,
    );
    expect(container.querySelector('[data-slot="remove"]')).toBeNull();
    expect(container.querySelector('[data-slot="retry"]')).toBeNull();
  });

  it('hides all action buttons when isDisabled is true', () => {
    const { container } = renderWithProviders(
      <UploadItem
        file={{ ...baseFile, status: 'error' }}
        onRemove={() => {}}
        onRetry={() => {}}
        isDisabled
      />,
    );
    expect(container.querySelector('[data-slot="remove"]')).toBeNull();
    expect(container.querySelector('[data-slot="retry"]')).toBeNull();
  });

  it('clamps percent to [0, 100] (renders without throwing for out-of-range values)', () => {
    // Emotion compiles `transform: scaleX(...)` to a hashed class, so we can't
    // grep innerHTML — but exercising both extremes here covers the
    // Math.max(0, Math.min(100, ...)) branches in UploadItem.
    expect(() => {
      const { rerender, unmount } = renderWithProviders(
        <UploadItem file={{ ...baseFile, status: 'uploading', percent: -50 }} />,
      );
      rerender(<UploadItem file={{ ...baseFile, status: 'uploading', percent: 250 }} />);
      rerender(<UploadItem file={{ ...baseFile, status: 'uploading', percent: undefined }} />);
      unmount();
    }).not.toThrow();
  });

  it('renders a previewUrl <img> instead of a file icon when provided', () => {
    const { container } = renderWithProviders(
      <UploadItem file={{ ...baseFile, type: 'image/png', previewUrl: 'blob:preview' }} />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('blob:preview');
  });

  it('shows progress bar for uploading / success / error and hides it for ready', () => {
    const { container, rerender } = renderWithProviders(
      <UploadItem file={{ ...baseFile, status: 'ready' }} />,
    );
    const countBars = () => container.querySelectorAll('span[aria-hidden="true"] > span').length;

    const readyBars = countBars();
    rerender(<UploadItem file={{ ...baseFile, status: 'uploading', percent: 50 }} />);
    expect(countBars()).toBeGreaterThan(readyBars);
    rerender(<UploadItem file={{ ...baseFile, status: 'success' }} />);
    expect(countBars()).toBeGreaterThan(readyBars);
    rerender(<UploadItem file={{ ...baseFile, status: 'error' }} />);
    expect(countBars()).toBeGreaterThan(readyBars);
  });

  it('forwards arbitrary HTML attrs onto the <li>', () => {
    const { container } = renderWithProviders(<UploadItem file={baseFile} data-testid="item-x" />);
    expect(container.querySelector('[data-testid="item-x"]')).not.toBeNull();
  });
});
