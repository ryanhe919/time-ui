/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 验证 Select 的后端搜索：托管 loadOptions、分页触底、竞态丢弃、错误重试与受控远程模式。
 */

import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Select } from '../';
import type { AsyncOptionsRequest, SelectItem } from '../../index';

const page = (prefix: string, from: number, count: number): SelectItem[] =>
  Array.from({ length: count }, (_, i) => ({
    value: `${prefix}-${from + i}`,
    label: `${prefix} ${from + i}`,
  }));

async function openSelect(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox'));
}

describe('Select — managed remote search (loadOptions)', () => {
  it('loads the first page on open and renders the returned options', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async () => ({ items: page('User', 1, 3), hasMore: false }));

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);

    expect(await screen.findByRole('option', { name: 'User 1' })).toBeInTheDocument();
    expect(loadOptions).toHaveBeenCalledTimes(1);
    expect(loadOptions).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '', page: 1, pageSize: 20, reason: 'open' }),
    );
  });

  it('shows the loading placeholder while the first page is in flight', async () => {
    const user = userEvent.setup();
    let resolve!: (v: { items: SelectItem[]; hasMore: boolean }) => void;
    const loadOptions = vi.fn(
      () =>
        new Promise<{ items: SelectItem[]; hasMore: boolean }>((r) => {
          resolve = r;
        }),
    );

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);

    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
    // listbox 保留在 DOM 里（aria-controls 不能指向不存在的元素），只是标记为忙且没有 option
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');

    resolve({ items: page('User', 1, 2), hasMore: false });
    expect(await screen.findByRole('option', { name: 'User 1' })).toBeInTheDocument();
  });

  it('re-queries the backend when the keyword changes', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async ({ keyword }: AsyncOptionsRequest) => ({
      items: keyword ? page(keyword, 1, 2) : page('User', 1, 2),
      hasMore: false,
    }));

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);
    await screen.findByRole('option', { name: 'User 1' });

    await user.type(screen.getByRole('searchbox'), 'ab');

    await waitFor(() =>
      expect(loadOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({ keyword: 'ab', page: 1, reason: 'search' }),
      ),
    );
    expect(await screen.findByRole('option', { name: 'ab 1' })).toBeInTheDocument();
  });

  it('collapses a burst of keystrokes into a single request', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async () => ({ items: page('User', 1, 2), hasMore: false }));

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={80} loadOptions={loadOptions} />,
    );
    await openSelect(user);
    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1));

    // 同步连打三下：必须只落到一次后端请求
    const box = screen.getByRole('searchbox');
    fireEvent.change(box, { target: { value: 'a' } });
    fireEvent.change(box, { target: { value: 'ab' } });
    fireEvent.change(box, { target: { value: 'abc' } });
    expect(loadOptions).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(2));
    expect(loadOptions).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'abc' }));

    await new Promise((r) => setTimeout(r, 160));
    expect(loadOptions).toHaveBeenCalledTimes(2);
  });

  it('passes searchParams through and re-searches when they change', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async () => ({ items: page('User', 1, 2), hasMore: false }));

    const view = (dept: string) => (
      <Select
        aria-label="users"
        isSearchable
        searchDebounce={0}
        loadOptions={loadOptions}
        searchParams={{ dept }}
      />
    );

    const { rerender } = renderWithProviders(view('sales'));
    await openSelect(user);
    await screen.findByRole('option', { name: 'User 1' });
    expect(loadOptions).toHaveBeenCalledWith(
      expect.objectContaining({ params: { dept: 'sales' } }),
    );

    // 外部筛选条件变化（下拉仍然展开）应当重新从第一页搜索
    rerender(view('eng'));

    await waitFor(() =>
      expect(loadOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({ params: { dept: 'eng' }, page: 1, reason: 'params' }),
      ),
    );
  });

  it('appends the next page when the list scrolls to the bottom', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async ({ page: p }: AsyncOptionsRequest) => ({
      items: page('User', p === 1 ? 1 : 4, 3),
      hasMore: p < 2,
    }));

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);
    await screen.findByRole('option', { name: 'User 1' });

    fireEvent.scroll(screen.getByRole('listbox'));

    expect(await screen.findByRole('option', { name: 'User 4' })).toBeInTheDocument();
    // 两页拼接，不丢第一页
    expect(screen.getByRole('option', { name: 'User 1' })).toBeInTheDocument();
    expect(loadOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, reason: 'loadMore' }),
    );
  });

  it('stops paginating once hasMore is false', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async () => ({ items: page('User', 1, 3), hasMore: false }));

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);
    await screen.findByRole('option', { name: 'User 1' });

    fireEvent.scroll(screen.getByRole('listbox'));
    fireEvent.scroll(screen.getByRole('listbox'));

    expect(loadOptions).toHaveBeenCalledTimes(1);
  });

  it('drops a stale response that resolves after a newer one', async () => {
    const user = userEvent.setup();
    const resolvers: Array<(v: { items: SelectItem[]; hasMore: boolean }) => void> = [];
    const loadOptions = vi.fn(
      () =>
        new Promise<{ items: SelectItem[]; hasMore: boolean }>((r) => {
          resolvers.push(r);
        }),
    );

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);
    await user.type(screen.getByRole('searchbox'), 'b');
    await waitFor(() => expect(resolvers.length).toBe(2));

    // 后发的先回
    resolvers[1]!({ items: [{ value: 'fresh', label: 'Fresh' }], hasMore: false });
    expect(await screen.findByRole('option', { name: 'Fresh' })).toBeInTheDocument();

    // 先发的后回 —— 必须被丢弃
    resolvers[0]!({ items: [{ value: 'stale', label: 'Stale' }], hasMore: false });
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Stale' })).toBeNull();
    });
    expect(screen.getByRole('option', { name: 'Fresh' })).toBeInTheDocument();
  });

  it('surfaces a failure and retries on demand', async () => {
    const user = userEvent.setup();
    const loadOptions = vi
      .fn<(req: AsyncOptionsRequest) => Promise<{ items: SelectItem[]; hasMore: boolean }>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({ items: page('User', 1, 2), hasMore: false });

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load options');
    expect(screen.queryByText('No results')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('option', { name: 'User 1' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps the trigger label after the option leaves the remote result set', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async ({ keyword }: AsyncOptionsRequest) => ({
      items: keyword ? page('Other', 9, 1) : page('User', 1, 2),
      hasMore: false,
    }));

    renderWithProviders(
      <Select aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openSelect(user);
    await user.click(await screen.findByRole('option', { name: 'User 2' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('User 2');

    await openSelect(user);
    await user.type(screen.getByRole('searchbox'), 'z');
    await screen.findByRole('option', { name: 'Other 9' });

    // 选中项已不在当前结果里，trigger 仍应显示它的 label 而非 placeholder
    expect(screen.getByRole('combobox')).toHaveTextContent('User 2');
  });

  it('renders the label for a preset value from items while remote data is empty', async () => {
    const loadOptions = vi.fn(async () => ({ items: [], hasMore: false }));
    renderWithProviders(
      <Select
        aria-label="users"
        isSearchable
        searchDebounce={0}
        loadOptions={loadOptions}
        items={[{ value: 'u-7', label: 'Preselected user' }]}
        value="u-7"
      />,
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Preselected user');
  });
});

describe('Select — controlled remote mode', () => {
  it('skips local filtering and reports the debounced keyword', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    renderWithProviders(
      <Select
        aria-label="users"
        isSearchable
        searchMode="remote"
        searchDebounce={0}
        onSearch={onSearch}
        items={page('User', 1, 2)}
      />,
    );
    await openSelect(user);
    expect(onSearch).toHaveBeenCalledWith('');

    await user.type(screen.getByRole('searchbox'), 'zzz');

    // 后端说这两条就是结果，前端不得再过滤掉
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith('zzz'));
  });

  it('honours controlled searchValue + onSearchChange', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    const Harness = () => {
      const [kw, setKw] = useState('');
      return (
        <Select
          aria-label="users"
          isSearchable
          searchMode="remote"
          searchDebounce={0}
          searchValue={kw}
          onSearchChange={(v) => {
            onSearchChange(v);
            setKw(v);
          }}
          items={page('User', 1, 2)}
        />
      );
    };
    renderWithProviders(<Harness />);
    await openSelect(user);
    await user.type(screen.getByRole('searchbox'), 'hi');

    expect(onSearchChange).toHaveBeenLastCalledWith('hi');
    expect(screen.getByRole('searchbox')).toHaveValue('hi');
  });

  it('drives isLoading / hasMore / onLoadMore from props', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();

    const { rerender } = renderWithProviders(
      <Select aria-label="users" searchMode="remote" isLoading items={[]} />,
    );
    await openSelect(user);
    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');

    rerender(
      <Select
        aria-label="users"
        searchMode="remote"
        items={page('User', 1, 2)}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );
    fireEvent.scroll(screen.getByRole('listbox'));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(
      <Select
        aria-label="users"
        searchMode="remote"
        items={page('User', 1, 2)}
        hasMore
        isLoadingMore
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.getByText('Loading more…')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a controlled load error with a custom retry handler', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(
      <Select
        aria-label="users"
        searchMode="remote"
        items={[]}
        loadError="Network down"
        retryText="Try again"
        onRetry={onRetry}
      />,
    );
    await openSelect(user);

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('Select — local search still works', () => {
  it('filters locally by default', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Select
        aria-label="users"
        isSearchable
        items={[...page('User', 1, 2), ...page('Bot', 1, 1)]}
      />,
    );
    await openSelect(user);
    await user.type(screen.getByRole('searchbox'), 'bot');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Bot 1' })).toBeInTheDocument();
  });

  it('supports a custom filterOption', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Select
        aria-label="users"
        isSearchable
        items={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        filterOption={(input, item) => item.value === input}
      />,
    );
    await openSelect(user);
    await user.type(screen.getByRole('searchbox'), 'b');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
  });
});
