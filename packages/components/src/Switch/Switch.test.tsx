import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Switch } from './Switch';

/**
 * Helper — Switch hides the `<input>` visually, so `getByRole('switch')` is
 * the canonical accessor (it reads the `role="switch"`). The label click
 * target itself is also the full `<label>` wrapper.
 */
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

  it('is uncontrolled: defaultSelected starts checked and updates DOM locally', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Switch defaultSelected onChange={onChange} aria-label="wifi" />);
    const input = getSwitchInput();
    expect(input.checked).toBe(true);
    await userEvent.click(input);
    // DOM flips to false (uncontrolled) and onChange fires with the new value.
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
    renderWithProviders(<Switch defaultSelected={false} onChange={onChange} aria-label="x" />);
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
      <Switch defaultSelected={false} isReadOnly onChange={onChange} aria-label="x" />,
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
    // Render inside a <form> and verify FormData reads the value.
    const { container } = renderWithProviders(
      <form data-testid="f">
        <Switch name="notif" value="on" defaultSelected aria-label="x" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const fd = new FormData(form);
    expect(fd.get('notif')).toBe('on');
  });

  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <Switch defaultSelected aria-label="notifications" />,
      { theme },
    );
    await expectA11y(container);
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
      <Switch isDisabled defaultSelected={false} onChange={onChange} aria-label="x" />,
    );
    const input = getSwitchInput();
    expect(input).toBeDisabled();
    // With pointer-events:none on the label `userEvent.click` bails out
    // before the event fires; force it through to confirm the wired handler
    // still respects `isDisabled`.
    await userEvent.click(input, { pointerEventsCheck: 0 });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.checked).toBe(false);
  });

  it('isInvalid sets aria-invalid="true" on the input', () => {
    renderWithProviders(<Switch isInvalid defaultSelected aria-label="x" />);
    expect(getSwitchInput()).toHaveAttribute('aria-invalid', 'true');
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
    // Both slots are rendered unconditionally — opacity drives visibility.
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
    // Still in DOM when flipped on.
    expect(screen.getByTestId('on-icon')).toBeInTheDocument();
  });

  it('emits the prefers-reduced-motion override rule so the thumb does not animate', () => {
    // jsdom doesn't evaluate @media queries in getComputedStyle, so we
    // inspect the emitted stylesheet directly — the presence of the
    // `prefers-reduced-motion: reduce { transition: none }` block is the
    // guarantee real browsers will honour.
    renderWithProviders(<Switch defaultSelected aria-label="x" />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(
      styles.match(/@media \(prefers-reduced-motion: reduce\)[^}]*transition:\s*none/g) ?? [],
    ).not.toHaveLength(0);
  });
});
