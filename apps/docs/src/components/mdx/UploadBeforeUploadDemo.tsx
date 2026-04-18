/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：Upload 的 beforeUpload 自定义校验（禁名字带 "secret"）+ Toast 反馈。
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

  const beforeUpload = (file: File) => {
    return !/secret/i.test(file.name);
  };

  const handleReject = (rejections: Rejections) => {
    for (const r of rejections) {
      if (r.reason === 'before-upload') {
        toast.show({
          status: 'warning',
          title: isZh ? '文件名包含敏感词' : 'Filename blocked',
          description: r.file.name,
        });
      } else {
        toast.show({ status: 'danger', title: r.message ?? r.reason });
      }
    }
  };

  return (
    <div style={{ width: 'min(420px, 100%)' }}>
      <Upload
        multiple
        beforeUpload={beforeUpload}
        onReject={handleReject}
        description={
          isZh
            ? '示例：文件名包含 "secret"（大小写不敏感）会被拦下。'
            : 'Demo: any filename containing "secret" (case-insensitive) is blocked.'
        }
      />
    </div>
  );
}

export function UploadBeforeUploadDemo() {
  return (
    <ToastProvider placement="top-right">
      <Inner />
    </ToastProvider>
  );
}
