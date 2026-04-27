/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Pagination 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Pagination, buildPaginationItems } from '../';
import type { PaginationSize } from '../Pagination.types';

const getNav = () => screen.getByRole('navigation');

const PAGINATION_PAGE_NAME_RE = (page: number) => new RegExp(`^(Page ${page}|第 ${page} 页)$`);
const PREV_PAGE_RE = /^(Previous page|上一页)$/i;
const NEXT_PAGE_RE = /^(Next page|下一页)$/i;
const JUMPER_RE = /^(Go to page|跳至页码)$/i;
const SIZE_CHANGER_RE = /^(Items per page|每页条数)$/i;

const getPageButton = (page: number) =>
  screen.getByRole('button', { name: PAGINATION_PAGE_NAME_RE(page) });

const queryPageButton = (page: number) =>
  screen.queryByRole('button', { name: PAGINATION_PAGE_NAME_RE(page) });

describe('buildPaginationItems', () => {
  it('returns single page when totalPages <= 1', () => {
    expect(buildPaginationItems(1, 1, 1)).toEqual([{ type: 'page', page: 1 }]);
    expect(buildPaginationItems(0, 1, 1)).toEqual([{ type: 'page', page: 1 }]);
  });

  it('returns full sequence without ellipsis for short list', () => {
    // sibling=1, threshold = 5 + 2 = 7 → totalPages 7 直出
    const out = buildPaginationItems(7, 4, 1);
    expect(out).toEqual([
      { type: 'page', page: 1 },
      { type: 'page', page: 2 },
      { type: 'page', page: 3 },
      { type: 'page', page: 4 },
      { type: 'page', page: 5 },
      { type: 'page', page: 6 },
      { type: 'page', page: 7 },
    ]);
  });

  it('puts ellipsis on both sides when current page is in the middle', () => {
    // 100 页，page=50, sibling=1 → [1, ..., 49, 50, 51, ..., 100]
    const out = buildPaginationItems(100, 50, 1);
    expect(out).toEqual([
      { type: 'page', page: 1 },
      { type: 'ellipsis', key: 'ellipsis-start' },
      { type: 'page', page: 49 },
      { type: 'page', page: 50 },
      { type: 'page', page: 51 },
      { type: 'ellipsis', key: 'ellipsis-end' },
      { type: 'page', page: 100 },
    ]);
  });

  it('omits leading ellipsis when current page is near start', () => {
    // page=2, sibling=1 → left=2, right=3 → [1, 2, 3, ..., 100]
    const out = buildPaginationItems(100, 2, 1);
    expect(out[0]).toEqual({ type: 'page', page: 1 });
    expect(out[1]).toEqual({ type: 'page', page: 2 });
    expect(out[2]).toEqual({ type: 'page', page: 3 });
    expect(out[3]?.type).toBe('ellipsis');
    expect(out[out.length - 1]).toEqual({ type: 'page', page: 100 });
    // 不应在头部出现 ellipsis
    expect(out.findIndex((i) => i.type === 'ellipsis')).toBe(3);
  });

  it('omits trailing ellipsis when current page is near end', () => {
    // page=99, sibling=1 → left=98, right=99 → [1, ..., 98, 99, 100]
    const out = buildPaginationItems(100, 99, 1);
    expect(out[0]).toEqual({ type: 'page', page: 1 });
    expect(out[1]?.type).toBe('ellipsis');
    expect(out[out.length - 3]).toEqual({ type: 'page', page: 98 });
    expect(out[out.length - 2]).toEqual({ type: 'page', page: 99 });
    expect(out[out.length - 1]).toEqual({ type: 'page', page: 100 });
    // 仅一个 ellipsis
    expect(out.filter((i) => i.type === 'ellipsis')).toHaveLength(1);
  });

  it('clamps out-of-range page input', () => {
    // page=999 → 自动 clamp 至 totalPages=10
    const out = buildPaginationItems(10, 999, 1);
    expect(out[out.length - 1]).toEqual({ type: 'page', page: 10 });
  });

  it('handles negative siblingCount as 0', () => {
    const out = buildPaginationItems(100, 50, -3);
    // sibling=0：[1, ..., 50, ..., 100]
    expect(out).toEqual([
      { type: 'page', page: 1 },
      { type: 'ellipsis', key: 'ellipsis-start' },
      { type: 'page', page: 50 },
      { type: 'ellipsis', key: 'ellipsis-end' },
      { type: 'page', page: 100 },
    ]);
  });
});

describe('Pagination — rendering', () => {
  it('renders nav with default aria-label and a list of page buttons', () => {
    renderWithProviders(<Pagination total={50} />);
    const nav = getNav();
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', '分页');
    expect(within(nav).getByRole('list')).toBeInTheDocument();
    // total=50, pageSize=10 → 5 页
    expect(getPageButton(1)).toBeInTheDocument();
    expect(getPageButton(5)).toBeInTheDocument();
  });

  it('uses English defaults when locale=en', () => {
    renderWithProviders(<Pagination total={50} />, { config: { locale: 'en' } });
    const nav = getNav();
    expect(nav).toHaveAttribute('aria-label', 'Pagination');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('uses custom aria-label and id', () => {
    const { container } = renderWithProviders(
      <Pagination total={20} aria-label="Articles pagination" id="my-pager" />,
    );
    expect(getNav()).toHaveAttribute('aria-label', 'Articles pagination');
    expect(container.querySelector('#my-pager')).toBe(getNav());
  });

  it('marks the current page with aria-current="page"', () => {
    renderWithProviders(<Pagination total={50} defaultPage={3} />);
    expect(getPageButton(3)).toHaveAttribute('aria-current', 'page');
    expect(getPageButton(2)).not.toHaveAttribute('aria-current');
  });

  it('renders ellipsis spans for long lists', () => {
    const { container } = renderWithProviders(<Pagination total={1000} defaultPage={50} />);
    const ellipses = container.querySelectorAll('[data-slot="ellipsis"]');
    expect(ellipses.length).toBeGreaterThan(0);
    expect(ellipses[0]?.textContent).toContain('…');
  });

  it('clamps total to a single page when total is 0', () => {
    renderWithProviders(<Pagination total={0} />);
    expect(getPageButton(1)).toBeInTheDocument();
    expect(queryPageButton(2)).toBeNull();
  });

  it('uses ConfigProvider locale for default labels', () => {
    renderWithProviders(
      <Pagination total={100} defaultPage={2} showQuickJumper showSizeChanger />,
      { config: { locale: 'zh' } },
    );

    expect(screen.getByRole('navigation', { name: '分页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
    expect(screen.getByLabelText('跳至页码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第 2 页' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '每页条数' })).toBeInTheDocument();
  });
});

describe('Pagination — controlled / uncontrolled', () => {
  it('uncontrolled: defaultPage governs initial active page; clicks update internal state', async () => {
    renderWithProviders(<Pagination total={50} defaultPage={2} />);
    expect(getPageButton(2)).toHaveAttribute('aria-current', 'page');
    await userEvent.click(getPageButton(4));
    expect(getPageButton(4)).toHaveAttribute('aria-current', 'page');
    expect(getPageButton(2)).not.toHaveAttribute('aria-current');
  });

  it('controlled: onChange fires with the next page; ignored without parent update', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Pagination total={50} page={1} onPageChange={onChange} />);
    await userEvent.click(getPageButton(3));
    expect(onChange).toHaveBeenCalledWith(3);
    // 无父级更新 → 仍停留在 page=1
    expect(getPageButton(1)).toHaveAttribute('aria-current', 'page');
  });

  it('uncontrolled pageSize: defaultPageSize governs totalPages', () => {
    renderWithProviders(<Pagination total={50} defaultPageSize={25} />);
    // total=50, pageSize=25 → 2 页
    expect(getPageButton(2)).toBeInTheDocument();
    expect(queryPageButton(3)).toBeNull();
  });

  it('controlled pageSize: external value wins over defaults', () => {
    renderWithProviders(<Pagination total={100} pageSize={50} />);
    // total=100, pageSize=50 → 2 页
    expect(getPageButton(2)).toBeInTheDocument();
    expect(queryPageButton(3)).toBeNull();
  });
});

describe('Pagination — prev/next controls', () => {
  it('prev is disabled at page 1, next is disabled at last page', () => {
    // 用受控 props 触发 prev/next 边界态——非受控状态下 rerender 不会重置内部 page。
    const { rerender } = renderWithProviders(
      <Pagination total={30} page={1} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: PREV_PAGE_RE })).toBeDisabled();
    expect(screen.getByRole('button', { name: NEXT_PAGE_RE })).not.toBeDisabled();

    rerender(<Pagination total={30} page={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: PREV_PAGE_RE })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: NEXT_PAGE_RE })).toBeDisabled();
  });

  it('prev decrements page; next increments page', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Pagination total={50} defaultPage={3} onPageChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: NEXT_PAGE_RE }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    await userEvent.click(screen.getByRole('button', { name: PREV_PAGE_RE }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('clicking the active page is a no-op (no onChange)', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Pagination total={50} defaultPage={3} onPageChange={onChange} />);
    await userEvent.click(getPageButton(3));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hideControls=true: no prev/next buttons rendered', () => {
    renderWithProviders(<Pagination total={50} defaultPage={2} hideControls />);
    expect(screen.queryByRole('button', { name: PREV_PAGE_RE })).toBeNull();
    expect(screen.queryByRole('button', { name: NEXT_PAGE_RE })).toBeNull();
  });

  it('uses custom prev/next labels from props.labels', () => {
    renderWithProviders(
      <Pagination total={20} defaultPage={2} labels={{ prev: '上一页', next: '下一页' }} />,
    );
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
  });
});

describe('Pagination — siblingCount', () => {
  it('siblingCount=1 default produces ellipses on both sides for the middle', () => {
    const { container } = renderWithProviders(<Pagination total={1000} defaultPage={50} />);
    expect(container.querySelectorAll('[data-slot="ellipsis"]').length).toBe(2);
  });

  it('siblingCount=2 widens the visible window', () => {
    const { container } = renderWithProviders(
      <Pagination total={1000} defaultPage={50} siblingCount={2} />,
    );
    // page 48..52 都应显示
    [48, 49, 50, 51, 52].forEach((p) => {
      expect(queryPageButton(p)).toBeInTheDocument();
    });
    // ellipsis 仍然存在两侧
    expect(container.querySelectorAll('[data-slot="ellipsis"]').length).toBe(2);
  });

  it('short lists render no ellipsis at all', () => {
    const { container } = renderWithProviders(<Pagination total={50} defaultPage={3} />);
    expect(container.querySelectorAll('[data-slot="ellipsis"]').length).toBe(0);
  });
});

describe('Pagination — variant', () => {
  it('variant=simple renders summary instead of page list', () => {
    renderWithProviders(<Pagination total={100} defaultPage={3} variant="simple" />);
    // 没有 page 数字按钮
    expect(queryPageButton(1)).toBeNull();
    expect(queryPageButton(10)).toBeNull();
    // 但是有 prev/next + summary
    expect(screen.getByRole('button', { name: PREV_PAGE_RE })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: NEXT_PAGE_RE })).toBeInTheDocument();
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('variant=simple supports a custom summary renderer', () => {
    renderWithProviders(
      <Pagination
        total={100}
        defaultPage={2}
        variant="simple"
        labels={{ summary: (p, t) => `第 ${p} 页 / 共 ${t} 页` }}
      />,
    );
    expect(screen.getByText('第 2 页 / 共 10 页')).toBeInTheDocument();
  });

  it('variant=mini forces size=sm via data-size', () => {
    renderWithProviders(<Pagination total={50} variant="mini" size="lg" />);
    expect(getNav()).toHaveAttribute('data-size', 'sm');
    expect(getNav()).toHaveAttribute('data-variant', 'mini');
    // mini 同样使用 simple 布局
    expect(queryPageButton(2)).toBeNull();
  });

  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
    'renders size=%s without crashing',
    (size: PaginationSize) => {
      renderWithProviders(<Pagination total={120} defaultPage={2} size={size} />);
      expect(getNav()).toHaveAttribute('data-size', size);
    },
  );
});

describe('Pagination — isDisabled', () => {
  it('disables every button (page numbers, prev, next)', () => {
    renderWithProviders(<Pagination total={50} defaultPage={3} isDisabled />);
    const buttons = within(getNav()).getAllByRole('button');
    buttons.forEach((b) => expect(b).toBeDisabled());
    expect(getNav()).toHaveAttribute('data-disabled', 'true');
  });

  it('isDisabled blocks page change attempts', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination total={50} defaultPage={3} onPageChange={onChange} isDisabled />,
    );
    const target = getPageButton(4);
    await userEvent.click(target, { pointerEventsCheck: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Pagination — quickJumper', () => {
  it('renders a numeric input with a label and jumps on Enter', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination total={100} defaultPage={1} showQuickJumper onPageChange={onChange} />,
    );
    const input = screen.getByLabelText(JUMPER_RE);
    expect(input).toBeInTheDocument();
    await userEvent.type(input, '5');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('clamps over-range positive value to totalPages', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination total={100} defaultPage={1} showQuickJumper onPageChange={onChange} />,
    );
    const input = screen.getByLabelText(JUMPER_RE) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('clamps negative input to 1', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination total={100} defaultPage={5} showQuickJumper onPageChange={onChange} />,
    );
    const input = screen.getByLabelText(JUMPER_RE) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('Enter on empty / non-numeric value does nothing', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination total={100} defaultPage={3} showQuickJumper onPageChange={onChange} />,
    );
    const input = screen.getByLabelText(JUMPER_RE) as HTMLInputElement;
    // 空
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    // 空白
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    // 非数字
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('non-Enter key presses do not jump', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination total={100} defaultPage={3} showQuickJumper onPageChange={onChange} />,
    );
    const input = screen.getByLabelText(JUMPER_RE) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'a' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Enter to the same page is a no-op (no onChange)', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination total={100} defaultPage={5} showQuickJumper onPageChange={onChange} />,
    );
    const input = screen.getByLabelText(JUMPER_RE) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses the provided jumperLabel for label text and aria-label', () => {
    renderWithProviders(
      <Pagination total={100} showQuickJumper labels={{ jumperLabel: '跳到' }} />,
    );
    expect(screen.getByLabelText('跳到')).toBeInTheDocument();
  });

  it('jumper input is disabled when isDisabled is true', () => {
    renderWithProviders(<Pagination total={100} defaultPage={3} showQuickJumper isDisabled />);
    const input = screen.getByLabelText(JUMPER_RE) as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});

describe('Pagination — sizeChanger', () => {
  it('renders a Select using existing component (combobox role)', () => {
    renderWithProviders(<Pagination total={500} defaultPage={2} showSizeChanger />);
    const combobox = screen.getByRole('combobox', { name: SIZE_CHANGER_RE });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveTextContent('10 条/页');
  });

  it('changing pageSize calls onPageSizeChange and resets page to 1', async () => {
    const onPageSizeChange = vi.fn();
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination
        total={500}
        defaultPage={5}
        showSizeChanger
        onPageSizeChange={onPageSizeChange}
        onPageChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: SIZE_CHANGER_RE }));
    const opt = await screen.findByRole('option', { name: '50 条/页' });
    await userEvent.click(opt);
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('respects custom pageSizeOptions', async () => {
    renderWithProviders(<Pagination total={500} showSizeChanger pageSizeOptions={[5, 15, 30]} />);
    await userEvent.click(screen.getByRole('combobox', { name: SIZE_CHANGER_RE }));
    const listbox = await screen.findByRole('listbox');
    const labels = within(listbox)
      .getAllByRole('option')
      .map((o) => o.textContent?.trim());
    expect(labels).toEqual(['5 条/页', '15 条/页', '30 条/页']);
  });

  it('size=lg propagates to the inner Select', () => {
    renderWithProviders(<Pagination total={500} size="lg" showSizeChanger />);
    const combobox = screen.getByRole('combobox', { name: SIZE_CHANGER_RE });
    // Select 内部 wrapper data-size 透传——证明 size=lg 分支走通。
    const wrapper = combobox.closest('[data-size]') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute('data-size')).toBe('lg');
  });

  it('size=sm propagates to the inner Select', () => {
    renderWithProviders(<Pagination total={500} size="sm" showSizeChanger />);
    const combobox = screen.getByRole('combobox', { name: SIZE_CHANGER_RE });
    const wrapper = combobox.closest('[data-size]') as HTMLElement;
    expect(wrapper.getAttribute('data-size')).toBe('sm');
  });

  it('uses custom sizeChangerLabel when provided', () => {
    renderWithProviders(
      <Pagination total={500} showSizeChanger labels={{ sizeChangerLabel: 'Page size' }} />,
    );
    expect(screen.getByRole('combobox', { name: 'Page size' })).toBeInTheDocument();
  });
});

describe('Pagination — misc', () => {
  it('forwards ref to the nav element', () => {
    let captured: HTMLElement | null = null;
    renderWithProviders(
      <Pagination
        total={50}
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLElement);
    expect((captured as unknown as HTMLElement).tagName).toBe('NAV');
  });

  it('applies className and inline style', () => {
    renderWithProviders(
      <Pagination total={50} className="custom-pager" style={{ marginTop: 8 }} />,
    );
    const nav = getNav();
    expect(nav).toHaveClass('custom-pager');
    expect(nav.style.marginTop).toBe('8px');
  });

  it('exposes displayName as TimeUI.Pagination', () => {
    expect((Pagination as unknown as { displayName?: string }).displayName).toBe(
      'TimeUI.Pagination',
    );
  });

  it('ignores invalid pageSize and falls back to 10', () => {
    // 受控 pageSize=0 → safePageSize=10 → totalPages = 100/10 = 10
    renderWithProviders(<Pagination total={100} pageSize={0} />);
    expect(getPageButton(10)).toBeInTheDocument();
  });
});
