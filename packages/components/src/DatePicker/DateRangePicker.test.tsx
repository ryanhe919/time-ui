/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 DateRangePicker 组件：受控/非受控、两次点击成 range、反向交换、hover preview、
 *              visibleMonths、presets、a11y。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { DateRangePicker } from './DateRangePicker';

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

const openCalendar = async (user: ReturnType<typeof userEvent.setup>) => {
  installRectMocks();
  const trigger = screen.getByLabelText('Open calendar');
  await user.click(trigger);
  return screen.getAllByRole('grid');
};

const findCellByDay = (grid: HTMLElement, day: number, currentMonth = true): HTMLElement => {
  const cells = within(grid).getAllByRole('gridcell');
  return cells.find((c) => {
    if (currentMonth && c.getAttribute('data-current-month') !== 'true') return false;
    return c.textContent?.trim() === String(day);
  })!;
};

// ────────────────────────────────────────────────────────────
// 渲染
// ────────────────────────────────────────────────────────────

describe('DateRangePicker — base rendering', () => {
  it('renders an input with placeholder + calendar trigger', () => {
    renderWithProviders(<DateRangePicker placeholder="Range" aria-label="r" />);
    expect(screen.getByPlaceholderText('Range')).toBeInTheDocument();
    expect(screen.getByLabelText('Open calendar')).toBeInTheDocument();
  });

  it('shows two grids when visibleMonths=2 (default)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker aria-label="r" />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  it('allows the popover panel to grow beyond the generic 320px cap', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker aria-label="r" />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByRole('dialog')).toHaveStyle({
      width: 'max-content',
      maxWidth: 'calc(100vw - 32px)',
    });
  });

  it('keeps the calendars row sized by content instead of shrinking in the popover', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker aria-label="r" />);
    await user.click(screen.getByLabelText('Open calendar'));
    const panel = document.querySelector('[data-slot="daterangepicker-panel"]') as HTMLElement;
    const calendarsRow = panel.lastElementChild as HTMLElement;
    expect(calendarsRow).toHaveStyle({ flex: 'none', width: 'max-content' });
  });

  it('shows one grid when visibleMonths=1', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker visibleMonths={1} aria-label="r" />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getAllByRole('grid')).toHaveLength(1);
  });

  it('applies panelSize to the range popover and both calendar panels', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker panelSize="sm" aria-label="r" />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(document.querySelector('[data-slot="daterangepicker-panel"]')).toHaveAttribute(
      'data-panel-size',
      'sm',
    );
    expect(document.querySelectorAll('[data-timeui-calendar][data-panel-size="sm"]')).toHaveLength(
      2,
    );
  });
});

// ────────────────────────────────────────────────────────────
// 选择
// ────────────────────────────────────────────────────────────

describe('DateRangePicker — selection', () => {
  it('two clicks complete a range and fire onChange + close popover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateRangePicker
        defaultValue={{ start: new Date(2026, 3, 1), end: new Date(2026, 3, 1) }}
        onChange={onChange}
        aria-label="r"
      />,
    );
    const grids = await openCalendar(user);
    // First click → start
    await user.click(findCellByDay(grids[0]!, 10));
    expect(onChange).not.toHaveBeenCalled();
    // Second click → end
    await user.click(findCellByDay(grids[0]!, 20));
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]![0] as { start: Date; end: Date };
    expect(arg.start.getDate()).toBe(10);
    expect(arg.end.getDate()).toBe(20);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('reverse selection (end < start) auto-swaps', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateRangePicker
        defaultValue={{ start: new Date(2026, 3, 1), end: new Date(2026, 3, 1) }}
        onChange={onChange}
        aria-label="r"
      />,
    );
    const grids = await openCalendar(user);
    await user.click(findCellByDay(grids[0]!, 20));
    await user.click(findCellByDay(grids[0]!, 10));
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]![0] as { start: Date; end: Date };
    expect(arg.start.getDate()).toBe(10);
    expect(arg.end.getDate()).toBe(20);
  });

  it('controlled value renders the formatted text', () => {
    renderWithProviders(
      <DateRangePicker
        value={{ start: new Date(2026, 3, 10), end: new Date(2026, 3, 20) }}
        aria-label="r"
      />,
    );
    const input = screen.getByLabelText('r') as HTMLInputElement;
    // Should contain both dates joined by an en-dash
    expect(input.value).toMatch(/–|-/);
    expect(input.value).toMatch(/2026/);
  });

  it('isClearable: clicking clear in input clears value', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateRangePicker
        isClearable
        defaultValue={{ start: new Date(2026, 3, 10), end: new Date(2026, 3, 20) }}
        onChange={onChange}
        aria-label="r"
      />,
    );
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    await user.click(clearBtn);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

// ────────────────────────────────────────────────────────────
// hover preview
// ────────────────────────────────────────────────────────────

describe('DateRangePicker — hover preview', () => {
  it('after first click, hovering a later cell marks preview cells', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(
      <DateRangePicker
        defaultValue={{ start: new Date(2026, 3, 1), end: new Date(2026, 3, 1) }}
        aria-label="r"
      />,
    );
    const grids = await openCalendar(user);
    await user.click(findCellByDay(grids[0]!, 5));
    const target = findCellByDay(grids[0]!, 12);
    await user.hover(target);
    // Some cells between 6..11 should have data-preview
    const cells = within(grids[0]!).getAllByRole('gridcell');
    const previews = cells.filter((c) => c.getAttribute('data-preview') === 'true');
    expect(previews.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// presets
// ────────────────────────────────────────────────────────────

describe('DateRangePicker — presets', () => {
  it('renders preset entries and selecting one fires onChange + closes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    const presets = [
      { label: 'Last 7 days', value: { start: new Date(2026, 3, 11), end: new Date(2026, 3, 17) } },
      { label: 'This month', value: { start: new Date(2026, 3, 1), end: new Date(2026, 3, 30) } },
    ];
    renderWithProviders(<DateRangePicker presets={presets} onChange={onChange} aria-label="r" />);
    installRectMocks();
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    await user.click(screen.getByText('This month'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]![0] as { start: Date; end: Date };
    expect(arg.start.getDate()).toBe(1);
    expect(arg.end.getDate()).toBe(30);
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────
// 月份导航
// ────────────────────────────────────────────────────────────

describe('DateRangePicker — month navigation', () => {
  it('left panel only shows prev; right panel only shows next (visibleMonths=2)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker aria-label="r" />);
    await openCalendar(user);
    // There should be exactly one Prev button (on the left panel) and one Next button (on the right panel).
    expect(screen.getAllByLabelText('Previous month')).toHaveLength(1);
    expect(screen.getAllByLabelText('Next month')).toHaveLength(1);
  });

  it('clicking Next month shifts both panels forward by 1 month', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(
      <DateRangePicker
        defaultValue={{ start: new Date(2026, 3, 1), end: new Date(2026, 3, 1) }}
        aria-label="r"
      />,
    );
    await openCalendar(user);
    const labelsBefore = Array.from(document.querySelectorAll('[aria-live="polite"]')).map(
      (e) => e.textContent ?? '',
    );
    await user.click(screen.getByLabelText('Next month'));
    const labelsAfter = Array.from(document.querySelectorAll('[aria-live="polite"]')).map(
      (e) => e.textContent ?? '',
    );
    expect(labelsAfter[0]).not.toBe(labelsBefore[0]);
    expect(labelsAfter[1]).not.toBe(labelsBefore[1]);
  });
});

// ────────────────────────────────────────────────────────────
// disabled / readonly
// ────────────────────────────────────────────────────────────

describe('DateRangePicker — disabled', () => {
  it('isDisabled disables the calendar trigger', () => {
    renderWithProviders(<DateRangePicker isDisabled aria-label="r" />);
    expect(screen.getByLabelText('Open calendar')).toBeDisabled();
  });

  it('isReadOnly disables the calendar trigger', () => {
    renderWithProviders(<DateRangePicker isReadOnly aria-label="r" />);
    expect(screen.getByLabelText('Open calendar')).toBeDisabled();
  });
});

describe('DateRangePicker — keyboard on input', () => {
  it('ArrowDown on the input opens the popover', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker aria-label="r" />);
    const input = screen.getByRole('textbox');
    input.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('grid').length).toBeGreaterThan(0);
  });

  it('Enter on the input opens the popover', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateRangePicker aria-label="r" />);
    const input = screen.getByRole('textbox');
    input.focus();
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('grid').length).toBeGreaterThan(0);
  });
});

describe('DateRangePicker — ESC + click outside', () => {
  it('ESC closes the popover', async () => {
    installRectMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <DateRangePicker defaultIsOpen onOpenChange={onOpenChange} aria-label="r" />,
    );
    expect(screen.getAllByRole('grid').length).toBeGreaterThan(0);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('mousedown outside closes the popover', async () => {
    installRectMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <div>
        <DateRangePicker defaultIsOpen onOpenChange={onOpenChange} aria-label="r" />
        <div data-testid="elsewhere" />
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId('elsewhere'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

describe('DateRangePicker — Today button', () => {
  it('clicking [Today] (single-month layout) sets a range start=end=today', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateRangePicker visibleMonths={1} showTodayButton onChange={onChange} aria-label="r" />,
    );
    await user.click(screen.getByLabelText('Open calendar'));
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]![0] as { start: Date; end: Date };
    expect(arg.start.getDate()).toBe(arg.end.getDate());
  });
});

// ────────────────────────────────────────────────────────────
// a11y
// ────────────────────────────────────────────────────────────

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
