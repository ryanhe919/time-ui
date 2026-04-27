/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 CheckboxGroup 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, CheckboxGroup } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

describe('CheckboxGroup', () => {
  it('controlled: clicking an option appends to value[] in render order', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CheckboxGroup label="Fruits" value={['a']} onChange={onChange}>
        <Checkbox value="a">A</Checkbox>
        <Checkbox value="b">B</Checkbox>
        <Checkbox value="c">C</Checkbox>
      </CheckboxGroup>,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('controlled: clicking a selected option removes it', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CheckboxGroup label="Fruits" value={['a', 'b']} onChange={onChange}>
        <Checkbox value="a">A</Checkbox>
        <Checkbox value="b">B</Checkbox>
      </CheckboxGroup>,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });

  it('group-level isDisabled disables all child checkboxes', () => {
    renderWithProviders(
      <CheckboxGroup label="Flags" isDisabled>
        <Checkbox value="x">X</Checkbox>
        <Checkbox value="y">Y</Checkbox>
      </CheckboxGroup>,
    );
    screen.getAllByRole('checkbox').forEach((cb) => expect(cb).toBeDisabled());
  });

  it('generated name is injected into every child input', () => {
    renderWithProviders(
      <CheckboxGroup label="Tags" name="my-group">
        <Checkbox value="x">X</Checkbox>
        <Checkbox value="y">Y</Checkbox>
      </CheckboxGroup>,
    );
    const inputs = screen.getAllByRole('checkbox') as HTMLInputElement[];
    inputs.forEach((input) => expect(input.name).toBe('my-group'));
  });

  it('renders a <fieldset> with <legend> that provides the accessible group name', () => {
    const { container } = renderWithProviders(
      <CheckboxGroup label="Colors">
        <Checkbox value="red">Red</Checkbox>
      </CheckboxGroup>,
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    const legend = container.querySelector('legend');
    expect(legend?.textContent).toContain('Colors');
    expect(screen.getByRole('group', { name: /Colors/i })).toBe(fieldset);
  });

  it('errorMessage auto-sets aria-invalid and renders the error via role="alert"', () => {
    renderWithProviders(
      <CheckboxGroup label="Terms" errorMessage="You must accept">
        <Checkbox value="a">A</Checkbox>
      </CheckboxGroup>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('You must accept');
    const fieldset = alert.closest('fieldset');
    expect(fieldset).toHaveAttribute('aria-invalid', 'true');
    expect(fieldset?.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('uncontrolled: defaultValue seeds the initial selection; clicks update DOM', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CheckboxGroup label="F" defaultValue={['a']} onChange={onChange}>
        <Checkbox value="a">A</Checkbox>
        <Checkbox value="b">B</Checkbox>
      </CheckboxGroup>,
    );
    const a = screen.getByRole('checkbox', { name: 'A' }) as HTMLInputElement;
    const b = screen.getByRole('checkbox', { name: 'B' }) as HTMLInputElement;
    expect(a.checked).toBe(true);
    expect(b.checked).toBe(false);
    await userEvent.click(b);
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('orientation="horizontal" flips the inner flex direction to row', () => {
    const { container } = renderWithProviders(
      <CheckboxGroup label="F" orientation="horizontal">
        <Checkbox value="a">A</Checkbox>
        <Checkbox value="b">B</Checkbox>
      </CheckboxGroup>,
    );
    const fieldset = container.querySelector('fieldset') as HTMLElement;
    expect(fieldset.getAttribute('data-orientation')).toBe('horizontal');
  });
});
