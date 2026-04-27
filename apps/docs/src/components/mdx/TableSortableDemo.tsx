/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 TableSortableDemo（受控 sortDescriptor + 实际排序）。
 */

'use client';

import { useMemo, useState } from 'react';
import { Table } from '@/components/timeui-client';
import type { SortDescriptor } from '@timeui/react';

interface Row {
  id: string;
  name: string;
  role: string;
  signups: number;
}

const ROWS: ReadonlyArray<Row> = [
  { id: '1', name: 'Ada Lovelace', role: 'Engineer', signups: 128 },
  { id: '2', name: 'Grace Hopper', role: 'Architect', signups: 312 },
  { id: '3', name: 'Linus Torvalds', role: 'Engineer', signups: 47 },
  { id: '4', name: 'Margaret Hamilton', role: 'Director', signups: 219 },
  { id: '5', name: 'Tim Berners-Lee', role: 'Architect', signups: 86 },
];

export function TableSortableDemo() {
  const [sort, setSort] = useState<SortDescriptor | undefined>({
    columnKey: 'signups',
    direction: 'desc',
  });

  const sortedData = useMemo(() => {
    if (!sort) return ROWS;
    const { columnKey, direction } = sort;
    return [...ROWS].sort((a, b) => {
      const av = a[columnKey as keyof Row];
      const bv = b[columnKey as keyof Row];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return direction === 'asc' ? cmp : -cmp;
    });
  }, [sort]);

  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <Table<Row>
        aria-label="Sortable users"
        columns={[
          { columnKey: 'name', title: 'Name', isSortable: true },
          { columnKey: 'role', title: 'Role', isSortable: true },
          { columnKey: 'signups', title: 'Sign-ups', align: 'right', isSortable: true, width: 120 },
        ]}
        data={sortedData}
        sortDescriptor={sort}
        onSortChange={setSort}
      />
    </div>
  );
}
