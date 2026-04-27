/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Radio 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Radio, RadioGroup } from '../';

describe('Radio (standalone)', () => {
  it('warns once when rendered outside a RadioGroup and disables itself', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithProviders(<Radio value="a">Orphan</Radio>);
    const input = screen.getByRole('radio') as HTMLInputElement;
    expect(input).toBeDisabled();
    expect(warn).toHaveBeenCalled();
    const firstArg = warn.mock.calls[0]?.[0] as string;
    expect(firstArg).toContain('must be rendered inside a <RadioGroup>');
    warn.mockRestore();
  });

  it('forwards ref to the native <input> element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ref = { current: null as HTMLInputElement | null };
    renderWithProviders(
      <RadioGroup label="g">
        <Radio ref={ref} value="a">
          A
        </Radio>
      </RadioGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('radio');
    warn.mockRestore();
  });
});

describe('Radio (inside RadioGroup)', () => {
  it('renders per-item description as a sibling caption', () => {
    renderWithProviders(
      <RadioGroup label="g" defaultValue="a">
        <Radio value="a" description="Detailed note for A">
          Option A
        </Radio>
      </RadioGroup>,
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
    const desc = screen.getByText('Detailed note for A');
    expect(desc.getAttribute('data-description')).toBe('');
  });

  it('per-item isDisabled disables only that radio (group enabled)', () => {
    renderWithProviders(
      <RadioGroup label="g">
        <Radio value="a" isDisabled>
          A
        </Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const a = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement;
    const b = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement;
    expect(a).toBeDisabled();
    expect(b).not.toBeDisabled();
  });

  it('selecting updates the data-selected attribute on the label (focus-ring host)', async () => {
    renderWithProviders(
      <RadioGroup label="g">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const bInput = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement;
    const bLabel = bInput.closest('label') as HTMLElement;
    expect(bLabel).not.toBeNull();
    expect(bLabel.getAttribute('data-selected')).toBeNull();
    await userEvent.click(bInput);
    expect(bLabel.getAttribute('data-selected')).toBe('true');
  });

  it('group-level isInvalid flows to each Radio (aria-invalid on the input)', () => {
    renderWithProviders(
      <RadioGroup label="g" isInvalid>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    screen.getAllByRole('radio').forEach((r) => expect(r).toHaveAttribute('aria-invalid', 'true'));
  });
});
