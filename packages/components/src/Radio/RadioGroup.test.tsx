import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

describe('RadioGroup', () => {
  it('controlled: clicking a radio triggers onChange with its value', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <RadioGroup label="Size" value="a" onChange={onChange}>
        <Radio value="a">Small</Radio>
        <Radio value="b">Medium</Radio>
        <Radio value="c">Large</Radio>
      </RadioGroup>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Medium' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('uncontrolled: defaultValue selects initially; clicks update DOM', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <RadioGroup label="Size" defaultValue="a" onChange={onChange}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const a = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement;
    const b = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement;
    expect(a.checked).toBe(true);
    await userEvent.click(b);
    expect(b.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('every Radio shares the group name', () => {
    renderWithProviders(
      <RadioGroup label="Letters" name="letters">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </RadioGroup>,
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    radios.forEach((r) => expect(r.name).toBe('letters'));
  });

  it('keyboard arrow moves selection to the next radio (native radio group behavior)', async () => {
    renderWithProviders(
      <RadioGroup label="Size" defaultValue="a">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </RadioGroup>,
    );
    const a = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement;
    a.focus();
    expect(a).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    const b = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement;
    expect(b.checked).toBe(true);
  });

  it('group-level isDisabled disables every Radio', () => {
    renderWithProviders(
      <RadioGroup label="Size" isDisabled>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });

  it('renders a fieldset/legend and role="radiogroup" + aria-labelledby', () => {
    const { container } = renderWithProviders(
      <RadioGroup label="Flavor">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    const legend = container.querySelector('legend');
    expect(legend?.textContent).toContain('Flavor');
    const rg = screen.getByRole('radiogroup');
    expect(rg.getAttribute('aria-labelledby')).toBe(legend?.id);
  });

  it('errorMessage sets aria-invalid on fieldset and renders role="alert"', () => {
    renderWithProviders(
      <RadioGroup label="Required" errorMessage="Please pick one">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Please pick one');
    const fieldset = alert.closest('fieldset');
    expect(fieldset).toHaveAttribute('aria-invalid', 'true');
  });

  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (with errorMessage)',
    async (theme) => {
      const { container } = renderWithProviders(
        <RadioGroup
          label="Pick"
          description="Choose one"
          defaultValue="a"
          isRequired
          errorMessage="Required"
        >
          <Radio value="a">Alpha</Radio>
          <Radio value="b">Bravo</Radio>
        </RadioGroup>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
