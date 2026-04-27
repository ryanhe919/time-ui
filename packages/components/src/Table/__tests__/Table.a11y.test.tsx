/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Table 组件的可访问性（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Table } from '../';
import type { TableColumn } from '../Table.types';

interface Person {
  id: string;
  name: string;
  age: number;
  email: string;
}

const PEOPLE: ReadonlyArray<Person> = [
  { id: 'p1', name: 'Alice', age: 30, email: 'alice@example.com' },
  { id: 'p2', name: 'Bob', age: 25, email: 'bob@example.com' },
  { id: 'p3', name: 'Charlie', age: 40, email: 'charlie@example.com' },
];

const BASIC_COLUMNS: ReadonlyArray<TableColumn<Person>> = [
  { columnKey: 'name', title: 'Name' },
  { columnKey: 'age', title: 'Age', align: 'right' },
  { columnKey: 'email', title: 'Email' },
];

const SORTABLE_COLUMNS: ReadonlyArray<TableColumn<Person>> = [
  { columnKey: 'name', title: 'Name', isSortable: true },
  { columnKey: 'age', title: 'Age', isSortable: true },
  { columnKey: 'email', title: 'Email' },
];

describe('Table — a11y', () => {
  it('passes axe with multiple selection + sortable columns', async () => {
    const { container } = renderWithProviders(
      <Table
        columns={SORTABLE_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="People"
        selectionMode="multiple"
        defaultSelectedKeys={['p1']}
      />,
    );
    await expectA11y(container);
  });

  it('quiet variant has zero axe violations', async () => {
    const { container } = renderWithProviders(
      <Table
        variant="quiet"
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="quiet"
      />,
    );
    await expectA11y(container);
  });
});
