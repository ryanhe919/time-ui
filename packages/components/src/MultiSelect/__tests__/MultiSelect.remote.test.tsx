/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 验证 MultiSelect 的后端搜索：托管 loadOptions、分页、chip 回显缓存、错误重试与受控远程模式。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { MultiSelect } from '../';
import type { AsyncOptionsRequest, MultiSelectItem } from '../../index';

const page = (prefix: string, from: number, count: number): MultiSelectItem[] =>
  Array.from({ length: count }, (_, i) => ({
    value: `${prefix}-${from + i}`,
    label: `${prefix} ${from + i}`,
  }));

async function openListbox() {
  await userEvent.click(screen.getByRole('combobox'));
}

describe('MultiSelect — managed remote search (loadOptions)', () => {
  it('loads the first page on open', async () => {
    const loadOptions = vi.fn(async () => ({ items: page('User', 1, 3), hasMore: false }));

    renderWithProviders(
      <MultiSelect aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openListbox();

    expect(await screen.findByRole('option', { name: /User 1/ })).toBeInTheDocument();
    expect(loadOptions).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '', page: 1, reason: 'open' }),
    );
  });

  it('sends the keyword to the backend without filtering locally', async () => {
    const loadOptions = vi.fn(async ({ keyword }: AsyncOptionsRequest) => ({
      // 后端故意返回与关键词无关的内容——前端不得再过滤
      items: keyword ? page('Result', 1, 2) : page('User', 1, 2),
      hasMore: false,
    }));

    renderWithProviders(
      <MultiSelect aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openListbox();
    await screen.findByRole('option', { name: /User 1/ });

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(screen.getByRole('option', { name: /Result 1/ })).toBeInTheDocument();
    expect(loadOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: 'zzz', reason: 'search' }),
    );
  });

  it('appends the next page on scroll', async () => {
    const loadOptions = vi.fn(async ({ page: p }: AsyncOptionsRequest) => ({
      items: page('User', p === 1 ? 1 : 4, 3),
      hasMore: p < 2,
    }));

    renderWithProviders(
      <MultiSelect aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openListbox();
    await screen.findByRole('option', { name: /User 1/ });

    fireEvent.scroll(screen.getByRole('listbox'));

    expect(await screen.findByRole('option', { name: /User 4/ })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(6);
  });

  it('keeps chip labels for selections that fall out of the result set', async () => {
    const loadOptions = vi.fn(async ({ keyword }: AsyncOptionsRequest) => ({
      items: keyword ? page('Other', 9, 1) : page('User', 1, 2),
      hasMore: false,
    }));

    renderWithProviders(
      <MultiSelect aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openListbox();
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByRole('option', { name: /User 2/ }));

    expect(screen.getByRole('combobox')).toHaveTextContent('User 2');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'z' } });
    await screen.findByRole('option', { name: /Other 9/ });

    // 选中项已不在当前结果里，chip 仍应显示 label 而不是裸 value
    expect(screen.getByRole('combobox')).toHaveTextContent('User 2');
    expect(screen.getByRole('combobox')).not.toHaveTextContent('User-2');
  });

  it('renders a failure with a working retry', async () => {
    const loadOptions = vi
      .fn<(req: AsyncOptionsRequest) => Promise<{ items: MultiSelectItem[]; hasMore: boolean }>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({ items: page('User', 1, 2), hasMore: false });

    renderWithProviders(
      <MultiSelect aria-label="users" isSearchable searchDebounce={0} loadOptions={loadOptions} />,
    );
    await openListbox();

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load options');
    expect(screen.queryByText('No results')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('option', { name: /User 1/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('MultiSelect — controlled remote mode', () => {
  it('drives loading / pagination from props', async () => {
    const onLoadMore = vi.fn();

    const { rerender } = renderWithProviders(
      <MultiSelect aria-label="users" searchMode="remote" isLoading items={[]} />,
    );
    await openListbox();
    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryAllByRole('option')).toHaveLength(0);

    rerender(
      <MultiSelect
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
      <MultiSelect
        aria-label="users"
        searchMode="remote"
        items={page('User', 1, 2)}
        hasMore
        isLoadingMore
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.getByText('Loading more…')).toBeInTheDocument();
  });

  it('skips local filtering in remote mode', async () => {
    const onSearch = vi.fn();
    renderWithProviders(
      <MultiSelect
        aria-label="users"
        isSearchable
        searchMode="remote"
        searchDebounce={0}
        onSearch={onSearch}
        items={page('User', 1, 2)}
      />,
    );
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nope' } });

    expect(screen.getAllByRole('option')).toHaveLength(2);
    await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith('nope'));
  });
});

describe('MultiSelect — local search regression', () => {
  it('still filters locally by default', async () => {
    renderWithProviders(
      <MultiSelect
        aria-label="users"
        isSearchable
        items={[...page('User', 1, 2), ...page('Bot', 1, 1)]}
      />,
    );
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bot' } });

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(screen.getByRole('option', { name: /Bot 1/ })).toBeInTheDocument();
  });
});
