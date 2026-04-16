/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Checkbox 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Checkbox } from './Checkbox';

const getInput = (): HTMLInputElement => screen.getByRole('checkbox') as HTMLInputElement;

describe('Checkbox', () => {
  it('controlled: clicking toggles onChange with the opposite of isSelected', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Checkbox isSelected={false} onChange={onChange}>
        Accept
      </Checkbox>,
    );
    await userEvent.click(getInput());
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(
      <Checkbox isSelected={true} onChange={onChange}>
        Accept
      </Checkbox>,
    );
    await userEvent.click(getInput());
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('uncontrolled: defaultSelected renders initial checked; clicks update DOM only', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Checkbox defaultSelected onChange={onChange}>
        Subscribe
      </Checkbox>,
    );
    const input = getInput();
    expect(input.checked).toBe(true);
    await userEvent.click(input);
    expect(input.checked).toBe(false);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('isIndeterminate syncs to DOM and clicking flips indeterminate off (native behavior)', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Checkbox isIndeterminate onChange={onChange} defaultSelected={false}>
        Some
      </Checkbox>,
    );
    const input = getInput();
    expect(input.indeterminate).toBe(true);

    await userEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(
      <Checkbox isIndeterminate={false} defaultSelected onChange={onChange}>
        Some
      </Checkbox>,
    );
    expect(getInput().indeterminate).toBe(false);
  });

  it('isDisabled sets disabled attribute and prevents interaction', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Checkbox isDisabled onChange={onChange}>
        Nope
      </Checkbox>,
    );
    const input = getInput();
    expect(input).toBeDisabled();
    await userEvent.click(input, { pointerEventsCheck: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards ref to the native <input> element', () => {
    const ref = { current: null as HTMLInputElement | null };
    renderWithProviders(<Checkbox ref={ref}>Ref</Checkbox>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('checkbox');
  });

  it('Space key toggles via the native input', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Checkbox onChange={onChange} defaultSelected={false}>
        Toggle
      </Checkbox>,
    );
    const input = getInput();
    input.focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('isReadOnly prevents toggling via click (event.preventDefault in the handler)', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Checkbox isReadOnly defaultSelected={false} onChange={onChange}>
        RO
      </Checkbox>,
    );
    const input = getInput();
    await userEvent.click(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.checked).toBe(false);
  });

  it('onChangeEvent exposes the native ChangeEvent', async () => {
    const onChangeEvent = vi.fn();
    renderWithProviders(
      <Checkbox defaultSelected={false} onChangeEvent={onChangeEvent}>
        X
      </Checkbox>,
    );
    await userEvent.click(getInput());
    expect(onChangeEvent).toHaveBeenCalled();
    const [event] = onChangeEvent.mock.calls.at(-1) as [Event];
    expect((event as unknown as { target: HTMLInputElement }).target).toBeInstanceOf(
      HTMLInputElement,
    );
  });

  it('isInvalid sets aria-invalid="true" on the input', () => {
    renderWithProviders(
      <Checkbox isInvalid defaultSelected>
        Err
      </Checkbox>,
    );
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(<Checkbox defaultSelected>Accessible</Checkbox>, {
      theme,
    });
    await expectA11y(container);
  });
});
