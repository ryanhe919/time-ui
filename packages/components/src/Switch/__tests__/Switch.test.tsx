/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Switch 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Switch } from '../';

const getSwitchInput = (): HTMLInputElement => screen.getByRole('switch') as HTMLInputElement;

describe('Switch', () => {
  it('is controlled: clicking fires onChange with the next boolean', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Switch isSelected={true} onChange={onChange} aria-label="wifi" />);
    const input = getSwitchInput();
    expect(input.checked).toBe(true);
    await userEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('is uncontrolled: defaultIsSelected starts checked and updates DOM locally', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Switch defaultIsSelected onChange={onChange} aria-label="wifi" />);
    const input = getSwitchInput();
    expect(input.checked).toBe(true);
    await userEvent.click(input);
    expect(input.checked).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('has role="switch" and aria-checked reflecting the current state', () => {
    const { rerender } = renderWithProviders(<Switch isSelected={false} aria-label="x" />);
    const input = getSwitchInput();
    expect(input).toHaveAttribute('role', 'switch');
    expect(input).toHaveAttribute('aria-checked', 'false');
    rerender(<Switch isSelected={true} aria-label="x" />);
    expect(getSwitchInput()).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles on Space AND Enter (Enter is a manual binding)', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Switch defaultIsSelected={false} onChange={onChange} aria-label="x" />);
    const input = getSwitchInput();
    input.focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('isReadOnly swallows click/keyboard without calling onChange or flipping DOM', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Switch defaultIsSelected={false} isReadOnly onChange={onChange} aria-label="x" />,
    );
    const input = getSwitchInput();
    await userEvent.click(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.checked).toBe(false);
    input.focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(input.checked).toBe(false);
  });

  it('submits name + value to the enclosing form when selected', () => {
    const { container } = renderWithProviders(
      <form data-testid="f">
        <Switch name="notif" value="on" defaultIsSelected aria-label="x" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const fd = new FormData(form);
    expect(fd.get('notif')).toBe('on');
  });

  it('does not submit form data when unchecked', () => {
    const { container } = renderWithProviders(
      <form>
        <Switch name="notif" value="on" aria-label="x" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const fd = new FormData(form);
    expect(fd.get('notif')).toBeNull();
  });

  it('forwards ref to the <input>', () => {
    let captured: HTMLInputElement | null = null;
    renderWithProviders(
      <Switch
        aria-label="x"
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLInputElement);
  });

  it('isDisabled blocks interaction and flips neither state nor onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Switch isDisabled defaultIsSelected={false} onChange={onChange} aria-label="x" />,
    );
    const input = getSwitchInput();
    expect(input).toBeDisabled();
    await userEvent.click(input, { pointerEventsCheck: 0 });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.checked).toBe(false);
  });

  it('isInvalid sets aria-invalid="true" on the input', () => {
    renderWithProviders(<Switch isInvalid defaultIsSelected aria-label="x" />);
    expect(getSwitchInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards required and describedby attributes', () => {
    renderWithProviders(
      <Switch isRequired aria-label="x" aria-describedby="help-id" aria-labelledby="label-id" />,
    );
    const input = getSwitchInput();
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'help-id');
    expect(input).toHaveAttribute('aria-labelledby', 'label-id');
  });

  it('renders startContent / endContent slots that track the selected state', () => {
    const { rerender } = renderWithProviders(
      <Switch
        isSelected={false}
        aria-label="x"
        startContent={<span data-testid="on-icon">ON</span>}
        endContent={<span data-testid="off-icon">OFF</span>}
      />,
    );
    expect(screen.getByTestId('on-icon')).toBeInTheDocument();
    expect(screen.getByTestId('off-icon')).toBeInTheDocument();
    rerender(
      <Switch
        isSelected={true}
        aria-label="x"
        startContent={<span data-testid="on-icon">ON</span>}
        endContent={<span data-testid="off-icon">OFF</span>}
      />,
    );
    expect(screen.getByTestId('on-icon')).toBeInTheDocument();
  });

  it('renders children label text next to the switch', () => {
    renderWithProviders(<Switch aria-label="x">Wi-Fi</Switch>);
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
  });

  it('emits the prefers-reduced-motion override rule so the thumb does not animate', () => {
    renderWithProviders(<Switch defaultIsSelected aria-label="x" />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(
      styles.match(/@media \(prefers-reduced-motion: reduce\)[^}]*transition:\s*none/g) ?? [],
    ).not.toHaveLength(0);
  });
});
