/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 文档站 MDX 示例组件 PdfViewerToolbarDemo（开启 download / print 按钮）。
 */

'use client';

import { css } from '@emotion/react';
import { PdfViewer } from '@timeui/react/pdf-viewer';

export function PdfViewerToolbarDemo() {
  return (
    <div
      css={css`
        width: min(720px, 100%);
      `}
    >
      <PdfViewer
        source="/sample.pdf"
        workerSrc="/pdf.worker.min.mjs"
        aria-label="PDF viewer with download and print"
        height={420}
        toolbar={{ download: true, print: true }}
      />
    </div>
  );
}
