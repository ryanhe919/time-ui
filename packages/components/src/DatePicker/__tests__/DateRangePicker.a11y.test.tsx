/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 DateRangePicker 组件的 a11y 行为（axe 0 violation，含开/关两态）。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { DateRangePicker } from '../';

const installRectMocks = (
  anchorRect = { top: 100, left: 50, width: 320, height: 32 },
  panelSize = { width: 640, height: 360 },
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
    if (this.tagName === 'DIV' && this.getAttribute?.('data-timeui-daterangepicker') !== null) {
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
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DateRangePicker — a11y', () => {
  it('axe finds no violations when closed', async () => {
    const { container } = renderWithProviders(
      <DateRangePicker placeholder="Range" aria-label="r" />,
    );
    await act(async () => {});
    await expectA11y(container);
  });

  it('axe finds no violations when open with two months', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderWithProviders(
      <DateRangePicker
        defaultValue={{ start: new Date(2026, 3, 10), end: new Date(2026, 3, 20) }}
        aria-label="r"
      />,
    );
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    await expectA11y(container);
  });
});
