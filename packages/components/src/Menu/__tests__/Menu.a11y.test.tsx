/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Menu 组件的可访问性（axe 0 violation）。
 */

import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Menu } from '../';
import type { MenuItemsEntry } from '../Menu.types';

// ────────────────────────────────────────────────────────────
// jsdom 兜底：Popover 的 getBoundingClientRect 在 jsdom 下返回 0，需要 mock。
// ────────────────────────────────────────────────────────────

const installRectMocks = (
  anchorRect = { top: 100, left: 50, width: 100, height: 40 },
  panelSize = { width: 220, height: 200 },
) => {
  const orig = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.tagName === 'BUTTON' && !this.closest?.('[data-timeui-menu]')) {
      return {
        top: anchorRect.top,
        left: anchorRect.left,
        width: anchorRect.width,
        height: anchorRect.height,
        right: anchorRect.left + anchorRect.width,
        bottom: anchorRect.top + anchorRect.height,
        x: anchorRect.left,
        y: anchorRect.top,
        toJSON: () => ({}),
      } as DOMRect;
    }
    if (this.getAttribute?.('role') === 'dialog') {
      return {
        top: 0,
        left: 0,
        width: panelSize.width,
        height: panelSize.height,
        right: panelSize.width,
        bottom: panelSize.height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return orig.call(this);
  });
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const SECTIONED: ReadonlyArray<MenuItemsEntry> = [
  {
    type: 'section',
    sectionKey: 'file',
    label: 'File',
    items: [
      { itemKey: 'new', label: 'New' },
      { itemKey: 'open', label: 'Open' },
    ],
  },
  {
    type: 'section',
    sectionKey: 'edit',
    label: 'Edit',
    items: [
      { itemKey: 'cut', label: 'Cut' },
      { itemKey: 'paste', label: 'Paste', isDisabled: true },
    ],
  },
];

describe('Menu — a11y', () => {
  it.each([['light'], ['dark']] as const)('zero axe violations in %s theme', async (theme) => {
    installRectMocks();
    const { baseElement } = renderWithProviders(
      <Menu
        trigger={<button type="button">Open</button>}
        items={SECTIONED}
        defaultOpen
        aria-label="actions"
      />,
      { theme },
    );
    await expectA11y(baseElement);
  });
});
