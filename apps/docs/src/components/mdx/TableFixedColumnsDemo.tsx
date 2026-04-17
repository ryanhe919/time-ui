/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 TableFixedColumnsDemo（左/右固定列 + 横向滚动）。
 */

'use client';

import { Table } from '@/components/timeui-client';

interface Row {
  id: string;
  name: string;
  region: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  ytd: number;
}

const ROWS: ReadonlyArray<Row> = [
  { id: '1', name: 'Aurora Labs', region: 'North', q1: 128, q2: 142, q3: 196, q4: 211, ytd: 677 },
  { id: '2', name: 'Blue Wave', region: 'South', q1: 92, q2: 104, q3: 118, q4: 133, ytd: 447 },
  { id: '3', name: 'Crescent', region: 'East', q1: 64, q2: 71, q3: 88, q4: 99, ytd: 322 },
  { id: '4', name: 'Driftwood', region: 'West', q1: 156, q2: 178, q3: 201, q4: 244, ytd: 779 },
];

export function TableFixedColumnsDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <Table<Row>
        aria-label="Quarterly revenue"
        rowKey="id"
        columns={[
          { key: 'name', title: 'Account', width: 160, fixed: 'left' },
          { key: 'region', title: 'Region', width: 120 },
          { key: 'q1', title: 'Q1', align: 'right', width: 100 },
          { key: 'q2', title: 'Q2', align: 'right', width: 100 },
          { key: 'q3', title: 'Q3', align: 'right', width: 100 },
          { key: 'q4', title: 'Q4', align: 'right', width: 100 },
          { key: 'ytd', title: 'YTD', align: 'right', width: 110, fixed: 'right' },
        ]}
        data={ROWS}
      />
    </div>
  );
}
