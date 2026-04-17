/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 useChatStream hook：消费 async-iterable 的字符串分片并累积为完整文本。
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseChatStreamOptions {
  /** 流开始时（status 变为 'streaming'）调用。 */
  onStart?: () => void;
  /** 每次新 chunk 到来时调用，传入*当前累积*的完整文本。 */
  onUpdate?: (text: string) => void;
  /** 流成功完成后调用一次。 */
  onComplete?: (finalText: string) => void;
  /** 流出错时调用一次。 */
  onError?: (error: unknown) => void;
}

export interface UseChatStreamResult {
  /** 自上次 reset 以来累积的文本。 */
  text: string;
  /** start 之后、complete/error/cancel 之前为 true。 */
  isStreaming: boolean;
  /** 最近一次 error（下一次 start 时清空）。 */
  error: unknown | null;
  /**
   * 开始消费一个异步迭代器。
   * 每次 yield 的 string 会*追加*到 text。
   * 返回最终的累积文本。
   */
  start: (chunks: AsyncIterable<string>) => Promise<string>;
  /** 取消正在进行的流（把 isStreaming 置为 false）。 */
  cancel: () => void;
  /** 清空 text，不取消正在进行的流。 */
  reset: () => void;
}

export function useChatStream(options?: UseChatStreamOptions): UseChatStreamResult {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // 回调放在 ref 中，避免每次重新渲染时 start / cancel 引用变化。
  const onStartRef = useRef(options?.onStart);
  const onUpdateRef = useRef(options?.onUpdate);
  const onCompleteRef = useRef(options?.onComplete);
  const onErrorRef = useRef(options?.onError);

  useEffect(() => {
    onStartRef.current = options?.onStart;
    onUpdateRef.current = options?.onUpdate;
    onCompleteRef.current = options?.onComplete;
    onErrorRef.current = options?.onError;
  }, [options?.onStart, options?.onUpdate, options?.onComplete, options?.onError]);

  // 每次运行独立的 AbortController；cancel 只影响当前运行。
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    const c = controllerRef.current;
    if (c) {
      c.abort();
      controllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setText('');
  }, []);

  const start = useCallback(async (chunks: AsyncIterable<string>): Promise<string> => {
    // 如果已有流在跑，先中止它（不触发 onError）。
    const prev = controllerRef.current;
    if (prev) {
      prev.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    // 新一轮：清理之前累积的文本 / 错误。
    setText('');
    setError(null);
    setIsStreaming(true);
    onStartRef.current?.();

    let accumulated = '';
    try {
      for await (const chunk of chunks) {
        if (controller.signal.aborted) {
          return accumulated;
        }
        accumulated += chunk;
        setText(accumulated);
        onUpdateRef.current?.(accumulated);
      }
      if (controller.signal.aborted) {
        return accumulated;
      }
      setIsStreaming(false);
      controllerRef.current = null;
      onCompleteRef.current?.(accumulated);
      return accumulated;
    } catch (err) {
      if (controller.signal.aborted) {
        // 被主动取消 — 不当作 error 抛给消费者。
        return accumulated;
      }
      setIsStreaming(false);
      setError(err);
      controllerRef.current = null;
      onErrorRef.current?.(err);
      return accumulated;
    }
  }, []);

  // 卸载时清理 in-flight 流，避免 setState after unmount。
  useEffect(() => {
    return () => {
      const c = controllerRef.current;
      if (c) c.abort();
    };
  }, []);

  return { text, isStreaming, error, start, cancel, reset };
}
