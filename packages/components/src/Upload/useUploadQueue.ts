/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Upload 模块的 FIFO 并发队列 hook。
 */

import { useCallback, useEffect, useRef } from 'react';
import type { UploadFile, UploadRequest, UploadRequestHandlers } from './Upload.types';

export interface UseUploadQueueOptions {
  concurrency: number;
  customRequest?: UploadRequest;
  getFile: (id: string) => UploadFile | undefined;
  onProgress: (id: string, percent: number) => void;
  onSuccess: (id: string, response?: unknown) => void;
  onError: (id: string, error: Error) => void;
}

interface InFlight {
  controller: AbortController;
  cleanup?: () => void;
}

export interface UploadQueueHandle {
  enqueue: (id: string) => void;
  abort: (id: string) => void;
  abortAll: () => void;
}

export function useUploadQueue(opts: UseUploadQueueOptions): UploadQueueHandle {
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const queueRef = useRef<string[]>([]);
  const inFlightRef = useRef<Map<string, InFlight>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());

  const tick = useCallback(() => {
    const { concurrency, customRequest, getFile, onProgress, onSuccess, onError } = optsRef.current;
    if (!customRequest) return;

    while (inFlightRef.current.size < Math.max(1, concurrency)) {
      const id = queueRef.current.shift();
      if (!id) break;
      const file = getFile(id);
      if (!file || !file.file) {
        // 丢弃失效项
        continue;
      }

      const controller = new AbortController();
      let settled = false;

      const handlers: UploadRequestHandlers = {
        onProgress: (percent: number) => {
          if (settled) return;
          onProgress(id, Math.max(0, Math.min(100, percent)));
        },
        onSuccess: (response?: unknown) => {
          if (settled) return;
          settled = true;
          inFlightRef.current.delete(id);
          onSuccess(id, response);
          tick();
        },
        onError: (error: Error) => {
          if (settled) return;
          settled = true;
          inFlightRef.current.delete(id);
          onError(id, error);
          tick();
        },
      };

      const inflight: InFlight = { controller };
      inFlightRef.current.set(id, inflight);

      try {
        const result = customRequest(
          { file: file.file, uploadFile: file, signal: controller.signal },
          handlers,
        );
        if (typeof result === 'function') {
          inflight.cleanup = result;
        } else if (result && typeof (result as Promise<void>).then === 'function') {
          (result as Promise<void>).catch((err: unknown) => {
            const e = err instanceof Error ? err : new Error(String(err));
            handlers.onError(e);
          });
        }
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        handlers.onError(e);
      }
    }
  }, []);

  const enqueue = useCallback(
    (id: string) => {
      if (seenRef.current.has(id)) return;
      seenRef.current.add(id);
      queueRef.current.push(id);
      tick();
    },
    [tick],
  );

  const abort = useCallback((id: string) => {
    const inflight = inFlightRef.current.get(id);
    if (inflight) {
      try {
        inflight.controller.abort();
      } catch {
        // 忽略
      }
      try {
        inflight.cleanup?.();
      } catch {
        // 忽略
      }
      inFlightRef.current.delete(id);
    }
    queueRef.current = queueRef.current.filter((q) => q !== id);
    seenRef.current.delete(id);
  }, []);

  const abortAll = useCallback(() => {
    for (const [id, inflight] of inFlightRef.current) {
      try {
        inflight.controller.abort();
      } catch {
        // 忽略
      }
      try {
        inflight.cleanup?.();
      } catch {
        // 忽略
      }
      inFlightRef.current.delete(id);
    }
    queueRef.current = [];
    seenRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      abortAll();
    };
  }, [abortAll]);

  return { enqueue, abort, abortAll };
}
