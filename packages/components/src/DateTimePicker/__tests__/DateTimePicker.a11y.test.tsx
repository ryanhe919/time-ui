/**
 * @author Ryan He
 * @date 2026-04-24
 * @description 验证 DateTimePicker 的 a11y 行为（axe 0 violation，含开/关两态）。
 */

import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { DateTimePicker } from '../';

// jsdom 下 Popover 需要 getBoundingClientRect 兜底 —— 与 DatePicker 测试同手法。
const installRectMocks = (
  anchorRect = { top: 100, left: 50, width: 240, height: 32 },
  panelSize = { width: 560, height: 360 },
) => {
  const orig = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
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
    if (this.tagName === 'DIV' && this.getAttribute?.('data-timeui-datetimepicker') !== null) {
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
    return orig.call(this);
  });
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 3, 17, 10, 30, 45, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DateTimePicker — a11y', () => {
  it('closed state passes axe', async () => {
    const { container } = renderWithProviders(<DateTimePicker aria-label="dt" />);
    await expectA11y(container);
  });

  it('open state passes axe', async () => {
    installRectMocks();
    const { container } = renderWithProviders(
      <DateTimePicker defaultOpen aria-label="dt" showSecond isClearable />,
    );
    await expectA11y(container);
  });
});
