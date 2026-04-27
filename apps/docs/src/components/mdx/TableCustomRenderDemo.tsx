/**
 * @author Ryan He
 * @date 2026-04-17
 * @description Demo: Table 自定义 column.render —— 必须在 Client Component 内定义函数。
 */

'use client';

import { Table, Button } from '@/components/timeui-client';
import type { TableColumn } from '@timeui/react';

interface Row {
  id: number;
  name: string;
  status: 'active' | 'paused';
}

const DATA: Row[] = [
  { id: 1, name: 'Aurora Labs', status: 'active' },
  { id: 2, name: 'Blue Wave', status: 'paused' },
  { id: 3, name: 'Crescent', status: 'active' },
];

const COLUMNS: TableColumn<Row>[] = [
  { columnKey: 'name', title: 'Name' },
  {
    columnKey: 'status',
    title: 'Status',
    width: 120,
    render: (row) => (
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: row.status === 'active' ? '#0071e3' : '#86868b',
        }}
      >
        {row.status}
      </span>
    ),
  },
  {
    columnKey: 'actions',
    title: '',
    width: 100,
    align: 'right',
    isInteractive: true,
    render: (row) => (
      <Button size="sm" variant="ghost" onClick={() => alert(`Edit ${row.name}`)}>
        Edit
      </Button>
    ),
  },
];

export function TableCustomRenderDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <Table aria-label="Custom render" columns={COLUMNS} data={DATA} />
    </div>
  );
}
