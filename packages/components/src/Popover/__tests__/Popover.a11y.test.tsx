/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Popover 组件的可访问性（axe 0 violation）。
 */

import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Popover } from '../';

// ────────────────────────────────────────────────────────────
// jsdom 兜底：getBoundingClientRect 在 jsdom 下返回全 0；Popover 的定位需要
// 真实尺寸才能验证 placement 切换后的差异。
// ────────────────────────────────────────────────────────────

const installRectAutoMocks = (
  anchorRect = { top: 100, left: 50, width: 100, height: 40 },
  panelSize = { width: 200, height: 100 },
) => {
  const orig = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.matches?.('[data-popover-anchor]') || this.tagName === 'BUTTON') {
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
    if (this.getAttribute?.('role') === 'dialog' || this.getAttribute?.('role') === 'tooltip') {
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

describe('Popover — a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    installRectAutoMocks();
    const { baseElement } = renderWithProviders(
      <Popover
        anchor={<button type="button">Trigger</button>}
        defaultIsOpen
        aria-label="info"
        header={<span>Title</span>}
        footer={<span>Footer</span>}
      >
        Some readable body content.
      </Popover>,
      { theme },
    );
    await expectA11y(baseElement);
  });
});
