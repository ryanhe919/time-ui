/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 FormField 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { FormField } from '../';

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
    const input = screen.getByTestId('field') as HTMLInputElement & { isDisabled?: unknown };
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

  it('ReactNode label uses aria-labelledby on the child', () => {
    renderWithProviders(
      <FormField label={<span>Custom</span>} id="f6">
        <NativeField />
      </FormField>,
    );
    const input = screen.getByTestId('field');
    const labelledBy = input.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const labelEl = labelledBy ? document.getElementById(labelledBy) : null;
    expect(labelEl?.textContent).toContain('Custom');
  });

  it('ReactNode label with isRequired renders the visual star and keeps aria-labelledby', () => {
    renderWithProviders(
      <FormField
        label={
          <span>
            Custom <strong>Label</strong>
          </span>
        }
        id="f7"
        isRequired
      >
        <NativeField />
      </FormField>,
    );
    const input = screen.getByTestId('field');
    const labelledBy = input.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const labelEl = labelledBy ? document.getElementById(labelledBy) : null;
    expect(labelEl?.textContent).toContain('Custom Label*');
    expect(labelEl?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('merges existing aria-describedby ids without duplicates', () => {
    renderWithProviders(
      <FormField label="Email" id="f8" description="Help text" errorMessage="Required">
        <NativeField aria-describedby="external-id f8-description external-id" />
      </FormField>,
    );
    const ids = screen.getByTestId('field').getAttribute('aria-describedby');
    expect(ids).toBe('f8-description f8-error external-id');
  });

  it('supports left label placement layout branch', () => {
    const { container } = renderWithProviders(
      <FormField label="Email" id="f9" labelPlacement="start">
        <NativeField />
      </FormField>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('role', 'group');
    expect(document.head.textContent ?? '').toContain('flex-direction:row');
    expect(document.head.textContent ?? '').toContain('align-items:flex-start');
    expect(document.head.textContent ?? '').toContain('width:30%');
  });

  it('omits group role when no label is provided and still wires descriptions', () => {
    const { container } = renderWithProviders(
      <FormField id="f10" description="Only help text">
        <NativeField />
      </FormField>,
    );
    expect(container.firstElementChild).not.toHaveAttribute('role');
    expect(screen.getByTestId('field').getAttribute('aria-describedby')).toBe('f10-description');
  });

  it('propagates required and disabled to native DOM children', () => {
    renderWithProviders(
      <FormField id="f11" isRequired isDisabled>
        <input data-testid="native-dom" />
      </FormField>,
    );
    const input = screen.getByTestId('native-dom');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('disabled');
    expect(input).toHaveAttribute('aria-required', 'true');
  });
});
