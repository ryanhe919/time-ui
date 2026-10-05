/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 文档站 MDX 示例组件 PdfViewerBasicDemo（默认工具条 + 2 页 sample.pdf）。
 */

'use client';

import { css } from '@emotion/react';
import { PdfViewer } from '@timeui/react/pdf-viewer';

export function PdfViewerBasicDemo() {
  return (
    <div
      data-livedemo="custom"
      data-live-preview=""
      css={css`
        width: min(720px, 100%);
      `}
    >
      <PdfViewer
        source="/sample.pdf"
        workerSrc="/pdf.worker.min.mjs"
        aria-label="Basic PDF viewer demo"
        height={520}
      />
    </div>
  );
}
