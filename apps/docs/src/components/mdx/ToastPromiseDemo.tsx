/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ToastPromiseDemo（演示 toast.promise() 流转）。
 */

'use client';

import { ToastProvider, useToast, Button } from '@/components/timeui-client';

function fakeUpload(shouldFail: boolean): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error('Network error'));
      else resolve({ url: 'https://cdn.example.com/file.png' });
    }, 1500);
  });
}

function Inner() {
  const toast = useToast();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button
        variant="solid"
        color="primary"
        size="sm"
        onClick={() =>
          toast.promise(fakeUpload(false), {
            loading: 'Uploading file…',
            success: (v) => `Uploaded — ${v.url}`,
            error: (e) => `Failed: ${(e as Error).message}`,
          })
        }
      >
        Upload (success)
      </Button>
      <Button
        variant="bordered"
        size="sm"
        onClick={() =>
          toast
            .promise(fakeUpload(true), {
              loading: 'Uploading file…',
              success: 'Uploaded',
              error: (e) => `Failed: ${(e as Error).message}`,
            })
            .catch(() => {})
        }
      >
        Upload (error)
      </Button>
    </div>
  );
}

export function ToastPromiseDemo() {
  return (
    <ToastProvider placement="bottom-right">
      <Inner />
    </ToastProvider>
  );
}
