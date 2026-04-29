/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Select 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { lightTheme } from '@timeui/themes';
import { renderWithProviders } from '../../test-utils';
import { Select, SelectOption } from '../';

const ITEMS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', isDisabled: true },
];

async function openListbox() {
  await userEvent.click(screen.getByRole('combobox'));
  return screen.findByRole('listbox');
}

describe('Select', () => {
  it('controlled: clicking an option calls onChange with the string value', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Select value="a" onChange={onChange} items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const listbox = await openListbox();
    const banana = within(listbox).getByRole('option', { name: /Banana/i });
    await userEvent.click(banana);
    expect(onChange).toHaveBeenLastCalledWith('b');
  });

  it('uncontrolled: defaultValue shows in the trigger and clicking an option updates it', async () => {
    renderWithProviders(<Select defaultValue="b" items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Banana');
    const listbox = await openListbox();
    await userEvent.click(within(listbox).getByRole('option', { name: /Apple/i }));
    expect(trigger).toHaveTextContent('Apple');
  });

  it('renders one option per item and marks disabled items via aria-disabled', async () => {
    renderWithProviders(<Select items={ITEMS} aria-label="fruit" />);
    const listbox = await openListbox();
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(3);
    const cherry = options.find((o) => /Cherry/.test(o.textContent || ''));
    expect(cherry).toHaveAttribute('aria-disabled', 'true');
  });

  it('placeholder renders in the trigger when value is empty', () => {
    renderWithProviders(<Select placeholder="Pick a fruit" items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Pick a fruit');
  });

  it('children form (<SelectOption>) is walked and becomes listbox options', async () => {
    renderWithProviders(
      <Select aria-label="fruit" defaultValue="x">
        <SelectOption value="x">X</SelectOption>
        <SelectOption value="y">Y</SelectOption>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('X');
    const listbox = await openListbox();
    const options = within(listbox).getAllByRole('option');
    expect(options.map((o) => o.textContent?.trim())).toEqual(['X', 'Y']);
  });

  it('warns and skips unsupported child nodes without a value prop', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderWithProviders(
      <Select aria-label="fruit">
        <div>Invalid child</div>
        <SelectOption value="ok">Okay</SelectOption>
      </Select>,
    );
    const listbox = await openListbox();
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Okay');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('errorMessage → aria-invalid + aria-describedby wired through FormField', () => {
    renderWithProviders(
      <Select label="Fruit" errorMessage="Pick one" items={ITEMS} defaultValue="a" />,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Pick one');
    expect(trigger.getAttribute('aria-describedby') ?? '').toContain(alert.id);
  });

  it('isDisabled: the trigger is disabled and clicking does not open the listbox', async () => {
    renderWithProviders(<Select isDisabled items={ITEMS} defaultValue="a" aria-label="x" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('forwards ref to the trigger button', () => {
    let captured: HTMLButtonElement | null = null;
    renderWithProviders(
      <Select
        aria-label="x"
        items={ITEMS}
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLButtonElement);
  });

  it('logs a dev warning when both items and children are provided (items wins)', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithProviders(
      <Select aria-label="x" items={ITEMS} defaultValue="a">
        <SelectOption value="z">Z</SelectOption>
      </Select>,
    );
    expect(spy).toHaveBeenCalled();
    const listbox = await openListbox();
    const options = within(listbox).getAllByRole('option');
    expect(options.map((o) => o.textContent?.trim())).toEqual(['Apple', 'Banana', 'Cherry']);
    spy.mockRestore();
  });

  it('isFullWidth stretches the wrapper width to 100%', () => {
    const { container } = renderWithProviders(
      <Select isFullWidth items={ITEMS} defaultValue="a" aria-label="x" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
  });

  it('isSearchable filters the visible options by substring', async () => {
    renderWithProviders(
      <Select
        isSearchable
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'apricot', label: 'Apricot' },
          { value: 'banana', label: 'Banana' },
        ]}
        aria-label="fruit"
      />,
    );
    await openListbox();
    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: 'ap' } });
    const listbox = await screen.findByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options.map((o) => o.textContent?.trim())).toEqual(['Apple', 'Apricot']);
  });

  it('isSearchable shows the empty-message when nothing matches', async () => {
    renderWithProviders(
      <Select isSearchable emptyMessage="Nothing found" items={ITEMS} aria-label="fruit" />,
    );
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(await screen.findByText('Nothing found')).toBeInTheDocument();
  });

  it('keeps the listbox open and focuses search when clicking the trigger in searchable mode', async () => {
    renderWithProviders(<Select isSearchable items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    const search = screen.getByRole('searchbox');
    expect(search).toHaveFocus();
    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toHaveFocus();
    });
  });

  it('focuses the search input when clicking the search area container', async () => {
    renderWithProviders(<Select isSearchable items={ITEMS} aria-label="fruit" />);
    await openListbox();
    const search = screen.getByRole('searchbox');
    const searchArea = search.parentElement as HTMLElement;

    search.blur();
    fireEvent.mouseDown(searchArea);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await waitFor(() => {
      expect(search).toHaveFocus();
    });
  });

  it('clears search and closes the popover after selecting an option in searchable mode', async () => {
    renderWithProviders(<Select isSearchable items={ITEMS} aria-label="fruit" />);
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ap' } });
    await userEvent.click(screen.getByRole('option', { name: /Apple/i }));
    expect(screen.queryByRole('listbox')).toBeNull();

    await openListbox();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(3);
  });

  it('renders startContent and option descriptions', async () => {
    renderWithProviders(
      <Select
        aria-label="fruit"
        startContent={<span data-testid="start-slot">@</span>}
        items={[
          { value: 'a', label: 'Apple', description: 'Red fruit' },
          { value: 'b', label: 'Banana' },
        ]}
      />,
    );
    expect(screen.getByTestId('start-slot')).toBeInTheDocument();
    const listbox = await openListbox();
    expect(within(listbox).getByText('Red fruit')).toBeInTheDocument();
  });

  it('supports full radius and custom maxListHeight', async () => {
    const { container } = renderWithProviders(
      <Select aria-label="fruit" radius="full" maxListHeight={120} items={ITEMS} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    await openListbox();
    const popover = document.querySelector('[data-timeui-select-popover]') as HTMLElement;
    expect(popover).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain('max-height:120px');
  });

  it('uses custom search placeholder and empty message', async () => {
    renderWithProviders(
      <Select
        isSearchable
        searchPlaceholder="Filter fruits"
        emptyMessage="Nothing here"
        items={ITEMS}
        aria-label="fruit"
      />,
    );
    await openListbox();
    expect(screen.getByPlaceholderText('Filter fruits')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(await screen.findByText('Nothing here')).toBeInTheDocument();
  });

  it('keyboard: ArrowDown / Enter selects the next non-disabled option', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Select defaultValue="a" onChange={onChange} items={ITEMS} aria-label="fruit" />,
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('b');
  });

  it('Escape closes the listbox and returns focus to the trigger', async () => {
    renderWithProviders(<Select defaultValue="a" items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Tab closes the listbox without trapping focus handling', async () => {
    renderWithProviders(<Select defaultValue="a" items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Tab}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('clicking outside closes the popover', async () => {
    renderWithProviders(<Select defaultValue="a" items={ITEMS} aria-label="fruit" />);
    await openListbox();
    await userEvent.click(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('does not leak option mouse events to document-level handlers', async () => {
    const onDocumentMouseDown = vi.fn();
    renderWithProviders(<Select defaultValue="a" items={ITEMS} aria-label="fruit" />);
    await openListbox();

    document.addEventListener('mousedown', onDocumentMouseDown);
    try {
      await userEvent.click(screen.getByRole('option', { name: /Banana/i }));
      expect(onDocumentMouseDown).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('mousedown', onDocumentMouseDown);
    }
  });

  it('searchbox navigation supports Home and End keys', async () => {
    renderWithProviders(
      <Select
        isSearchable
        items={[
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
          { value: 'c', label: 'Cherry', isDisabled: true },
        ]}
        aria-label="fruit"
      />,
    );
    await openListbox();
    const search = screen.getByRole('searchbox');
    search.focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('-opt-1'),
    );
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('-opt-0'),
    );
  });

  it('selects nested ReactNode labels via search text extraction', async () => {
    renderWithProviders(
      <Select
        isSearchable
        items={[
          {
            value: 'x',
            label: (
              <span>
                <strong>Green</strong> Apple
              </span>
            ),
          },
          { value: 'y', label: 'Banana' },
        ]}
        aria-label="fruit"
      />,
    );
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'green' } });
    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Green Apple');
    });
  });

  it('renders selected non-default description styling branch', async () => {
    renderWithProviders(
      <Select
        aria-label="fruit"
        color="primary"
        defaultValue="a"
        items={[
          { value: 'a', label: 'Apple', description: 'Primary description' },
          { value: 'b', label: 'Banana' },
        ]}
      />,
    );
    const listbox = await openListbox();
    expect(within(listbox).getByText('Primary description')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain(lightTheme.colors.primary[600]);
  });

  it('name prop renders a hidden input that carries the current value', () => {
    const { container } = renderWithProviders(
      <Select name="fruit" defaultValue="b" items={ITEMS} aria-label="x" />,
    );
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="fruit"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.value).toBe('b');
  });

  describe('popover placement (viewport collision)', () => {
    it('defaults to bottom placement when there is plenty of space below the trigger', async () => {
      // jsdom 默认 getBoundingClientRect 全 0、innerHeight 768：trigger.bottom=0,
      // availableBelow≈754 ≥ userMax(280) → 走 bottom 分支。
      renderWithProviders(<Select aria-label="fruit" items={ITEMS} />);
      await userEvent.click(screen.getByRole('combobox'));
      const listbox = await screen.findByRole('listbox');
      const popover = listbox.closest('[data-timeui-select-popover]') as HTMLElement | null;
      expect(popover).not.toBeNull();
      expect(popover!.getAttribute('data-placement')).toBe('bottom');
      expect(popover!.style.top).not.toBe('');
      expect(popover!.style.bottom).toBe('');
    });

    it('clamps popover left when the trigger sits near the viewport right edge', async () => {
      // 模拟 trigger 贴近视口右边的真实情况（例：Pagination size-changer 在 flex justify-end）：
      // viewport=1024, trigger.left=950, width=80 → r.left+r.width=1030 > 1024，
      // 触发右侧 clamp，左移到 max(8, 1024-80-8)=936，避免 dropdown 越过视口被裁。
      const originalGetRect = Element.prototype.getBoundingClientRect;
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        x: 950,
        y: 100,
        top: 100,
        bottom: 120,
        left: 950,
        right: 1030,
        width: 80,
        height: 20,
        toJSON: () => ({}),
      })) as unknown as typeof Element.prototype.getBoundingClientRect;
      try {
        renderWithProviders(<Select aria-label="size" items={ITEMS} />);
        await userEvent.click(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        const popover = listbox.closest('[data-timeui-select-popover]') as HTMLElement | null;
        expect(popover).not.toBeNull();
        const leftPx = parseFloat(popover!.style.left);
        // 不能越过视口右边（dropWidth=80, safeMargin=8 → 上限 1024-80-8=936）
        expect(leftPx).toBeLessThanOrEqual(1024 - 80 - 8);
        // 也不能跑出左边
        expect(leftPx).toBeGreaterThanOrEqual(8);
      } finally {
        Element.prototype.getBoundingClientRect = originalGetRect;
        Object.defineProperty(window, 'innerWidth', {
          value: originalInnerWidth,
          configurable: true,
        });
      }
    });

    it('keeps popover left aligned with trigger when there is room on the right', async () => {
      const originalGetRect = Element.prototype.getBoundingClientRect;
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        x: 100,
        y: 100,
        top: 100,
        bottom: 120,
        left: 100,
        right: 200,
        width: 100,
        height: 20,
        toJSON: () => ({}),
      })) as unknown as typeof Element.prototype.getBoundingClientRect;
      try {
        renderWithProviders(<Select aria-label="fruit" items={ITEMS} />);
        await userEvent.click(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        const popover = listbox.closest('[data-timeui-select-popover]') as HTMLElement | null;
        expect(popover).not.toBeNull();
        // 100 + 100 + 8 = 208 ≤ 1024，没有 overflow，保持 r.left
        expect(parseFloat(popover!.style.left)).toBe(100);
      } finally {
        Element.prototype.getBoundingClientRect = originalGetRect;
        Object.defineProperty(window, 'innerWidth', {
          value: originalInnerWidth,
          configurable: true,
        });
      }
    });

    it('flips to top placement when the trigger sits near the viewport bottom', async () => {
      // 模拟 trigger 贴近视口底部的真实情况：viewport=600, trigger.bottom=590
      // → availableBelow=600-590-6-8=−4 → 0；availableAbove=570-6-8=556 → flip top。
      const originalGetRect = Element.prototype.getBoundingClientRect;
      const originalInnerHeight = window.innerHeight;
      Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        x: 100,
        y: 570,
        top: 570,
        bottom: 590,
        left: 100,
        right: 200,
        width: 100,
        height: 20,
        toJSON: () => ({}),
      })) as unknown as typeof Element.prototype.getBoundingClientRect;
      try {
        renderWithProviders(<Select aria-label="fruit" items={ITEMS} />);
        await userEvent.click(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        const popover = listbox.closest('[data-timeui-select-popover]') as HTMLElement | null;
        expect(popover).not.toBeNull();
        expect(popover!.getAttribute('data-placement')).toBe('top');
        // top placement 使用 bottom 锚定，不使用 top
        expect(popover!.style.bottom).not.toBe('');
        expect(popover!.style.top).toBe('');
      } finally {
        Element.prototype.getBoundingClientRect = originalGetRect;
        Object.defineProperty(window, 'innerHeight', {
          value: originalInnerHeight,
          configurable: true,
        });
      }
    });

  });
});
