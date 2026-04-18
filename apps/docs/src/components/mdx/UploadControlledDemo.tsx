/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：Upload 受控用法（value + onChange + useRef<UploadHandle>）。
 */

'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Upload, Button } from '@/components/timeui-client';
import type { UploadFile, UploadHandle } from '@timeui/react';

export function UploadControlledDemo() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const handleRef = useRef<UploadHandle>(null);
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale === 'zh';

  return (
    <div style={{ width: 'min(460px, 100%)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Upload ref={handleRef} multiple value={files} onChange={setFiles} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="bordered" size="sm" onClick={() => handleRef.current?.open()}>
          {isZh ? '打开文件选择器' : 'Open picker'}
        </Button>
        <Button variant="bordered" size="sm" onClick={() => handleRef.current?.clear()}>
          {isZh ? '清空' : 'Clear'}
        </Button>
      </div>
      <div
        style={{
          fontFamily: 'var(--docs-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
          fontSize: 12,
          color: 'var(--c-text-tertiary)',
          padding: '8px 12px',
          border: '1px dashed var(--c-hairline)',
          borderRadius: 8,
          background: 'var(--c-bg-secondary)',
        }}
      >
        {isZh ? '当前文件数' : 'files'} = {files.length}
      </div>
    </div>
  );
}
