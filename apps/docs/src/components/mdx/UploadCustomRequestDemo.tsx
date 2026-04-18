/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：Upload 自定义 XHR 请求（不真正发，用 setTimeout 模拟进度 / 成功 / 失败）。
 */

'use client';

import { Upload } from '@/components/timeui-client';
import type { UploadRequest } from '@timeui/react';

// 模拟 XHR —— 每个文件 50% 概率走失败分支。
const fakeXhrRequest: UploadRequest = ({ file, signal }, handlers) => {
  let t1: ReturnType<typeof setTimeout>;
  let t2: ReturnType<typeof setTimeout>;
  let t3: ReturnType<typeof setTimeout>;
  t1 = setTimeout(() => handlers.onProgress(33), 300);
  t2 = setTimeout(() => handlers.onProgress(72), 700);
  t3 = setTimeout(() => {
    // 基于文件名简单决定成功 / 失败（稳定可复现）
    const shouldFail = file.name.length % 2 === 0;
    if (shouldFail) {
      handlers.onError(new Error('Network error (demo)'));
    } else {
      handlers.onSuccess({ url: '/uploads/fake/' + file.name });
    }
  }, 1100);

  signal.addEventListener('abort', () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  });

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  };
};

export function UploadCustomRequestDemo() {
  return (
    <div style={{ width: 'min(420px, 100%)' }}>
      <Upload multiple customRequest={fakeXhrRequest} />
    </div>
  );
}
