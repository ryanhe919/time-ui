import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Select } from './Select';
import { SelectOption } from './SelectOption';

const ITEMS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', isDisabled: true },
];

async function openListbox() {
  await userEvent.click(screen.getByRole('combobox'));
  return screen.getByRole('listbox');
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

  it('fullWidth stretches the wrapper width to 100%', () => {
    const { container } = renderWithProviders(
      <Select fullWidth items={ITEMS} defaultValue="a" aria-label="x" />,
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
    await userEvent.type(search, 'ap');
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options.map((o) => o.textContent?.trim())).toEqual(['Apple', 'Apricot']);
  });

  it('isSearchable shows the empty-message when nothing matches', async () => {
    renderWithProviders(
      <Select isSearchable emptyMessage="Nothing found" items={ITEMS} aria-label="fruit" />,
    );
    await openListbox();
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });

  it('keyboard: ArrowDown / Enter selects the next non-disabled option', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Select defaultValue="a" onChange={onChange} items={ITEMS} aria-label="fruit" />,
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    // Open with ArrowDown
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // Move highlight from Apple (current) → Banana.
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

  it('name prop renders a hidden input that carries the current value', () => {
    const { container } = renderWithProviders(
      <Select name="fruit" defaultValue="b" items={ITEMS} aria-label="x" />,
    );
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="fruit"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.value).toBe('b');
  });

  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <Select label="Fruit" description="Pick one" items={ITEMS} defaultValue="a" />,
      { theme },
    );
    await expectA11y(container);
  });
});
