/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 SegmentedControl 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { SegmentedControl } from '../';
import type { SegmentedControlOption } from '../SegmentedControl.types';

const RANGE_OPTIONS: ReadonlyArray<SegmentedControlOption> = [
  { value: '1d', label: '1D' },
  { value: '7d', label: '7D' },
  { value: '1m', label: '1M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

const ICON_OPTIONS: ReadonlyArray<SegmentedControlOption> = [
  { value: 'chats', label: 'Chats', icon: <span data-testid="icon-chats">💬</span> },
  { value: 'emails', label: 'Emails', icon: <span data-testid="icon-emails">✉️</span> },
];

describe('SegmentedControl a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (with label, icons, vertical)',
    async (theme) => {
      const { container } = renderWithProviders(
        <div>
          <SegmentedControl label="Date range" options={RANGE_OPTIONS} defaultValue="1d" />
          <SegmentedControl aria-label="Inbox" options={ICON_OPTIONS} defaultValue="chats" />
          <SegmentedControl
            aria-label="Vertical"
            options={RANGE_OPTIONS}
            defaultValue="1m"
            orientation="vertical"
          />
        </div>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
