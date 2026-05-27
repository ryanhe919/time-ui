/**
 * @author Ryan He
 * @date 2026-04-24
 * @description 验证 DateTimePicker 的行为：受控/非受控 value、时分秒开关语义、
 *              draft + OK 提交流程、Now / Clear、min/max、输入框解析与 a11y。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const TRIGGER_LABEL = 'Open date time picker';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 3, 17, 10, 30, 45, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  installRectMocks();
  await user.click(screen.getByLabelText(TRIGGER_LABEL));
  return screen.getByRole('dialog');
};

const getHourListbox = (dialog: HTMLElement) =>
  within(dialog).getByRole('listbox', { name: /hour/i });

// 找到指定数值的 option（用 data-value 精确匹配）。
const optionByValue = (listbox: HTMLElement, value: string | number) => {
  return listbox.querySelector(`[data-value="${value}"]`) as HTMLElement;
};

// ────────────────────────────────────────────────────────────
// 渲染
// ────────────────────────────────────────────────────────────

describe('DateTimePicker — base rendering', () => {
  it('renders an Input with default placeholder and trigger button', () => {
    renderWithProviders(<DateTimePicker />);
    expect(screen.getByPlaceholderText('Select date and time')).toBeInTheDocument();
    expect(screen.getByLabelText(TRIGGER_LABEL)).toBeInTheDocument();
  });

  it('does not render the panel when closed', () => {
    renderWithProviders(<DateTimePicker />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('custom aria-label propagates to input', () => {
    renderWithProviders(<DateTimePicker aria-label="Appointment" />);
    expect(screen.getByLabelText('Appointment')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// open / close
// ────────────────────────────────────────────────────────────

describe('DateTimePicker — open / close', () => {
  it('clicking the trigger opens both calendar grid and time listboxes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateTimePicker />);
    const dialog = await openPanel(user);
    expect(within(dialog).getByRole('grid')).toBeInTheDocument();
    expect(within(dialog).getByRole('listbox', { name: /hour/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('listbox', { name: /minute/i })).toBeInTheDocument();
  });

  it('ESC on window closes the panel', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onOpenChange = vi.fn();
    renderWithProviders(<DateTimePicker onOpenChange={onOpenChange} />);
    await openPanel(user);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('mousedown outside closes the panel', async () => {
    installRectMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <div>
        <DateTimePicker defaultOpen onOpenChange={onOpenChange} />
        <div data-testid="elsewhere" />
      </div>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('elsewhere'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

// ────────────────────────────────────────────────────────────
// granularity：showMinute / showSecond
// ────────────────────────────────────────────────────────────

describe('DateTimePicker — granularity', () => {
  it('defaults: hour + minute columns, no second column', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateTimePicker defaultOpen />);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('listbox', { name: /hour/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('listbox', { name: /minute/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole('listbox', { name: /second/i })).toBeNull();
    void user; // keep parity with other blocks
  });

  it('showSecond=true adds a third column', () => {
    installRectMocks();
    renderWithProviders(<DateTimePicker defaultOpen showSecond />);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('listbox', { name: /second/i })).toBeInTheDocument();
  });

  it('showMinute=false removes minute + second columns', () => {
    installRectMocks();
    renderWithProviders(<DateTimePicker defaultOpen showMinute={false} showSecond />);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('listbox', { name: /hour/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole('listbox', { name: /minute/i })).toBeNull();
    expect(within(dialog).queryByRole('listbox', { name: /second/i })).toBeNull();
  });

  it('confirming a value with showMinute=false zeroes minutes and seconds', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateTimePicker
        showMinute={false}
        onChange={onChange}
        defaultValue={new Date(2026, 3, 17, 9, 44, 33)}
      />,
    );
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    const dialog = screen.getByRole('dialog');
    // 点 hour=14
    await user.click(optionByValue(getHourListbox(dialog), 14));
    // OK
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]![0] as Date;
    expect(arg.getHours()).toBe(14);
    expect(arg.getMinutes()).toBe(0);
    expect(arg.getSeconds()).toBe(0);
  });

  it('confirming with showSecond=false zeroes seconds but keeps minute', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateTimePicker onChange={onChange} defaultValue={new Date(2026, 3, 17, 9, 30, 55)} />,
    );
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    const dialog = screen.getByRole('dialog');
    const minuteBox = within(dialog).getByRole('listbox', { name: /minute/i });
    await user.click(optionByValue(minuteBox, 45));
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    const arg = onChange.mock.calls[0]![0] as Date;
    expect(arg.getMinutes()).toBe(45);
    expect(arg.getSeconds()).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────
// 值提交：draft → OK
// ────────────────────────────────────────────────────────────

describe('DateTimePicker — commit flow', () => {
  it('changing hour alone does not call onChange until OK is clicked', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateTimePicker onChange={onChange} defaultValue={new Date(2026, 3, 17, 9, 30)} />,
    );
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    const dialog = screen.getByRole('dialog');
    await user.click(optionByValue(getHourListbox(dialog), 15));
    // 未点 OK，不应 fire onChange
    expect(onChange).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]![0] as Date;
    expect(arg.getHours()).toBe(15);
    expect(arg.getMinutes()).toBe(30);
  });

  it('OK closes the panel', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<DateTimePicker />);
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Now button fills draft with current date + current time', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(<DateTimePicker onChange={onChange} />);
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Now' }));
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    const arg = onChange.mock.calls[0]![0] as Date;
    // vi.setSystemTime(2026-04-17 10:30:45)
    expect(arg.getFullYear()).toBe(2026);
    expect(arg.getMonth()).toBe(3);
    expect(arg.getDate()).toBe(17);
    expect(arg.getHours()).toBe(10);
    expect(arg.getMinutes()).toBe(30);
    // showSecond 默认 false，秒被清零
    expect(arg.getSeconds()).toBe(0);
  });

  it('Clear (when isClearable) resets value and closes', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateTimePicker
        isClearable
        onChange={onChange}
        defaultValue={new Date(2026, 3, 17, 9, 30)}
      />,
    );
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    const dialog = screen.getByRole('dialog');
    // 面板底部的 Clear 按钮（data-slot="clear"）
    const clearBtn = dialog.querySelector(
      '[data-slot="datetimepicker-footer"] [data-slot="clear"]',
    ) as HTMLElement;
    await user.click(clearBtn);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// 输入框文本解析
// ────────────────────────────────────────────────────────────

describe('DateTimePicker — input parse', () => {
  it('typing a valid YYYY-MM-DD HH:mm string updates the value', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(<DateTimePicker onChange={onChange} aria-label="dt" />);
    const input = screen.getByLabelText('dt') as HTMLInputElement;
    input.focus();
    await user.type(input, '2026-05-01 08:15');
    const lastArg = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Date;
    expect(lastArg.getFullYear()).toBe(2026);
    expect(lastArg.getMonth()).toBe(4);
    expect(lastArg.getDate()).toBe(1);
    expect(lastArg.getHours()).toBe(8);
    expect(lastArg.getMinutes()).toBe(15);
  });

  it('controlled value drives formatted input text', () => {
    renderWithProviders(<DateTimePicker value={new Date(2026, 3, 17, 9, 30)} aria-label="dt" />);
    const input = screen.getByLabelText('dt') as HTMLInputElement;
    expect(input.value).toMatch(/2026-04-17 09:30/);
  });

  it('format override wins over default', () => {
    renderWithProviders(
      <DateTimePicker
        value={new Date(2026, 3, 17, 9, 30)}
        aria-label="dt"
        format={(d) => `Y${d.getFullYear()}`}
      />,
    );
    const input = screen.getByLabelText('dt') as HTMLInputElement;
    expect(input.value).toBe('Y2026');
  });
});

// ────────────────────────────────────────────────────────────
// min / max
// ────────────────────────────────────────────────────────────

describe('DateTimePicker — min / max guards', () => {
  it('Now is ignored when current time falls outside min/max', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    renderWithProviders(
      <DateTimePicker
        onChange={onChange}
        // min 在 systemTime 之后一整年 → Now 无效。
        minValue={new Date(2027, 0, 1)}
      />,
    );
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Now' }));
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    // 预期：Now 被拒，draft 保持为初始（此刻），但 OK 时仍过了 bounds 检查被忽略。
    // 对外表现：onChange 不应被调用（或调用为 null）。
    if (onChange.mock.calls.length > 0) {
      expect(onChange.mock.calls[0]![0]).toBeNull();
    }
  });
});

// ────────────────────────────────────────────────────────────
// variant + color props
// ────────────────────────────────────────────────────────────

describe('DateTimePicker — variant and color props', () => {
  it('renders with default flat variant and default color when no variant/color passed', () => {
    const { container } = renderWithProviders(<DateTimePicker aria-label="dt" />);
    const inputWrapper = container.querySelector('[data-variant]');
    expect(inputWrapper).toHaveAttribute('data-variant', 'flat');
    expect(inputWrapper).toHaveAttribute('data-color', 'default');
  });

  it('variant="bordered" is forwarded to the internal Input', () => {
    const { container } = renderWithProviders(
      <DateTimePicker variant="bordered" aria-label="dt" />,
    );
    const inputWrapper = container.querySelector('[data-variant]');
    expect(inputWrapper).toHaveAttribute('data-variant', 'bordered');
  });

  it('variant="faded" is forwarded to the internal Input', () => {
    const { container } = renderWithProviders(<DateTimePicker variant="faded" aria-label="dt" />);
    const inputWrapper = container.querySelector('[data-variant]');
    expect(inputWrapper).toHaveAttribute('data-variant', 'faded');
  });

  it('variant="underlined" is forwarded to the internal Input', () => {
    const { container } = renderWithProviders(
      <DateTimePicker variant="underlined" aria-label="dt" />,
    );
    const inputWrapper = container.querySelector('[data-variant]');
    expect(inputWrapper).toHaveAttribute('data-variant', 'underlined');
  });

  it('color="danger" is forwarded to the internal Input', () => {
    const { container } = renderWithProviders(<DateTimePicker color="danger" aria-label="dt" />);
    const inputWrapper = container.querySelector('[data-color]');
    expect(inputWrapper).toHaveAttribute('data-color', 'danger');
  });

  it('variant + color combination: variant="faded" color="primary"', () => {
    const { container } = renderWithProviders(
      <DateTimePicker variant="faded" color="primary" aria-label="dt" />,
    );
    const inputWrapper = container.querySelector('[data-variant]');
    expect(inputWrapper).toHaveAttribute('data-variant', 'faded');
    expect(inputWrapper).toHaveAttribute('data-color', 'primary');
  });

  it('isInvalid + variant + color combination does not conflict', () => {
    const { container } = renderWithProviders(
      <DateTimePicker variant="bordered" color="primary" isInvalid aria-label="dt" />,
    );
    const inputWrapper = container.querySelector('[data-variant]');
    expect(inputWrapper).toHaveAttribute('data-variant', 'bordered');
    // isInvalid should override color to danger
    expect(inputWrapper).toHaveAttribute('data-color', 'danger');
  });

  it('variant does not break a11y (axe zero violations)', async () => {
    const { container } = renderWithProviders(
      <DateTimePicker variant="bordered" color="primary" aria-label="dt" />,
    );
    await expectA11y(container);
  });
});
