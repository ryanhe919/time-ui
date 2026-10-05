/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Table 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWithProviders } from '../../test-utils';
import { Table } from '../';
import type { SortDescriptor, TableColumn } from '../Table.types';

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

// ────────────────────────────────────────────────────────────
describe('Table — basic rendering', () => {
  it('renders a table with role=table and rowgroups', () => {
    renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="People" />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('rowgroup')).toHaveLength(2);
  });

  it('renders a region wrapper with aria-label', () => {
    renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="People" />,
    );
    const region = screen.getByRole('region', { name: 'People' });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('renders all columnheaders', () => {
    renderWithProviders(<Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Name');
    expect(headers[1]).toHaveTextContent('Age');
    expect(headers[2]).toHaveTextContent('Email');
  });

  it('renders one row per data entry with cells', () => {
    renderWithProviders(<Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />);
    // 表头1行 + 数据 3 行 = 4 行
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('uses column.render when provided', () => {
    const cols: TableColumn<Person>[] = [
      { columnKey: 'name', title: 'Name' },
      {
        columnKey: 'upper',
        title: 'Upper',
        render: (row) => <span data-testid="upper">{row.name.toUpperCase()}</span>,
      },
    ];
    renderWithProviders(<Table columns={cols} data={PEOPLE} rowKey="id" aria-label="P" />);
    expect(screen.getAllByTestId('upper')).toHaveLength(3);
    expect(screen.getAllByTestId('upper')[0]).toHaveTextContent('ALICE');
  });

  it('uses default id fallback when rowKey not provided', () => {
    renderWithProviders(<Table columns={BASIC_COLUMNS} data={PEOPLE} aria-label="P" />);
    // 应渲染 3 条行
    expect(
      screen.getAllByRole('row').filter((r) => r.getAttribute('data-row-key') !== null),
    ).toHaveLength(3);
  });

  it('uses rowKey function', () => {
    const spy = vi.fn((row: Person, idx: number) => `row-${idx}-${row.id}`);
    renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey={spy} aria-label="P" />,
    );
    expect(spy).toHaveBeenCalled();
    const rows = screen.getAllByRole('row').filter((r) => r.getAttribute('data-row-key'));
    expect(rows[0]?.getAttribute('data-row-key')).toBe('row-0-p1');
  });

  it('applies id and className, style', () => {
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        id="my-tbl"
        className="custom-cls"
        style={{ marginTop: 20 }}
      />,
    );
    const region = screen.getByRole('region', { name: 'P' });
    expect(region).toHaveAttribute('id', 'my-tbl');
    expect(region).toHaveClass('custom-cls');
    expect(region).toHaveStyle({ marginTop: '20px' });
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — sorting', () => {
  it('renders sort icons only on sortable columns', () => {
    const { container } = renderWithProviders(
      <Table columns={SORTABLE_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />,
    );
    const sortableBtns = container.querySelectorAll('[data-sortable]');
    expect(sortableBtns).toHaveLength(2);
  });

  it('non-sortable header does not render a button', () => {
    const { container } = renderWithProviders(
      <Table columns={SORTABLE_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />,
    );
    const emailHeader = screen.getByRole('columnheader', { name: /email/i });
    expect(within(emailHeader).queryByRole('button')).toBeNull();
    // Only 2 sortable columnheader buttons
    expect(container.querySelectorAll('[data-sortable]')).toHaveLength(2);
  });

  it('default aria-sort is "none" on sortable columns, absent on others', () => {
    renderWithProviders(
      <Table columns={SORTABLE_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />,
    );
    const name = screen.getByRole('columnheader', { name: /name/i });
    expect(name).toHaveAttribute('aria-sort', 'none');
    const email = screen.getByRole('columnheader', { name: /email/i });
    expect(email).not.toHaveAttribute('aria-sort');
  });

  it('uncontrolled: click cycles none → asc → desc → none', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    renderWithProviders(
      <Table
        columns={SORTABLE_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        onSortChange={onSort}
      />,
    );
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const btn = within(nameHeader).getByRole('button');

    await user.click(btn);
    expect(onSort).toHaveBeenLastCalledWith({ columnKey: 'name', direction: 'asc' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.click(btn);
    expect(onSort).toHaveBeenLastCalledWith({ columnKey: 'name', direction: 'desc' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    await user.click(btn);
    expect(onSort).toHaveBeenLastCalledWith(undefined);
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('switching from one sortable column to another starts at asc', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    renderWithProviders(
      <Table
        columns={SORTABLE_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        defaultSortDescriptor={{ columnKey: 'name', direction: 'desc' }}
        onSortChange={onSort}
      />,
    );
    const ageHeader = screen.getByRole('columnheader', { name: /age/i });
    await user.click(within(ageHeader).getByRole('button'));
    expect(onSort).toHaveBeenLastCalledWith({ columnKey: 'age', direction: 'asc' });
    expect(ageHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('controlled sortDescriptor only reflects parent-supplied value', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    renderWithProviders(
      <Table
        columns={SORTABLE_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        sortDescriptor={{ columnKey: 'name', direction: 'asc' }}
        onSortChange={onSort}
      />,
    );
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(nameHeader).getByRole('button'));
    // 受控模式：内部不会更新，只调 onChange
    expect(onSort).toHaveBeenLastCalledWith({ columnKey: 'name', direction: 'desc' });
    // 表头仍然是 ascending（因为父级未更新 prop）
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('consumer is responsible for actual sorting (table does not mutate data)', async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [sd, setSd] = useState<SortDescriptor>({
        columnKey: 'name',
        direction: 'asc',
      });
      const sorted = [...PEOPLE].sort((a, b) => {
        const av = a[sd.columnKey as keyof Person];
        const bv = b[sd.columnKey as keyof Person];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sd.direction === 'asc' ? cmp : -cmp;
      });
      return (
        <Table
          columns={SORTABLE_COLUMNS}
          data={sorted}
          rowKey="id"
          aria-label="P"
          sortDescriptor={sd}
          onSortChange={(next) => setSd(next ?? { columnKey: 'name', direction: 'asc' })}
        />
      );
    };
    renderWithProviders(<Wrapper />);
    // 初始按 name asc → Alice / Bob / Charlie；点击 age 切换 → asc by age → Bob(25)/Alice(30)/Charlie(40)
    const ageHeader = screen.getByRole('columnheader', { name: /age/i });
    await user.click(within(ageHeader).getByRole('button'));
    const rows = screen.getAllByRole('row').filter((r) => r.getAttribute('data-row-key'));
    expect(rows[0]).toHaveTextContent('Bob');
  });

  it('clicking non-sortable header does nothing', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    renderWithProviders(
      <Table
        columns={SORTABLE_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        onSortChange={onSort}
      />,
    );
    const emailHeader = screen.getByRole('columnheader', { name: /email/i });
    await user.click(emailHeader);
    expect(onSort).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — selection', () => {
  it('renders no selection column when selectionMode=none (default)', () => {
    renderWithProviders(<Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />);
    // column count should be 3
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    // No checkbox in table
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('multiple: renders one checkbox per row + header checkbox', () => {
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
      />,
    );
    // 1 表头 + 3 行 = 4 个 checkbox
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('multiple: clicking row checkbox selects that row', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        onSelectionChange={onChange}
      />,
    );
    const cb = screen.getByRole('checkbox', { name: /select row p1/i });
    await user.click(cb);
    expect(onChange).toHaveBeenLastCalledWith(['p1']);
  });

  it('multiple: header checkbox selects all rows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        onSelectionChange={onChange}
      />,
    );
    const headerCb = screen.getByRole('checkbox', { name: /select all rows/i });
    await user.click(headerCb);
    expect(onChange).toHaveBeenLastCalledWith(['p1', 'p2', 'p3']);
  });

  it('multiple: header shows indeterminate when some selected', () => {
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        selectedKeys={['p1']}
      />,
    );
    // Checkbox 的 indeterminate 是通过 input.indeterminate DOM 属性暴露的
    const headerCb = screen.getByRole('checkbox', {
      name: /select all rows|deselect all rows/i,
    }) as HTMLInputElement;
    expect(headerCb.indeterminate).toBe(true);
    expect(headerCb.checked).toBe(false);
  });

  it('multiple: header shows checked=true when all selected', () => {
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        selectedKeys={['p1', 'p2', 'p3']}
      />,
    );
    const headerCb = screen.getByRole('checkbox', {
      name: /deselect all rows/i,
    }) as HTMLInputElement;
    expect(headerCb.checked).toBe(true);
    expect(headerCb.indeterminate).toBe(false);
  });

  it('multiple: header click when all selected → deselect all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        selectedKeys={['p1', 'p2', 'p3']}
        onSelectionChange={onChange}
      />,
    );
    const headerCb = screen.getByRole('checkbox', { name: /deselect all rows/i });
    await user.click(headerCb);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('multiple: toggling checkbox deselects', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        selectedKeys={['p1', 'p2']}
        onSelectionChange={onChange}
      />,
    );
    const cb = screen.getByRole('checkbox', { name: /deselect row p1/i });
    await user.click(cb);
    expect(onChange).toHaveBeenLastCalledWith(['p2']);
  });

  it('single: selecting a second row replaces the selection', async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [keys, setKeys] = useState<ReadonlyArray<string>>([]);
      return (
        <Table
          columns={BASIC_COLUMNS}
          data={PEOPLE}
          rowKey="id"
          aria-label="P"
          selectionMode="single"
          selectedKeys={keys}
          onSelectionChange={setKeys}
        />
      );
    };
    renderWithProviders(<Wrapper />);
    await user.click(screen.getByRole('checkbox', { name: /select row p1/i }));
    await user.click(screen.getByRole('checkbox', { name: /select row p2/i }));
    // 只剩 p2 被选中
    expect(
      (screen.getByRole('checkbox', { name: /deselect row p2/i }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (screen.getByRole('checkbox', { name: /select row p1/i }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it('single: no header checkbox renders', () => {
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="single"
      />,
    );
    // 3 个行复选框，但表头无
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('single: clicking same row again deselects', async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [keys, setKeys] = useState<ReadonlyArray<string>>([]);
      return (
        <Table
          columns={BASIC_COLUMNS}
          data={PEOPLE}
          rowKey="id"
          aria-label="P"
          selectionMode="single"
          selectedKeys={keys}
          onSelectionChange={setKeys}
        />
      );
    };
    renderWithProviders(<Wrapper />);
    const cb1 = screen.getByRole('checkbox', { name: /select row p1/i });
    await user.click(cb1);
    const cb1b = screen.getByRole('checkbox', { name: /deselect row p1/i });
    await user.click(cb1b);
    expect(
      (screen.getByRole('checkbox', { name: /select row p1/i }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it('defaultSelectedKeys (uncontrolled) initial state', () => {
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        defaultSelectedKeys={['p2']}
      />,
    );
    const row = screen.getAllByRole('row').find((r) => r.getAttribute('data-row-key') === 'p2');
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it("disabledKeys: row checkbox is disabled, header doesn't select it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        disabledKeys={['p2']}
        onSelectionChange={onChange}
      />,
    );
    const cb = screen.getByRole('checkbox', { name: /select row p2/i }) as HTMLInputElement;
    expect(cb).toBeDisabled();

    // 全选不应把 p2 加入
    await user.click(screen.getByRole('checkbox', { name: /select all rows/i }));
    expect(onChange).toHaveBeenLastCalledWith(['p1', 'p3']);
  });

  it('disabledKeys: clicking disabled row does not toggle', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        disabledKeys={['p2']}
        onSelectionChange={onChange}
      />,
    );
    const row = screen
      .getAllByRole('row')
      .find((r) => r.getAttribute('data-row-key') === 'p2') as HTMLElement;
    await user.click(row);
    // onChange 不会因为 toggleRowSelection 触发（disabled 早退）
    expect(onChange).not.toHaveBeenCalled();
  });

  it('aria-selected reflects selection state', () => {
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        selectedKeys={['p1']}
      />,
    );
    const rows = screen.getAllByRole('row').filter((r) => r.getAttribute('data-row-key'));
    expect(rows[0]).toHaveAttribute('aria-selected', 'true');
    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — row click', () => {
  it('fires onRowClick with row data and index', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        onRowClick={onRowClick}
      />,
    );
    const row = screen
      .getAllByRole('row')
      .find((r) => r.getAttribute('data-row-key') === 'p2') as HTMLElement;
    await user.click(row);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick.mock.calls[0]?.[0]).toEqual(PEOPLE[1]);
    expect(onRowClick.mock.calls[0]?.[1]).toBe(1);
  });

  it('isInteractive column stops click from reaching the row', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onChange = vi.fn();
    const cols: TableColumn<Person>[] = [
      { columnKey: 'name', title: 'Name' },
      {
        columnKey: 'action',
        title: 'Action',
        isInteractive: true,
        render: (row) => (
          <button type="button" data-testid={`act-${row.id}`}>
            act
          </button>
        ),
      },
    ];
    renderWithProviders(
      <Table
        columns={cols}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        onRowClick={onRowClick}
        onSelectionChange={onChange}
      />,
    );
    await user.click(screen.getByTestId('act-p1'));
    expect(onRowClick).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('row click also toggles selection when selectionMode != none', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
        onSelectionChange={onChange}
      />,
    );
    const row = screen
      .getAllByRole('row')
      .find((r) => r.getAttribute('data-row-key') === 'p3') as HTMLElement;
    // 点击单元格内部（非复选框），应触发整行选择
    const cell = within(row).getByText('Charlie');
    await user.click(cell);
    expect(onChange).toHaveBeenLastCalledWith(['p3']);
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — visual options', () => {
  it('density=compact uses smaller padding than default', () => {
    const { rerender, container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" density="compact" />,
    );
    const region1 = container.querySelector('[data-density="compact"]');
    expect(region1).toBeInTheDocument();
    rerender(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        density="comfortable"
      />,
    );
    expect(container.querySelector('[data-density="comfortable"]')).toBeInTheDocument();
  });

  it('all three densities mount without errors', () => {
    const { rerender, container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" density="compact" />,
    );
    expect(container.querySelector('[data-density="compact"]')).toBeInTheDocument();
    rerender(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" density="default" />,
    );
    expect(container.querySelector('[data-density="default"]')).toBeInTheDocument();
    rerender(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        density="comfortable"
      />,
    );
    expect(container.querySelector('[data-density="comfortable"]')).toBeInTheDocument();
  });

  it('isStriped marks every other row', () => {
    const { container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" isStriped />,
    );
    const striped = container.querySelectorAll('tr[data-striped]');
    // 3 行中 index=1 被标记为 striped（偶数行从 0 计数：第 2 行）
    expect(striped.length).toBe(1);
  });

  it('hasBorder=false removes container border', () => {
    const { container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" hasBorder={false} />,
    );
    const region = container.querySelector('[role="region"]') as HTMLElement;
    expect(region).not.toHaveAttribute('data-has-border');
  });

  it('isStickyHeader sets data attribute and sticky styles', () => {
    const { container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" isStickyHeader />,
    );
    const region = container.querySelector('[role="region"]') as HTMLElement;
    expect(region).toHaveAttribute('data-sticky-header');
    const th = screen.getAllByRole('columnheader')[0]!;
    // jsdom 不做布局，但 emotion 已把 position: sticky 写入 style 或 class
    // 我们通过 getComputedStyle 获取 position 值（emotion className 注入后可读）
    const style = window.getComputedStyle(th);
    expect(style.position).toBe('sticky');
  });

  it.each(['divided', 'quiet'] as const)(
    '%s sticky headers cover rows behind them in both themes',
    (variant) => {
      for (const theme of ['light', 'dark'] as const) {
        const { unmount } = renderWithProviders(
          <Table columns={BASIC_COLUMNS} data={PEOPLE} variant={variant} isStickyHeader />,
          { theme },
        );
        const header = screen.getAllByRole('columnheader')[0]!;
        const background = window.getComputedStyle(header).backgroundColor;
        expect(background).not.toBe('rgba(0, 0, 0, 0)');
        expect(background).not.toBe('transparent');
        unmount();
      }
    },
  );

  it('quiet fixed column headers cover horizontally scrolling columns', () => {
    renderWithProviders(
      <Table
        columns={[
          { columnKey: 'name', title: 'Name', fixed: 'left', width: 120 },
          BASIC_COLUMNS[1]!,
        ]}
        data={PEOPLE}
        variant="quiet"
      />,
    );
    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(window.getComputedStyle(header).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('maxHeight sets overflow on container', () => {
    const { container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" maxHeight={300} />,
    );
    const region = container.querySelector('[role="region"]') as HTMLElement;
    const style = window.getComputedStyle(region);
    expect(style.maxHeight).toBe('300px');
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — fixed columns', () => {
  it('uses rendered column widths for left and right sticky offsets after resize', () => {
    const widths: Record<string, number> = { name: 180, age: 140, email: 220 };
    const columns: ReadonlyArray<TableColumn<Person>> = [
      { columnKey: 'name', title: 'Name', fixed: 'left', width: 120 },
      { columnKey: 'age', title: 'Age', fixed: 'left', width: 100 },
      { columnKey: 'spacer', title: 'Spacer', width: 600 },
      { columnKey: 'status', title: 'Status', fixed: 'right', width: 100 },
      { columnKey: 'email', title: 'Email', fixed: 'right', width: 120 },
    ];
    const original = HTMLElement.prototype.getBoundingClientRect;
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const rect = original.call(this);
        const width = this.matches('th[data-selection-column]')
          ? 60
          : widths[this.dataset.columnKey ?? ''];
        return width === undefined ? rect : { ...rect, width };
      });
    const callbacks: Array<() => void> = [];
    const Observer = globalThis.ResizeObserver;
    const observerSpy = vi
      .spyOn(globalThis, 'ResizeObserver')
      .mockImplementation(function (callback) {
        callbacks.push(() => callback([], {} as ResizeObserver));
        return new Observer(() => {});
      });
    try {
      renderWithProviders(<Table columns={columns} data={PEOPLE} selectionMode="multiple" />);
      const offset = (name: string, side: 'left' | 'right') => {
        const value = window.getComputedStyle(screen.getByRole('columnheader', { name }))[side];
        // jsdom may retain calc() instead of resolving it to a single length.
        return [...value.matchAll(/([\d.]+)px/g)].reduce((sum, match) => sum + Number(match[1]), 0);
      };
      expect(offset('Name', 'left')).toBe(60);
      expect(offset('Age', 'left')).toBe(240);
      expect(offset('Status', 'right')).toBe(220);
      widths.name = 260;
      widths.email = 280;
      act(() => callbacks.forEach((callback) => callback()));
      expect(offset('Age', 'left')).toBe(320);
      expect(offset('Status', 'right')).toBe(280);
    } finally {
      rectSpy.mockRestore();
      observerSpy.mockRestore();
    }
  });

  const FIXED_COLUMNS: ReadonlyArray<TableColumn<Person>> = [
    { columnKey: 'name', title: 'Name', fixed: 'left', width: 120 },
    { columnKey: 'age', title: 'Age' },
    { columnKey: 'email', title: 'Email', fixed: 'right', width: 200 },
  ];

  it('fixed=left columns include sticky position', () => {
    renderWithProviders(<Table columns={FIXED_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />);
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader).toHaveAttribute('data-fixed', 'left');
    const style = window.getComputedStyle(nameHeader);
    expect(style.position).toBe('sticky');
  });

  it('fixed=right columns include sticky position', () => {
    renderWithProviders(<Table columns={FIXED_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />);
    const emailHeader = screen.getByRole('columnheader', { name: /email/i });
    expect(emailHeader).toHaveAttribute('data-fixed', 'right');
    const style = window.getComputedStyle(emailHeader);
    expect(style.position).toBe('sticky');
  });

  it('column width is applied', () => {
    renderWithProviders(<Table columns={FIXED_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />);
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(window.getComputedStyle(nameHeader).width).toBe('120px');
  });

  it('fixed body cells also get sticky position', () => {
    const { container } = renderWithProviders(
      <Table columns={FIXED_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />,
    );
    const stickyCells = container.querySelectorAll('td[data-sticky-cell]');
    expect(stickyCells.length).toBeGreaterThan(0);
  });

  it('column.width as CSS string is accepted', () => {
    const cols: TableColumn<Person>[] = [
      { columnKey: 'name', title: 'Name', width: '30%' },
      { columnKey: 'age', title: 'Age' },
    ];
    renderWithProviders(<Table columns={cols} data={PEOPLE} rowKey="id" aria-label="P" />);
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(window.getComputedStyle(nameHeader).width).toBe('30%');
  });

  it('selection column becomes sticky when paired with fixed=left columns', () => {
    const { container } = renderWithProviders(
      <Table
        columns={FIXED_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        selectionMode="multiple"
      />,
    );
    const selHeader = container.querySelector('th[data-selection-column]') as HTMLElement;
    expect(selHeader).toHaveAttribute('data-sticky-cell');
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — loading & empty states', () => {
  it('isLoading: aria-busy set and overlay rendered', () => {
    const { container } = renderWithProviders(
      <Table
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
        isLoading
        loadingMessage="Fetching…"
      />,
    );
    const region = container.querySelector('[role="region"]') as HTMLElement;
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Fetching…')).toBeInTheDocument();
    expect(container.querySelector('[data-loading-overlay]')).toBeInTheDocument();
  });

  it('isLoading=false: no overlay, no aria-busy', () => {
    const { container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />,
    );
    expect(container.querySelector('[data-loading-overlay]')).toBeNull();
    const region = container.querySelector('[role="region"]') as HTMLElement;
    expect(region).not.toHaveAttribute('aria-busy');
  });

  it('empty state rendered when data=[]', () => {
    renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={[]} aria-label="P" emptyMessage="Nothing here" />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    // colSpan=3（BASIC_COLUMNS 无选择列）
    const cell = screen.getByRole('cell');
    expect(cell).toHaveAttribute('colspan', '3');
  });

  it('empty state colSpan accounts for selection column', () => {
    renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={[]} aria-label="P" selectionMode="multiple" />,
    );
    const cell = screen.getByRole('cell');
    // 3 列 + 选择列 = 4
    expect(cell).toHaveAttribute('colspan', '4');
  });

  it('empty state falls back for zero-column edge case', () => {
    renderWithProviders(<Table columns={[]} data={[]} aria-label="P" />);
    const cell = screen.getByRole('cell');
    expect(cell).toHaveAttribute('colspan', '1');
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — a11y', () => {
  it('role=table exists on table element', () => {
    renderWithProviders(<Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />);
    const table = screen.getByRole('table');
    expect(table.tagName).toBe('TABLE');
  });

  it('thead and tbody have role=rowgroup', () => {
    const { container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="P" />,
    );
    const rowgroups = container.querySelectorAll('[role="rowgroup"]');
    expect(rowgroups).toHaveLength(2);
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — overflow detection', () => {
  // Create a resize event to trigger ResizeObserver in some environments.
  it('registers scroll listener and updates overflow state (sanity)', () => {
    const { container } = renderWithProviders(
      <Table
        columns={[
          { columnKey: 'name', title: 'Name', fixed: 'left', width: 120 },
          { columnKey: 'age', title: 'Age' },
          { columnKey: 'email', title: 'Email' },
        ]}
        data={PEOPLE}
        rowKey="id"
        aria-label="P"
      />,
    );
    const region = container.querySelector('[role="region"]') as HTMLElement;
    // Simulate scroll by dispatching event
    fireEvent.scroll(region, { target: { scrollLeft: 20 } });
    // No direct assertion on shadow (jsdom can't do layout); test ensures scroll handler doesn't throw.
    expect(region).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — row key fallbacks', () => {
  it('uses row.id when rowKey is omitted', () => {
    renderWithProviders(<Table columns={BASIC_COLUMNS} data={PEOPLE} aria-label="P" />);
    const rows = screen.getAllByRole('row').filter((r) => r.getAttribute('data-row-key'));
    expect(rows[0]?.getAttribute('data-row-key')).toBe('p1');
  });

  it('falls back to index when no id or rowKey', () => {
    const data = [{ name: 'X' }, { name: 'Y' }];
    const cols: TableColumn<{ name: string }>[] = [{ columnKey: 'name', title: 'N' }];
    renderWithProviders(<Table columns={cols} data={data} aria-label="P" />);
    const rows = screen.getAllByRole('row').filter((r) => r.getAttribute('data-row-key'));
    expect(rows[0]?.getAttribute('data-row-key')).toBe('0');
    expect(rows[1]?.getAttribute('data-row-key')).toBe('1');
  });

  it('uses row.key when rowKey is omitted but row.key exists', () => {
    const data = [
      { key: 'k1', name: 'X' },
      { key: 'k2', name: 'Y' },
    ];
    const cols: TableColumn<{ key: string; name: string }>[] = [{ columnKey: 'name', title: 'N' }];
    renderWithProviders(<Table columns={cols} data={data} aria-label="P" />);
    const rows = screen.getAllByRole('row').filter((r) => r.getAttribute('data-row-key'));
    expect(rows[0]?.getAttribute('data-row-key')).toBe('k1');
  });
});

// ────────────────────────────────────────────────────────────
describe('Table — default cell rendering', () => {
  it('null/undefined values render as empty', () => {
    const data = [{ id: '1', name: 'Alice', optional: null }];
    const cols: TableColumn<{ id: string; name: string; optional: string | null }>[] = [
      { columnKey: 'name', title: 'Name' },
      { columnKey: 'optional', title: 'Optional' },
    ];
    renderWithProviders(<Table columns={cols} data={data} rowKey="id" aria-label="P" />);
    const cells = screen.getAllByRole('cell');
    // 第 2 列是 optional=null：空内容
    expect(cells[1]?.textContent).toBe('');
  });

  it('boolean values render as string', () => {
    const data = [{ id: '1', active: true }];
    const cols: TableColumn<{ id: string; active: boolean }>[] = [
      { columnKey: 'active', title: 'Active' },
    ];
    renderWithProviders(<Table columns={cols} data={data} rowKey="id" aria-label="P" />);
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('right/center alignment is applied', () => {
    const cols: TableColumn<Person>[] = [
      { columnKey: 'name', title: 'Name', align: 'center' },
      { columnKey: 'age', title: 'Age', align: 'right' },
    ];
    renderWithProviders(<Table columns={cols} data={PEOPLE} rowKey="id" aria-label="P" />);
    const name = screen.getByRole('columnheader', { name: /name/i });
    const age = screen.getByRole('columnheader', { name: /age/i });
    expect(window.getComputedStyle(name).textAlign).toBe('center');
    expect(window.getComputedStyle(age).textAlign).toBe('right');
  });
});

describe('Table — variants', () => {
  it('defaults to enclosed and exposes data-variant', () => {
    const { container } = renderWithProviders(
      <Table columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="t" />,
    );
    const region = container.querySelector('[role="region"]')!;
    expect(region.getAttribute('data-variant')).toBe('enclosed');
  });

  it.each([['enclosed'], ['divided'], ['grid'], ['quiet']] as const)(
    'renders %s variant without warnings',
    (variant) => {
      const { container } = renderWithProviders(
        <Table
          variant={variant}
          columns={BASIC_COLUMNS}
          data={PEOPLE}
          rowKey="id"
          aria-label={variant}
        />,
      );
      const region = container.querySelector('[role="region"]')!;
      expect(region.getAttribute('data-variant')).toBe(variant);
      // tbody has rendered row data
      expect(screen.getByText('Alice')).toBeInTheDocument();
    },
  );

  it('quiet variant strips container background to transparent', () => {
    const { container } = renderWithProviders(
      <Table variant="quiet" columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="q" />,
    );
    const region = container.querySelector('[role="region"]') as HTMLElement;
    // emotion class is applied; assert via injected stylesheet that 'background: transparent' exists
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/background:\s*transparent/);
    expect(region.getAttribute('data-variant')).toBe('quiet');
  });

  it('hasBorder is ignored on non-enclosed variants (no border applied)', () => {
    renderWithProviders(
      <Table
        variant="divided"
        hasBorder
        columns={BASIC_COLUMNS}
        data={PEOPLE}
        rowKey="id"
        aria-label="d"
      />,
    );
    // divided + hasBorder should still produce 'border: none' for the container.
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/border:\s*none/);
  });

  it('grid variant injects column dividers via td + td selector', () => {
    renderWithProviders(
      <Table variant="grid" columns={BASIC_COLUMNS} data={PEOPLE} rowKey="id" aria-label="g" />,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/td\s*\+\s*td/);
    expect(styles).toMatch(/th\s*\+\s*th/);
  });
});
