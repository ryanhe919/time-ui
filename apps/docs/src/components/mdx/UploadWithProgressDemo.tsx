/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：Upload 模拟上传进度（setInterval 推 onProgress）。
 */

'use client';

import { Upload } from '@/components/timeui-client';
import type { UploadRequest } from '@timeui/react';

const simulatedRequest: UploadRequest = ({ signal }, handlers) => {
  let percent = 0;
  const timer = setInterval(() => {
    if (signal.aborted) {
      clearInterval(timer);
      return;
    }
    percent = Math.min(100, percent + 10);
    handlers.onProgress(percent);
    if (percent >= 100) {
      clearInterval(timer);
      handlers.onSuccess({ ok: true });
    }
  }, 160);

  return () => clearInterval(timer);
};

export function UploadWithProgressDemo() {
  return (
    <div style={{ width: 'min(420px, 100%)' }}>
      <Upload multiple customRequest={simulatedRequest} />
    </div>
  );
}
