/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 PaginationBasicDemo（受控 page state 切换）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Pagination } from '@/components/timeui-client';

export function PaginationBasicDemo() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = 87;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        font-family: var(--docs-sans);
      `}
    >
      <Pagination total={total} pageSize={pageSize} page={page} onPageChange={setPage} />
      <div
        css={css`
          font-size: 12px;
          color: var(--c-text-tertiary);
          font-variant-numeric: tabular-nums;
        `}
      >
        Showing {start}–{end} of {total}
      </div>
    </div>
  );
}
