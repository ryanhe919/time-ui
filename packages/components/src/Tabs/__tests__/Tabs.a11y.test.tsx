/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Tabs 组件的可访问性（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Tabs } from '../';
import type { TabItem } from '../Tabs.types';

const ITEMS: ReadonlyArray<TabItem> = [
  { key: 'profile', label: 'Profile', content: <p>Profile panel</p> },
  { key: 'settings', label: 'Settings', content: <p>Settings panel</p> },
  { key: 'billing', label: 'Billing', content: <p>Billing panel</p> },
];

describe('Tabs — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (variants + vertical)',
    async (theme) => {
      const { container } = renderWithProviders(
        <div>
          <Tabs aria-label="Underline" items={ITEMS} />
          <Tabs aria-label="Pills" items={ITEMS} variant="pills" />
          <Tabs aria-label="Bordered" items={ITEMS} variant="bordered" />
          <Tabs aria-label="Vertical" items={ITEMS} orientation="vertical" />
        </div>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
