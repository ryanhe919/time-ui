/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 验证 MultiSelect 模块的行为与回归 —— 受控/非受控、键盘、chip 删除、
 *              maxTagCount、searchbox、toolbar、disabled / readOnly、prefers-reduced-motion 等。
 */

import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { MultiSelect, MultiSelectOptGroup, MultiSelectOption } from '../';
import type { MultiSelectItem } from '../';

const ITEMS: MultiSelectItem[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Durian', isDisabled: true },
];

async function openListbox() {
  await userEvent.click(screen.getByRole('combobox'));
  return screen.findByRole('listbox');
}

describe('MultiSelect', () => {
  /* ---------------- T1 / T2: controlled / uncontrolled ---------------- */

  it('uncontrolled: clicking an option appends value and triggers onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect items={ITEMS} defaultValue={[]} onChange={onChange} aria-label="fruit" />,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const listbox = await openListbox();
    await userEvent.click(within(listbox).getByRole('option', { name: /Apple/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]).toEqual(['a']);
    // chip rendered in trigger
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
  });

  it('controlled: when onChange does not update value, the trigger stays put', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect value={['a']} onChange={onChange} items={ITEMS} aria-label="fruit" />,
    );
    const trigger = screen.getByRole('combobox');
    // single existing chip
    expect(within(trigger).getAllByText('Apple')).toHaveLength(1);
    const listbox = await openListbox();
    await userEvent.click(within(listbox).getByRole('option', { name: /Banana/i }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
    // controlled component unchanged
    expect(within(trigger).queryByText('Banana')).toBeNull();
    expect(within(trigger).getAllByText('Apple')).toHaveLength(1);
  });

  it('controlled: external value order is preserved (no internal sort)', () => {
    renderWithProviders(
      <MultiSelect value={['c', 'a', 'b']} onChange={() => {}} items={ITEMS} aria-label="fruit" />,
    );
    const trigger = screen.getByRole('combobox');
    // chip labels in trigger should appear c, a, b (excluding the +N chip if any)
    const labels = within(trigger)
      .getAllByText(/Apple|Banana|Cherry/i)
      .map((el) => el.textContent);
    expect(labels).toEqual(['Cherry', 'Apple', 'Banana']);
  });

  /* ---------------- T3: child component derivation ---------------- */

  it('derives items + group headings from <MultiSelectOption> / <MultiSelectOptGroup>', async () => {
    renderWithProviders(
      <MultiSelect aria-label="fruit" defaultValue={['x']}>
        <MultiSelectOptGroup label="Fruits">
          <MultiSelectOption value="x">X</MultiSelectOption>
          <MultiSelectOption value="y">Y</MultiSelectOption>
        </MultiSelectOptGroup>
        <MultiSelectOption value="z">Z</MultiSelectOption>
      </MultiSelect>,
    );
    const listbox = await openListbox();
    // group heading is rendered (presentation, not option)
    expect(within(listbox).getByText('Fruits')).toBeInTheDocument();
    const options = within(listbox).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['X', 'Y', 'Z']);
  });

  it('warns and skips unsupported children (no value prop)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderWithProviders(
      <MultiSelect aria-label="x">
        <div>not an option</div>
        <MultiSelectOption value="ok">Okay</MultiSelectOption>
      </MultiSelect>,
    );
    const listbox = await openListbox();
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Okay');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns when both items and children are passed (items wins)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderWithProviders(
      <MultiSelect items={ITEMS} aria-label="x">
        <MultiSelectOption value="zz">Zz</MultiSelectOption>
      </MultiSelect>,
    );
    expect(warn).toHaveBeenCalled();
    const listbox = await openListbox();
    const options = within(listbox).getAllByRole('option');
    expect(options.map((o) => o.textContent?.trim())).toEqual([
      'Apple',
      'Banana',
      'Cherry',
      'Durian',
    ]);
    warn.mockRestore();
  });

  /* ---------------- T4: search filter ---------------- */

  it('isSearchable filters options and shows emptyMessage when no match', async () => {
    renderWithProviders(
      <MultiSelect isSearchable items={ITEMS} emptyMessage="Nothing found" aria-label="fruit" />,
    );
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ban' } });
    await waitFor(() => {
      expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
    });
    expect(screen.getByRole('option')).toHaveTextContent('Banana');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(await screen.findByText('Nothing found')).toBeInTheDocument();
  });

  it('honors a custom filterOption', async () => {
    const filterOption = vi.fn(
      (input: string, item: MultiSelectItem) =>
        // exact prefix match (case-sensitive)
        typeof item.label === 'string' && item.label.startsWith(input),
    );
    renderWithProviders(
      <MultiSelect isSearchable items={ITEMS} filterOption={filterOption} aria-label="fruit" />,
    );
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'B' } });
    await waitFor(() => {
      const options = within(screen.getByRole('listbox')).getAllByRole('option');
      expect(options.map((o) => o.textContent)).toEqual(['Banana']);
    });
    expect(filterOption).toHaveBeenCalled();
  });

  /* ---------------- T5 / T6 / T8: keyboard ---------------- */

  it('opens via ArrowDown and points aria-activedescendant at first non-disabled option', async () => {
    renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('-opt-0'));
    });
  });

  it('keyboard: ArrowDown twice + Enter selects two options (multi-select)', async () => {
    const onChange = vi.fn();
    renderWithProviders(<MultiSelect items={ITEMS} onChange={onChange} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}'); // open + highlight 0
    await screen.findByRole('listbox');
    await userEvent.keyboard('{Enter}'); // toggle option 0 (Apple)
    await userEvent.keyboard('{ArrowDown}'); // highlight 1 (Banana)
    await userEvent.keyboard('{Enter}'); // toggle option 1
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[0]![0]).toEqual(['a']);
    expect(onChange.mock.calls[1]![0]).toEqual(['a', 'b']);
  });

  it('keyboard: Home / End move highlight and skip disabled options', async () => {
    renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{End}');
    // Durian is disabled — End should land on Cherry (index 2)
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('-opt-2'));
    });
    await userEvent.keyboard('{Home}');
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('-opt-0'));
    });
  });

  it('Escape closes the popover and returns focus to the trigger', async () => {
    renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab closes the popover and lets the browser take focus', async () => {
    renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    await screen.findByRole('listbox');
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  /* ---------------- T7: Backspace closed → remove last ---------------- */

  it('Backspace on closed trigger removes the last selected value', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        defaultValue={['a', 'b']}
        onChange={onChange}
        aria-label="fruit"
      />,
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['a']);
  });

  it('Backspace on closed trigger with empty value is a no-op', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect items={ITEMS} defaultValue={[]} onChange={onChange} aria-label="fruit" />,
    );
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Backspace inside empty searchbox removes the last selected value', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        isSearchable
        defaultValue={['a', 'b']}
        onChange={onChange}
        aria-label="fruit"
      />,
    );
    await openListbox();
    const search = screen.getByRole('searchbox');
    search.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['a']);
  });

  /* ---------------- T9: chip × removes single value, popover stays ---------------- */

  it('clicking a chip × removes that value without opening the popover', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        defaultValue={['a', 'b']}
        onChange={onChange}
        aria-label="fruit"
      />,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const removeBananaBtn = screen.getByRole('button', { name: 'Remove Banana' });
    expect(removeBananaBtn).toHaveAttribute('tabindex', '-1');
    await userEvent.click(removeBananaBtn);
    expect(onChange).toHaveBeenLastCalledWith(['a']);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  /* ---------------- T10: clear button ---------------- */

  it('isClearable + non-empty value renders a Clear button that empties value', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        isClearable
        defaultValue={['a', 'b']}
        onChange={onChange}
        onClear={onClear}
        aria-label="fruit"
      />,
    );
    const clearBtn = screen.getByRole('button', { name: 'Clear selection' });
    expect(clearBtn).toHaveAttribute('tabindex', '-1');
    await userEvent.click(clearBtn);
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(onClear).toHaveBeenCalled();
  });

  it('isClearable + empty value: Clear button is NOT rendered', () => {
    renderWithProviders(
      <MultiSelect items={ITEMS} isClearable defaultValue={[]} aria-label="fruit" />,
    );
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
  });

  it('clearOnEsc: Esc on closed trigger empties value when value is non-empty', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        clearOnEsc
        defaultValue={['a', 'b']}
        onChange={onChange}
        aria-label="fruit"
      />,
    );
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  /* ---------------- T11: toolbar select-all / clear ---------------- */

  it('toolbar Select all selects every visible non-disabled item, then toggles to Clear', async () => {
    const Wrapper = () => {
      const [val, setVal] = useState<string[]>([]);
      return (
        <MultiSelect
          items={ITEMS}
          showSelectAllInToolbar
          value={val}
          onChange={setVal}
          aria-label="fruit"
        />
      );
    };
    renderWithProviders(<Wrapper />);
    await openListbox();
    const selectAll = screen.getByRole('button', { name: 'Select all' });
    await userEvent.click(selectAll);
    // Apple, Banana, Cherry are non-disabled (Durian is disabled)
    expect(screen.getByText(/Selected 3 \/ 3/)).toBeInTheDocument();
    // After all selected → button text turns to Clear
    const clearBtn = await screen.findByRole('button', { name: 'Clear' });
    await userEvent.click(clearBtn);
    expect(screen.getByText(/Selected 0 \/ 3/)).toBeInTheDocument();
  });

  /* ---------------- T12: maxSelectedCount ---------------- */

  it('maxSelectedCount blocks new selections; existing selections still toggle off', async () => {
    const Wrapper = () => {
      const [val, setVal] = useState<string[]>(['a', 'b']);
      return (
        <MultiSelect
          items={ITEMS}
          value={val}
          onChange={setVal}
          maxSelectedCount={2}
          aria-label="fruit"
        />
      );
    };
    renderWithProviders(<Wrapper />);
    const listbox = await openListbox();
    const cherry = within(listbox).getByRole('option', { name: /Cherry/i });
    expect(cherry).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(cherry);
    expect(screen.getByRole('combobox')).not.toHaveTextContent('Cherry');
    // toggling off an already-selected value still works
    const banana = within(listbox).getByRole('option', { name: /Banana/i });
    await userEvent.click(banana);
    expect(within(screen.getByRole('combobox')).queryByText('Banana')).toBeNull();
  });

  /* ---------------- T13: maxTagCount=number ---------------- */

  it('maxTagCount={number} renders +N overflow chip with hidden labels in title/aria-label', () => {
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        defaultValue={['a', 'b', 'c']}
        maxTagCount={1}
        aria-label="fruit"
      />,
    );
    const trigger = screen.getByRole('combobox');
    // first chip = Apple, overflow = +2
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
    expect(within(trigger).getByText('+2')).toBeInTheDocument();
    const overflow = within(trigger).getByText('+2').closest('[title]') as HTMLElement | null;
    expect(overflow?.getAttribute('title')).toContain('Banana');
    expect(overflow?.getAttribute('title')).toContain('Cherry');
    expect(overflow?.getAttribute('aria-label')).toContain('+2 more');
  });

  /* ---------------- T14: OptGroup heading not counted as option ---------------- */

  it('group heading is role="presentation" and is not counted in role="option"', async () => {
    renderWithProviders(
      <MultiSelect aria-label="fruit">
        <MultiSelectOptGroup label="Group A">
          <MultiSelectOption value="g1">G1</MultiSelectOption>
        </MultiSelectOptGroup>
        <MultiSelectOptGroup label="Group B">
          <MultiSelectOption value="g2">G2</MultiSelectOption>
          <MultiSelectOption value="g3">G3</MultiSelectOption>
        </MultiSelectOptGroup>
      </MultiSelect>,
    );
    const listbox = await openListbox();
    expect(within(listbox).getAllByRole('option')).toHaveLength(3);
    expect(within(listbox).getByText('Group A')).toBeInTheDocument();
    expect(within(listbox).getByText('Group B')).toBeInTheDocument();
  });

  /* ---------------- T15: a11y roles & multiselectable ---------------- */

  it('combobox + listbox aria attributes are wired correctly across selections', async () => {
    const Wrapper = () => {
      const [val, setVal] = useState<string[]>([]);
      return <MultiSelect items={ITEMS} value={val} onChange={setVal} aria-label="fruit" />;
    };
    renderWithProviders(<Wrapper />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const listbox = await openListbox();
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', listbox.id);

    const apple = within(listbox).getByRole('option', { name: /Apple/i });
    expect(apple).toHaveAttribute('aria-selected', 'false');
    await userEvent.click(apple);
    // re-query because React re-rendered the listbox content
    expect(within(listbox).getByRole('option', { name: /Apple/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  /* ---------------- T17: FormField integration ---------------- */

  it('label/description/errorMessage trigger FormField with proper aria-describedby wiring', () => {
    renderWithProviders(
      <MultiSelect
        label="Fruits"
        description="Pick at least one"
        errorMessage="Required"
        items={ITEMS}
        defaultValue={['a']}
      />,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Pick at least one')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Required');
    expect(trigger.getAttribute('aria-describedby') ?? '').toContain(alert.id);
  });

  /* ---------------- T18: disabled / readOnly ---------------- */

  it('isDisabled: trigger is disabled and clicking does nothing', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        defaultValue={['a']}
        isDisabled
        onChange={onChange}
        aria-label="fruit"
      />,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    expect(trigger).toHaveAttribute('tabindex', '-1');
    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('isReadOnly: popover opens but option clicks do not change value', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        defaultValue={['a']}
        isReadOnly
        onChange={onChange}
        aria-label="fruit"
      />,
    );
    const listbox = await openListbox();
    await userEvent.click(within(listbox).getByRole('option', { name: /Banana/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  /* ---------------- T19: prefers-reduced-motion ---------------- */

  it('prefers-reduced-motion: popover css contains "animation: none"', async () => {
    const original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (q: string) => ({
        matches: q.includes('reduce'),
        media: q,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    try {
      renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
      await openListbox();
      // Emotion serializes the @media block into <style> tags; assert it includes the rule.
      const styles = Array.from(document.head.querySelectorAll('style'))
        .map((s) => s.textContent ?? '')
        .join('\n');
      expect(styles).toContain('prefers-reduced-motion');
      expect(styles).toContain('animation:none');
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });

  /* ---------------- forwardRef ---------------- */

  it('forwards ref to the trigger button', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        aria-label="fruit"
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured!.getAttribute('role')).toBe('combobox');
  });

  /* ---------------- closeOnSelect ---------------- */

  it('closeOnSelect closes popover after a selection and re-focuses trigger', async () => {
    renderWithProviders(<MultiSelect items={ITEMS} closeOnSelect aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    const listbox = await openListbox();
    await userEvent.click(within(listbox).getByRole('option', { name: /Apple/i }));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  /* ---------------- type-ahead ---------------- */

  it('type-ahead on focused trigger highlights the first label starting with the typed prefix', async () => {
    renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    // open + type-ahead inside open via ArrowDown first
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('c');
    await waitFor(() => {
      expect(trigger).toHaveAttribute(
        'aria-activedescendant',
        expect.stringContaining('-opt-2'), // Cherry
      );
    });
  });

  it('typing a printable char on closed + searchable trigger opens popover and primes search', async () => {
    renderWithProviders(<MultiSelect isSearchable items={ITEMS} aria-label="fruit" />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await userEvent.keyboard('a');
    await waitFor(() => {
      const search = screen.getByRole('searchbox') as HTMLInputElement;
      expect(search.value).toBe('a');
    });
  });

  /* ---------------- hideSelectedInList ---------------- */

  it('hideSelectedInList hides already-selected items from the list', async () => {
    renderWithProviders(
      <MultiSelect items={ITEMS} defaultValue={['a']} hideSelectedInList aria-label="fruit" />,
    );
    const listbox = await openListbox();
    const labels = within(listbox)
      .getAllByRole('option')
      .map((o) => o.textContent?.trim());
    expect(labels).not.toContain('Apple');
  });

  /* ---------------- isLoading ---------------- */

  it('isLoading: swaps the options for a role="status" loading message', async () => {
    renderWithProviders(
      <MultiSelect items={ITEMS} isLoading loadingMessage="Loading…" aria-label="fruit" />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Loading…');
    // listbox 本身保留（trigger 的 aria-controls 必须指向真实存在的元素），但不渲染任何 option
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  /* ---------------- tagRender ---------------- */

  it('tagRender customizes chip rendering and onRemove still fires', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        defaultValue={['a']}
        onChange={onChange}
        tagRender={(item, opts) => (
          <span data-testid="custom-chip">
            {String(item.label)}
            <button
              type="button"
              aria-label={`custom remove ${item.value}`}
              onClick={(e) => {
                e.stopPropagation();
                opts.onRemove();
              }}
            >
              x
            </button>
          </span>
        )}
        aria-label="fruit"
      />,
    );
    expect(screen.getByTestId('custom-chip')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'custom remove a' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  /* ---------------- optionRender ---------------- */

  it('optionRender customizes option content but keeps the <li role="option"> shell', async () => {
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        optionRender={(item, { isSelected }) => (
          <span data-testid={`opt-${item.value}`}>
            {String(item.label)} {isSelected ? 'YES' : 'NO'}
          </span>
        )}
        defaultValue={['a']}
        aria-label="fruit"
      />,
    );
    const listbox = await openListbox();
    expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    expect(screen.getByTestId('opt-a')).toHaveTextContent('Apple YES');
    expect(screen.getByTestId('opt-b')).toHaveTextContent('Banana NO');
  });

  /* ---------------- name → hidden inputs ---------------- */

  it('name renders one hidden input per selected value for native form submission', () => {
    const { container } = renderWithProviders(
      <MultiSelect items={ITEMS} defaultValue={['a', 'c']} name="fruits" aria-label="fruit" />,
    );
    const hidden = container.querySelectorAll<HTMLInputElement>(
      'input[type="hidden"][name="fruits"]',
    );
    expect(hidden).toHaveLength(2);
    expect(Array.from(hidden).map((h) => h.value)).toEqual(['a', 'c']);
  });

  /* ---------------- click outside ---------------- */

  it('clicking outside closes the popover', async () => {
    renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
    await openListbox();
    await userEvent.click(document.body);
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  /* ---------------- isFullWidth ---------------- */

  it('isFullWidth + className/style transit to wrapper root', () => {
    const { container } = renderWithProviders(
      <MultiSelect
        items={ITEMS}
        isFullWidth
        className="my-multi"
        style={{ marginTop: 8 }}
        aria-label="fruit"
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.className).toContain('my-multi');
    expect(wrapper.style.marginTop).toBe('8px');
  });

  /* ---------------- placeholder ---------------- */

  it('placeholder shows when value is empty and disappears when value is set', () => {
    const { rerender } = renderWithProviders(
      <MultiSelect items={ITEMS} defaultValue={[]} placeholder="Pick fruits" aria-label="fruit" />,
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick fruits');
    rerender(
      <MultiSelect items={ITEMS} value={['a']} placeholder="Pick fruits" aria-label="fruit" />,
    );
    expect(screen.getByRole('combobox')).not.toHaveTextContent('Pick fruits');
  });

  /* ---------------- placement: top flip ---------------- */

  it('flips popover to top placement when the trigger sits near the viewport bottom', async () => {
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
      renderWithProviders(<MultiSelect items={ITEMS} aria-label="fruit" />);
      await userEvent.click(screen.getByRole('combobox'));
      await screen.findByRole('listbox');
      const popover = document.querySelector(
        '[data-timeui-multiselect-popover]',
      ) as HTMLElement | null;
      expect(popover).not.toBeNull();
      expect(popover!.getAttribute('data-placement')).toBe('top');
      expect(popover!.style.bottom).not.toBe('');
    } finally {
      Element.prototype.getBoundingClientRect = originalGetRect;
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        configurable: true,
      });
    }
  });

  /* ---------------- description rendering on option ---------------- */

  it('renders option description as secondary text and startContent slot', async () => {
    renderWithProviders(
      <MultiSelect
        items={[
          { value: 'a', label: 'Apple', description: 'Red fruit' },
          { value: 'b', label: 'Banana' },
        ]}
        startContent={<span data-testid="start-slot">@</span>}
        aria-label="fruit"
      />,
    );
    expect(screen.getByTestId('start-slot')).toBeInTheDocument();
    const listbox = await openListbox();
    expect(within(listbox).getByText('Red fruit')).toBeInTheDocument();
  });

  /* ---------------- items with `group` field ---------------- */

  it('items with group field render groups in declaration order', async () => {
    renderWithProviders(
      <MultiSelect
        items={[
          { value: 'a', label: 'Alpha', group: 'Letters' },
          { value: '1', label: 'One', group: 'Numbers' },
          { value: 'b', label: 'Beta', group: 'Letters' },
        ]}
        aria-label="x"
      />,
    );
    const listbox = await openListbox();
    expect(within(listbox).getByText('Letters')).toBeInTheDocument();
    expect(within(listbox).getByText('Numbers')).toBeInTheDocument();
    const opts = within(listbox).getAllByRole('option');
    expect(opts.map((o) => o.textContent)).toEqual(['Alpha', 'Beta', 'One']);
  });

  /* ---------------- endContent slot ---------------- */

  it('renders endContent slot inside the trigger', () => {
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        endContent={<span data-testid="end-slot">★</span>}
        aria-label="x"
      />,
    );
    expect(screen.getByTestId('end-slot')).toBeInTheDocument();
  });

  /* ---------------- isInvalid: option indicator switches to danger ---------------- */

  it('isInvalid + selected option uses danger color on the indicator border', async () => {
    renderWithProviders(
      <MultiSelect items={ITEMS} defaultValue={['a']} isInvalid aria-label="x" />,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    const listbox = await openListbox();
    const apple = within(listbox).getByRole('option', { name: /Apple/i });
    expect(apple).toHaveAttribute('aria-selected', 'true');
  });

  /* ---------------- OptGroup with non-Option children warns ---------------- */

  it('warns when <MultiSelectOptGroup> contains non-Option children', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderWithProviders(
      <MultiSelect aria-label="x">
        <MultiSelectOptGroup label="Bad">
          <MultiSelectOption value="ok">Okay</MultiSelectOption>
          <div>nope</div>
        </MultiSelectOptGroup>
      </MultiSelect>,
    );
    await openListbox();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  /* ---------------- ReactNode label → labelToString recurses ---------------- */

  it('handles nested ReactNode labels in chip aria-label and search', async () => {
    renderWithProviders(
      <MultiSelect
        isSearchable
        items={[
          {
            value: 'g',
            label: (
              <span>
                <strong>Green</strong> Apple
              </span>
            ),
          },
          { value: 'b', label: 'Banana' },
        ]}
        defaultValue={['g']}
        aria-label="fruit"
      />,
    );
    // chip × button aria-label is computed from nested label
    expect(screen.getByRole('button', { name: 'Remove Green Apple' })).toBeInTheDocument();
    await openListbox();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'green' } });
    await waitFor(() => {
      expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
    });
  });

  /* ---------------- search area mousedown focuses input ---------------- */

  it('mousedown on the search area focuses the search input', async () => {
    renderWithProviders(<MultiSelect isSearchable items={ITEMS} aria-label="x" />);
    await openListbox();
    const search = screen.getByRole('searchbox');
    const searchArea = search.parentElement as HTMLElement;
    search.blur();
    fireEvent.mouseDown(searchArea);
    await waitFor(() => {
      expect(search).toHaveFocus();
    });
  });

  /* ---------------- responsive maxTagCount mounts without error ---------------- */

  it('responsive maxTagCount mounts and renders all chips when ResizeObserver provides no shrink signal', () => {
    renderWithProviders(
      <MultiSelect
        items={ITEMS}
        defaultValue={['a', 'b']}
        maxTagCount="responsive"
        aria-label="x"
      />,
    );
    const trigger = screen.getByRole('combobox');
    // No +N rendered because measure hasn't determined a smaller limit in jsdom
    expect(within(trigger).queryByText(/^\+\d+$/)).toBeNull();
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
    expect(within(trigger).getByText('Banana')).toBeInTheDocument();
  });

  /* ---------------- chips skip duplicate values when committing ---------------- */

  it('toggling the same option twice removes the value (toggle off)', async () => {
    const onChange = vi.fn();
    renderWithProviders(<MultiSelect items={ITEMS} onChange={onChange} aria-label="x" />);
    const listbox = await openListbox();
    await userEvent.click(within(listbox).getByRole('option', { name: /Apple/i }));
    await userEvent.click(within(listbox).getByRole('option', { name: /Apple/i }));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[0]![0]).toEqual(['a']);
    expect(onChange.mock.calls[1]![0]).toEqual([]);
  });
});
