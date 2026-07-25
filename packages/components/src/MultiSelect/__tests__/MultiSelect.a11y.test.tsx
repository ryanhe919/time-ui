/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 验证 MultiSelect 模块的 a11y 行为（axe 0 violation）；
 *              覆盖默认 / disabled / 已选多项 + maxTagCount 折叠 / 打开 dropdown 四个场景，
 *              在 light + dark 双主题下分别跑一次。
 */

import { describe, test } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { MultiSelect } from '../';
import type { MultiSelectItem } from '../';

const ITEMS: MultiSelectItem[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Durian', isDisabled: true },
];

const themes = ['light', 'dark'] as const;

/**
 * popover 通过 portal 挂到 body，在测试里没有外层 landmark 包裹；
 * `region` 规则针对的是页面整体结构，与浮层本身的可访问性无关，故关闭。
 */
const PORTAL_AXE_OPTIONS = { rules: { region: { enabled: false } } };

describe('MultiSelect a11y', () => {
  test.each(themes)(
    'default + label/description has zero axe violations in %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        <MultiSelect label="Fruits" description="Pick a few" items={ITEMS} defaultValue={['a']} />,
        { theme },
      );
      await expectA11y(container);
    },
  );

  test.each(themes)('disabled MultiSelect has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <MultiSelect label="Fruits" items={ITEMS} defaultValue={['a']} isDisabled />,
      { theme },
    );
    await expectA11y(container);
  });

  test.each(themes)(
    'multi-selected with maxTagCount overflow has zero axe violations in %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        <MultiSelect
          label="Fruits"
          items={ITEMS}
          defaultValue={['a', 'b', 'c']}
          maxTagCount={1}
          isClearable
        />,
        { theme },
      );
      await expectA11y(container);
    },
  );

  test.each(themes)(
    'open dropdown with searchable + toolbar has zero axe violations in %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        <MultiSelect
          aria-label="Fruits"
          items={ITEMS}
          defaultValue={['a']}
          isSearchable
          showSelectAllInToolbar
        />,
        { theme },
      );
      await userEvent.click(screen.getByRole('combobox'));
      await screen.findByRole('listbox');
      await expectA11y(container);
    },
  );

  test.each(themes)('remote loading state has zero axe violations in %s theme', async (theme) => {
    const { baseElement } = renderWithProviders(
      <MultiSelect aria-label="Fruits" searchMode="remote" isSearchable isLoading items={[]} />,
      { theme },
    );
    await userEvent.click(screen.getByRole('combobox'));
    await screen.findByRole('status');
    await expectA11y(baseElement, PORTAL_AXE_OPTIONS);
  });

  test.each(themes)(
    'remote error + load-more state has zero axe violations in %s theme',
    async (theme) => {
      const { baseElement } = renderWithProviders(
        <MultiSelect
          aria-label="Fruits"
          searchMode="remote"
          isSearchable
          items={ITEMS}
          hasMore
          isLoadingMore
          loadError="Network down"
        />,
        { theme },
      );
      await userEvent.click(screen.getByRole('combobox'));
      await screen.findByRole('alert');
      await expectA11y(baseElement, PORTAL_AXE_OPTIONS);
    },
  );
});
