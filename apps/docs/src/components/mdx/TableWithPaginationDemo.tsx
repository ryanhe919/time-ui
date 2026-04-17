/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 TableWithPaginationDemo（Table + Pagination 完整组合）。
 */

'use client';

import { useMemo, useState } from 'react';
import { css } from '@emotion/react';
import { Pagination, Table } from '@/components/timeui-client';

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
}

const ALL_ORDERS: ReadonlyArray<Order> = Array.from({ length: 36 }, (_, i) => {
  const customers = ['Aurora Labs', 'Blue Wave', 'Crescent', 'Driftwood', 'Eden & Co.'];
  const statuses: Order['status'][] = ['paid', 'pending', 'refunded'];
  return {
    id: `ORD-${(1024 + i).toString()}`,
    customer: customers[i % customers.length]!,
    amount: 80 + ((i * 37) % 920),
    status: statuses[i % statuses.length]!,
  };
});

const STATUS_COLOR: Record<Order['status'], string> = {
  paid: 'var(--c-accent, #0071e3)',
  pending: 'var(--c-text-tertiary, #86868b)',
  refunded: 'var(--c-danger, #d4380d)',
};

export function TableWithPaginationDemo() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ALL_ORDERS.slice(start, start + pageSize);
  }, [page, pageSize]);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        max-width: 720px;
      `}
    >
      <Table<Order>
        aria-label="Recent orders"
        rowKey="id"
        columns={[
          { key: 'id', title: 'Order', width: 140 },
          { key: 'customer', title: 'Customer' },
          {
            key: 'amount',
            title: 'Amount',
            align: 'right',
            width: 120,
            render: (row) => `$${row.amount.toFixed(2)}`,
          },
          {
            key: 'status',
            title: 'Status',
            width: 120,
            render: (row) => (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: STATUS_COLOR[row.status],
                  textTransform: 'capitalize',
                }}
              >
                {row.status}
              </span>
            ),
          },
        ]}
        data={pageRows}
      />
      <div
        css={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <Pagination
          total={ALL_ORDERS.length}
          page={page}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          showSizeChanger
          pageSizeOptions={[5, 10, 20]}
        />
      </div>
    </div>
  );
}
