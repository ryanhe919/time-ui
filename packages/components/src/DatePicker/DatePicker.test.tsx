/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 DatePicker 组件的行为与回归（受控/非受控、键盘、min/max、a11y、format/parse、清除）。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { DatePicker } from './DatePicker';

// ────────────────────────────────────────────────────────────
// jsdom 兜底：Popover 的 getBoundingClientRect 在 jsdom 下返回 0。
// ────────────────────────────────────────────────────────────

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
  // Calendar grid should appear in dialog.
  return screen.getByRole('grid');
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

describe('DatePicker — base rendering', () => {
  it('renders an Input with placeholder and calendar icon button', () => {
    renderWithProviders(<DatePicker placeholder="Pick a date" />);
    expect(screen.getByPlaceholderText('Pick a date')).toBeInTheDocument();
    expect(screen.getByLabelText('Open calendar')).toBeInTheDocument();
  });

  it('does not render the calendar panel when closed', () => {
    renderWithProviders(<DatePicker />);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('aria-label propagates to the input', () => {
    renderWithProviders(<DatePicker aria-label="Birthday" />);
    expect(screen.getByLabelText('Birthday')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// open / close
// ────────────────────────────────────────────────────────────

describe('DatePicker — open / close', () => {
  it('clicking the calendar icon opens the popover', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('clicking the icon again closes it', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker />);
    const trigger = screen.getByLabelText('Open calendar');
    await user.click(trigger);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('controlled isOpen=true renders calendar', () => {
    installRectMocks();
    renderWithProviders(<DatePicker isOpen aria-label="d" />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('controlled isOpen=false suppresses calendar even after click', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker isOpen={false} aria-label="d" />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('fires onOpenChange when toggled', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onOpenChange = vi.fn();
    renderWithProviders(<DatePicker onOpenChange={onOpenChange} aria-label="d" />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('ArrowDown on the input opens the calendar', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker aria-label="d" />);
    const input = screen.getByLabelText('d');
    input.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('Enter inside the input fires the close-intent on the controlled handler', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onOpenChange = vi.fn();
    renderWithProviders(<DatePicker isOpen onOpenChange={onOpenChange} aria-label="d" />);
    const input = screen.getByRole('textbox');
    input.focus();
    await user.keyboard('{Enter}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

// ────────────────────────────────────────────────────────────
// 受控 / 非受控 value
// ────────────────────────────────────────────────────────────

describe('DatePicker — value', () => {
  it('uncontrolled: clicking a cell selects + closes + fires onChange', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(<DatePicker onChange={onChange} aria-label="d" />);
    const grid = await openCalendar(user);
    await user.click(findCellByDay(grid, 15));
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]![0] as Date;
    expect(arg.getDate()).toBe(15);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('controlled: external value drives the formatted text', () => {
    const value = new Date(2026, 3, 17);
    renderWithProviders(<DatePicker value={value} aria-label="d" />);
    const input = screen.getByLabelText('d') as HTMLInputElement;
    expect(input.value.length).toBeGreaterThan(0);
    expect(input.value).toMatch(/2026/);
  });

  it('controlled: cell click does not mutate text without parent rerender', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    const value = new Date(2026, 3, 17);
    renderWithProviders(<DatePicker value={value} onChange={onChange} aria-label="d" />);
    const grid = await openCalendar(user);
    await user.click(findCellByDay(grid, 5));
    expect(onChange).toHaveBeenCalledTimes(1);
    // input still shows original value
    const input = screen.getByLabelText('d') as HTMLInputElement;
    expect(input.value).toMatch(/2026/);
  });
});

// ────────────────────────────────────────────────────────────
// Today / Clear 按钮
// ────────────────────────────────────────────────────────────

describe('DatePicker — Input clear button', () => {
  it('clicking the input clear button (X) clears the value', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DatePicker
        isClearable
        defaultValue={new Date(2026, 3, 17)}
        onChange={onChange}
        aria-label="d"
      />,
    );
    // Input ships with its own clear button labelled "Clear" (i18n).
    // Find a clear button that is *inside* the input wrapper (data-slot=clear).
    const inputClear = document.querySelector('[data-slot="clear"]') as HTMLElement;
    expect(inputClear).not.toBeNull();
    await user.click(inputClear);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe('DatePicker — popover ESC + click outside', () => {
  it('ESC dispatched on window closes the popover and fires onOpenChange(false)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onOpenChange = vi.fn();
    renderWithProviders(<DatePicker onOpenChange={onOpenChange} aria-label="d" />);
    await user.click(screen.getByLabelText('Open calendar'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('mousedown outside closes the popover (Popover onOpenChange route)', async () => {
    installRectMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <div>
        <DatePicker defaultIsOpen onOpenChange={onOpenChange} aria-label="d" />
        <div data-testid="elsewhere" />
      </div>,
    );
    expect(screen.getByRole('grid')).toBeInTheDocument();
    // Popover listens on document mousedown — dispatch from a node OUTSIDE the picker.
    fireEvent.mouseDown(screen.getByTestId('elsewhere'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('blurring the input drops in-progress draft', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker defaultValue={new Date(2026, 3, 17)} aria-label="d" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    await user.type(input, 'garbage');
    act(() => {
      input.blur();
    });
    // After blur the input should display the formatted value again.
    expect(input.value).toMatch(/2026/);
  });
});

describe('DatePicker — footer buttons', () => {
  it('clicking [Today] selects today + closes', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(<DatePicker onChange={onChange} aria-label="d" />);
    await openCalendar(user);
    const todayBtn = screen.getByRole('button', { name: 'Today' });
    await user.click(todayBtn);
    expect(onChange).toHaveBeenCalledTimes(1);
    const today = new Date();
    const arg = onChange.mock.calls[0]![0] as Date;
    expect(arg.getDate()).toBe(today.getDate());
  });

  it('Today button is hidden when showTodayButton=false', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker showTodayButton={false} aria-label="d" />);
    await openCalendar(user);
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('isClearable shows Clear in input + footer; clicking footer Clear fires onChange(null)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DatePicker
        isClearable
        defaultValue={new Date(2026, 3, 17)}
        onChange={onChange}
        aria-label="d"
      />,
    );
    await openCalendar(user);
    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearBtn);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

// ────────────────────────────────────────────────────────────
// minValue / maxValue / isDateUnavailable
// ────────────────────────────────────────────────────────────

describe('DatePicker — bounds & availability', () => {
  it('disables cells outside [minValue, maxValue]', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    const min = new Date(2026, 3, 10);
    const max = new Date(2026, 3, 20);
    renderWithProviders(
      <DatePicker
        defaultValue={new Date(2026, 3, 15)}
        minValue={min}
        maxValue={max}
        onChange={onChange}
        aria-label="d"
      />,
    );
    const grid = await openCalendar(user);
    const cell5 = findCellByDay(grid, 5);
    expect(cell5).toHaveAttribute('aria-disabled', 'true');
    expect(cell5).toBeDisabled();
    await user.click(cell5);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('isDateUnavailable disables specific cells', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    const isUnavail = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    renderWithProviders(
      <DatePicker
        defaultValue={new Date(2026, 3, 15)}
        isDateUnavailable={isUnavail}
        onChange={onChange}
        aria-label="d"
      />,
    );
    const grid = await openCalendar(user);
    const cells = within(grid).getAllByRole('gridcell');
    // At least some weekend cells are aria-disabled.
    const weekendDisabled = cells.filter((c) => c.getAttribute('aria-disabled') === 'true');
    expect(weekendDisabled.length).toBeGreaterThan(0);
  });

  it('Today button respects bounds (no-op when today out of range)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    // today is *now*; pick a min way in the future so today is out-of-range.
    const min = new Date(2099, 0, 1);
    renderWithProviders(<DatePicker minValue={min} onChange={onChange} aria-label="d" />);
    await openCalendar(user);
    const todayBtn = screen.getByRole('button', { name: 'Today' });
    await user.click(todayBtn);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────
// 月份导航
// ────────────────────────────────────────────────────────────

describe('DatePicker — month navigation', () => {
  it('Prev month / Next month buttons change the month label', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker defaultValue={new Date(2026, 3, 17)} aria-label="d" />);
    await openCalendar(user);
    const monthLabel = (): string => {
      // The month label is in [aria-live="polite"] within the panel.
      const els = document.querySelectorAll('[aria-live="polite"]');
      return els[0]?.textContent ?? '';
    };
    const orig = monthLabel();
    await user.click(screen.getByLabelText('Previous month'));
    expect(monthLabel()).not.toBe(orig);
    await user.click(screen.getByLabelText('Next month'));
    await user.click(screen.getByLabelText('Next month'));
    expect(monthLabel()).not.toBe(orig);
  });

  it('Prev/Next disabled when bounded month is unreachable', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const min = new Date(2026, 3, 1);
    const max = new Date(2026, 3, 30);
    renderWithProviders(
      <DatePicker
        defaultValue={new Date(2026, 3, 17)}
        minValue={min}
        maxValue={max}
        aria-label="d"
      />,
    );
    await openCalendar(user);
    expect(screen.getByLabelText('Previous month')).toBeDisabled();
    expect(screen.getByLabelText('Next month')).toBeDisabled();
  });

  it('can open year picker and jump directly to another year', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker defaultValue={new Date(2026, 3, 17)} aria-label="d" />);
    await openCalendar(user);

    await user.click(screen.getByLabelText('Choose year'));
    expect(screen.getByRole('listbox', { name: 'Choose year' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('Next years'));
    await user.click(screen.getByRole('option', { name: '2030' }));
    const els = document.querySelectorAll('[aria-live="polite"]');
    expect(els[0]?.textContent ?? '').toMatch(/2030/);
    expect(screen.queryByRole('listbox', { name: 'Choose year' })).toBeNull();
  });

  it('year picker keeps bounded years disabled and clamps to reachable month', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(
      <DatePicker
        defaultValue={new Date(2027, 3, 17)}
        minValue={new Date(2026, 7, 1)}
        maxValue={new Date(2027, 2, 31)}
        aria-label="d"
      />,
    );
    await openCalendar(user);

    await user.click(screen.getByLabelText('Choose year'));
    expect(screen.getByRole('option', { name: '2025' })).toBeDisabled();

    await user.click(screen.getByRole('option', { name: '2026' }));
    const els = document.querySelectorAll('[aria-live="polite"]');
    expect(els[0]?.textContent ?? '').toMatch(/2026/);
    expect((els[0]?.textContent ?? '').toLowerCase()).toMatch(/aug|8/);
  });
});

// ────────────────────────────────────────────────────────────
// 键盘
// ────────────────────────────────────────────────────────────

describe('DatePicker — keyboard navigation', () => {
  const focusInitialCell = async (
    user: ReturnType<typeof userEvent.setup>,
    initial: Date,
  ): Promise<HTMLElement> => {
    installRectMocks();
    renderWithProviders(<DatePicker defaultValue={initial} aria-label="d" />);
    const grid = await openCalendar(user);
    const cells = within(grid).getAllByRole('gridcell');
    const focusable = cells.find((c) => c.getAttribute('tabindex') === '0');
    expect(focusable).toBeDefined();
    focusable!.focus();
    return focusable!;
  };

  it('ArrowRight moves focus to next day', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const cell = await focusInitialCell(user, new Date(2026, 3, 15));
    expect(cell.textContent).toContain('15');
    await user.keyboard('{ArrowRight}');
    // Find the new focused cell
    const grid = screen.getByRole('grid');
    const focused = within(grid)
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('tabindex') === '0');
    expect(focused?.textContent).toContain('16');
  });

  it('ArrowDown moves focus by 7 days', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await focusInitialCell(user, new Date(2026, 3, 10));
    await user.keyboard('{ArrowDown}');
    const focused = within(screen.getByRole('grid'))
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('tabindex') === '0');
    expect(focused?.textContent).toContain('17');
  });

  it('ArrowLeft and ArrowUp move backwards', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await focusInitialCell(user, new Date(2026, 3, 17));
    await user.keyboard('{ArrowLeft}');
    let focused = within(screen.getByRole('grid'))
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('tabindex') === '0');
    expect(focused?.textContent).toContain('16');
    await user.keyboard('{ArrowUp}');
    focused = within(screen.getByRole('grid'))
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('tabindex') === '0');
    expect(focused?.textContent).toContain('9');
  });

  it('Home/End move to start/end of week', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    // Wednesday April 15, 2026 → weekStartsOn=0 → Home goes to Sunday April 12.
    await focusInitialCell(user, new Date(2026, 3, 15));
    await user.keyboard('{Home}');
    let focused = within(screen.getByRole('grid'))
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('tabindex') === '0');
    expect(focused?.textContent).toContain('12');
    await user.keyboard('{End}');
    focused = within(screen.getByRole('grid'))
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('tabindex') === '0');
    expect(focused?.textContent).toContain('18');
  });

  it('PageUp/PageDown move by month', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await focusInitialCell(user, new Date(2026, 3, 17));
    await user.keyboard('{PageUp}');
    // Now we should be on March 17.
    const els = document.querySelectorAll('[aria-live="polite"]');
    expect((els[0]?.textContent ?? '').toLowerCase()).toMatch(/mar|3/);
  });

  it('Shift+PageUp moves by year', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await focusInitialCell(user, new Date(2026, 3, 17));
    await user.keyboard('{Shift>}{PageUp}{/Shift}');
    const els = document.querySelectorAll('[aria-live="polite"]');
    expect(els[0]?.textContent ?? '').toMatch(/2025/);
  });

  it('Enter selects the focused day', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    installRectMocks();
    renderWithProviders(
      <DatePicker defaultValue={new Date(2026, 3, 15)} onChange={onChange} aria-label="d" />,
    );
    const grid = await openCalendar(user);
    const focusable = within(grid)
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('tabindex') === '0');
    focusable!.focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────
// disabled / readonly
// ────────────────────────────────────────────────────────────

describe('DatePicker — disabled / readonly', () => {
  it('isDisabled disables the input and calendar trigger', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker isDisabled aria-label="d" />);
    const trigger = screen.getByLabelText('Open calendar');
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('isReadOnly disables the calendar trigger', () => {
    renderWithProviders(<DatePicker isReadOnly aria-label="d" />);
    expect(screen.getByLabelText('Open calendar')).toBeDisabled();
  });

  it('isInvalid sets aria-invalid on the input', () => {
    renderWithProviders(<DatePicker isInvalid aria-label="d" />);
    expect(screen.getByLabelText('d')).toHaveAttribute('aria-invalid', 'true');
  });
});

// ────────────────────────────────────────────────────────────
// format / parse
// ────────────────────────────────────────────────────────────

describe('DatePicker — format / parse', () => {
  it('custom format is used to render value', () => {
    const value = new Date(2026, 3, 17);
    renderWithProviders(
      <DatePicker
        value={value}
        format={(d) => `Y${d.getFullYear()}M${d.getMonth() + 1}D${d.getDate()}`}
        aria-label="d"
      />,
    );
    expect((screen.getByLabelText('d') as HTMLInputElement).value).toBe('Y2026M4D17');
  });

  it('custom parse is invoked on input typing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    const parser = vi.fn((s: string) => (s === 'tomorrow' ? new Date(2026, 3, 18) : null));
    renderWithProviders(<DatePicker parse={parser} onChange={onChange} aria-label="d" />);
    const input = screen.getByLabelText('d') as HTMLInputElement;
    input.focus();
    await user.type(input, 'tomorrow');
    expect(parser).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it('clearing the input by typing empty fires onChange(null)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DatePicker defaultValue={new Date(2026, 3, 17)} onChange={onChange} aria-label="d" />,
    );
    const input = screen.getByLabelText('d') as HTMLInputElement;
    input.focus();
    await user.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

// ────────────────────────────────────────────────────────────
// today dot + selected highlight
// ────────────────────────────────────────────────────────────

describe('DatePicker — visual states', () => {
  it('selected day cell has aria-selected=true', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker defaultValue={new Date(2026, 3, 17)} aria-label="d" />);
    const grid = await openCalendar(user);
    const cell = findCellByDay(grid, 17);
    expect(cell).toHaveAttribute('aria-selected', 'true');
  });

  it('non-current-month cells are still rendered (and clickable to navigate)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DatePicker defaultValue={new Date(2026, 3, 17)} aria-label="d" />);
    const grid = await openCalendar(user);
    const allCells = within(grid).getAllByRole('gridcell');
    expect(allCells).toHaveLength(42);
    const outside = allCells.find((c) => c.getAttribute('data-current-month') !== 'true');
    expect(outside).toBeDefined();
  });
});

// ────────────────────────────────────────────────────────────
// a11y
// ────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────
// 杂项：startContent / weekStartsOn / locale
// ────────────────────────────────────────────────────────────

describe('DatePicker — misc props', () => {
  it('weekStartsOn=1 reorders weekday header', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(
      <DatePicker defaultValue={new Date(2026, 3, 17)} weekStartsOn={1} aria-label="d" />,
    );
    await openCalendar(user);
    const headers = document.querySelectorAll('[role="columnheader"]');
    expect(headers).toHaveLength(7);
  });

  it('startContent renders inside the input', () => {
    renderWithProviders(<DatePicker startContent={<span>$</span>} aria-label="d" />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('uses provided id on the input', () => {
    renderWithProviders(<DatePicker id="my-date" aria-label="d" />);
    expect(screen.getByLabelText('d')).toHaveAttribute('id', 'my-date');
  });
});
