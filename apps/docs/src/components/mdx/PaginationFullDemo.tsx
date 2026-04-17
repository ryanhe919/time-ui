/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 PaginationFullDemo（受控 page + pageSize + jumper 全功能）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Pagination } from '@/components/timeui-client';

export function PaginationFullDemo() {
  const [page, setPage] = useState(3);
  const [pageSize, setPageSize] = useState(20);
  const total = 248;

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
      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        siblingCount={1}
        showSizeChanger
        showQuickJumper
        pageSizeOptions={[10, 20, 50, 100]}
      />
      <div
        css={css`
          font-size: 12px;
          color: var(--c-text-tertiary);
          font-variant-numeric: tabular-nums;
        `}
      >
        page = {page} · pageSize = {pageSize} · total = {total}
      </div>
    </div>
  );
}
