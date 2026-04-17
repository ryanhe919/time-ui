/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 TableSelectionDemo（受控 multiple selection + 计数提示）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Table } from '@/components/timeui-client';

interface Row {
  id: string;
  file: string;
  size: string;
  updatedAt: string;
}

const ROWS: ReadonlyArray<Row> = [
  { id: 'a', file: 'design-tokens.json', size: '12 KB', updatedAt: '2 hours ago' },
  { id: 'b', file: 'theme-light.ts', size: '4.8 KB', updatedAt: 'yesterday' },
  { id: 'c', file: 'theme-dark.ts', size: '4.7 KB', updatedAt: 'yesterday' },
  { id: 'd', file: 'README.md', size: '2.1 KB', updatedAt: '3 days ago' },
];

export function TableSelectionDemo() {
  const [keys, setKeys] = useState<ReadonlyArray<string>>(['b']);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 640px;
      `}
    >
      <Table<Row>
        aria-label="Files"
        rowKey="id"
        selectionMode="multiple"
        selectedKeys={keys}
        onSelectionChange={setKeys}
        columns={[
          { key: 'file', title: 'File' },
          { key: 'size', title: 'Size', align: 'right', width: 100 },
          { key: 'updatedAt', title: 'Updated', width: 140 },
        ]}
        data={ROWS}
      />
      <div
        css={css`
          font-size: 12px;
          color: var(--c-text-tertiary);
          font-variant-numeric: tabular-nums;
        `}
      >
        {keys.length === 0 ? 'No row selected' : `${keys.length} selected: ${keys.join(', ')}`}
      </div>
    </div>
  );
}
