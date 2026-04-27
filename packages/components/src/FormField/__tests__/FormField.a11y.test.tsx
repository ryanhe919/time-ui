/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 FormField 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
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

describe('FormField a11y', () => {
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
});
