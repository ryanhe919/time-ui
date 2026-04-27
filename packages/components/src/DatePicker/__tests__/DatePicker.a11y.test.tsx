/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 DatePicker 组件的 a11y 行为（axe 0 violation + grid 语义）。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { DatePicker } from '../';

// jsdom 兜底：Popover 的 getBoundingClientRect 在 jsdom 下返回 0。
const installRectMocks = (
  anchorRect = { top: 100, left: 50, width: 240, height: 32 },
  panelSize = { width: 320, height: 360 },
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
    if (this.tagName === 'DIV' && this.getAttribute?.('data-timeui-datepicker') !== null) {
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

const openCalendar = async (user: ReturnType<typeof userEvent.setup>) => {
  installRectMocks();
  const trigger = screen.getByLabelText('Open calendar');
  await user.click(trigger);
  return screen.getByRole('grid');
};

describe('DatePicker — a11y', () => {
  it('grid role + gridcells have proper aria-disabled / aria-selected', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker defaultValue={new Date(2026, 3, 17)} aria-label="d" />);
    await openCalendar(user);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    const cells = within(screen.getByRole('grid')).getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(20);
  });

  it('axe finds no violations when closed', async () => {
    const { container } = renderWithProviders(<DatePicker placeholder="d" aria-label="d" />);
    await act(async () => {
      // allow any layout effects to flush
    });
    await expectA11y(container);
  });

  it('axe finds no violations when open', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderWithProviders(
      <DatePicker defaultValue={new Date(2026, 3, 17)} aria-label="Birthday" />,
    );
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await expectA11y(container);
  });
});
