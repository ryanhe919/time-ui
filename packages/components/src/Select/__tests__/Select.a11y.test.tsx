/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Select 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Select } from '../';

const ITEMS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', isDisabled: true },
];

/**
 * popover 通过 portal 挂到 body，在测试里没有外层 landmark 包裹；
 * `region` 规则针对的是页面整体结构，与浮层本身的可访问性无关，故关闭。
 */
const PORTAL_AXE_OPTIONS = { rules: { region: { enabled: false } } };

describe('Select a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <Select label="Fruit" description="Pick one" items={ITEMS} defaultValue="a" />,
      { theme },
    );
    await expectA11y(container);
  });

  it.each([['light'], ['dark']] as const)(
    'remote loading state has zero axe violations in %s theme',
    async (theme) => {
      const { baseElement } = renderWithProviders(
        <Select aria-label="Users" searchMode="remote" isSearchable isLoading items={[]} />,
        { theme },
      );
      await userEvent.click(screen.getByRole('combobox'));
      await screen.findByRole('status');
      await expectA11y(baseElement, PORTAL_AXE_OPTIONS);
    },
  );

  it.each([['light'], ['dark']] as const)(
    'remote error + load-more state has zero axe violations in %s theme',
    async (theme) => {
      const { baseElement } = renderWithProviders(
        <Select
          aria-label="Users"
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
