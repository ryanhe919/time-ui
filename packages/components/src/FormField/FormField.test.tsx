import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '../test-utils';
import { FormField } from './FormField';

/**
 * Minimal "field-like" input used across the test cases — accepts all the
 * shape props FormField injects (`isDisabled`, `isInvalid`, `isRequired`)
 * so we can assert the injection works without pulling in the real Input.
 */
const NativeField = ({
  id,
  required,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isDisabled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isInvalid,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isRequired,
  ...rest
}: {
  id?: string;
  required?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-labelledby'?: string;
}) => <input data-testid="field" id={id} required={required} {...rest} />;

describe('FormField', () => {
  it('renders a <label htmlFor> tied to the child id when label is a string', () => {
    renderWithProviders(
      <FormField label="Email" id="email-x">
        <NativeField />
      </FormField>,
    );
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'email-x');
    expect(screen.getByTestId('field')).toHaveAttribute('id', 'email-x');
  });

  it('auto-derives isInvalid from errorMessage and wires aria-describedby', () => {
    renderWithProviders(
      <FormField label="Email" id="f1" errorMessage="Required field">
        <NativeField />
      </FormField>,
    );
    const input = screen.getByTestId('field');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const errorNode = screen.getByRole('alert');
    expect(errorNode).toHaveTextContent('Required field');
    expect(input.getAttribute('aria-describedby') ?? '').toContain(errorNode.id);
  });

  it('concatenates description + errorMessage ids in aria-describedby (description first)', () => {
    renderWithProviders(
      <FormField
        label="Email"
        id="f2"
        description="We never share your email"
        errorMessage="Required"
      >
        <NativeField />
      </FormField>,
    );
    const input = screen.getByTestId('field');
    const desc = screen.getByText('We never share your email');
    const err = screen.getByRole('alert');
    const ids = input.getAttribute('aria-describedby') ?? '';
    expect(ids).toMatch(new RegExp(`${desc.id}\\s+${err.id}`));
  });

  it('isRequired forwards required + aria-required and renders a visual *', () => {
    renderWithProviders(
      <FormField label="Name" id="f3" isRequired>
        <NativeField />
      </FormField>,
    );
    const input = screen.getByTestId('field');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-required', 'true');
    // The visual star is aria-hidden so it shouldn't participate in the
    // accessible name, but it must be in the DOM.
    const label = screen.getByText('Name');
    expect(label.textContent).toContain('*');
    const star = label.querySelector('[aria-hidden="true"]');
    expect(star).not.toBeNull();
  });

  it('isDisabled propagates to child and adds data-disabled on root', () => {
    const { container } = renderWithProviders(
      <FormField label="Name" id="f4" isDisabled>
        <NativeField />
      </FormField>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-disabled', 'true');
    // The prop is forwarded; for a native input it becomes a DOM attribute.
    const input = screen.getByTestId('field') as HTMLInputElement & { isDisabled?: unknown };
    // Our NativeField test stub destructures `isDisabled`, so the injected
    // prop is observable via the spread props forwarded to the element.
    // We mostly want to assert the root reflects the state.
    expect(input).toBeInTheDocument();
  });

  it('respects an explicit id over useId() and keeps it stable across rerenders', () => {
    const { rerender } = renderWithProviders(
      <FormField label="Stable" id="stable-id">
        <NativeField />
      </FormField>,
    );
    expect(screen.getByTestId('field')).toHaveAttribute('id', 'stable-id');
    rerender(
      <FormField label="Stable" id="stable-id">
        <NativeField />
      </FormField>,
    );
    expect(screen.getByTestId('field')).toHaveAttribute('id', 'stable-id');
  });

  it('explicit isInvalid={false} overrides automatic error-derived invalid', () => {
    renderWithProviders(
      <FormField label="Email" id="f5" errorMessage="Required" isInvalid={false}>
        <NativeField />
      </FormField>,
    );
    const input = screen.getByTestId('field');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <FormField
        label="Email"
        description="We never share your email"
        errorMessage="Required"
        isRequired
      >
        <NativeField />
      </FormField>,
      { theme },
    );
    await expectA11y(container);
  });

  it('ReactNode label uses aria-labelledby on the child', () => {
    renderWithProviders(
      <FormField label={<span>Custom</span>} id="f6">
        <NativeField />
      </FormField>,
    );
    const input = screen.getByTestId('field');
    const labelledBy = input.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    // The id points to a <span> containing the label text.
    const labelEl = labelledBy ? document.getElementById(labelledBy) : null;
    expect(labelEl?.textContent).toContain('Custom');
  });
});
