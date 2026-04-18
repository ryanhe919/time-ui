/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：Upload 的 maxSize + onReject，通过 Toast 反馈。
 */

'use client';

import { useParams } from 'next/navigation';
import { Upload, ToastProvider, useToast } from '@/components/timeui-client';
import type { ComponentProps } from 'react';

type OnReject = NonNullable<ComponentProps<typeof Upload>['onReject']>;
type Rejections = Parameters<OnReject>[0];

function Inner() {
  const toast = useToast();
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale === 'zh';

  const handleReject = (rejections: Rejections) => {
    for (const r of rejections) {
      toast.show({
        status: 'danger',
        title: isZh ? '上传被拒绝' : 'Upload rejected',
        description: r.message ?? `${r.file.name} (${r.reason})`,
      });
    }
  };

  return (
    <div style={{ width: 'min(420px, 100%)' }}>
      <Upload
        multiple
        maxSize={2 * 1024 * 1024}
        onReject={handleReject}
        description={isZh ? '单文件最大 2 MB。' : 'Max 2 MB per file.'}
      />
    </div>
  );
}

export function UploadRejectDemo() {
  return (
    <ToastProvider placement="top-right">
      <Inner />
    </ToastProvider>
  );
}
