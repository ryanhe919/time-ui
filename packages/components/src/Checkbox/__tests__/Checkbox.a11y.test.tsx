/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Checkbox / CheckboxGroup 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { Checkbox, CheckboxGroup } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

describe('Checkbox a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(<Checkbox defaultSelected>Accessible</Checkbox>, {
      theme,
    });
    await expectA11y(container);
  });
});

describe('CheckboxGroup a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <CheckboxGroup label="Pick" description="Choose one or more" defaultValue={['a']} isRequired>
        <Checkbox value="a">Alpha</Checkbox>
        <Checkbox value="b">Bravo</Checkbox>
      </CheckboxGroup>,
      { theme },
    );
    await expectA11y(container);
  });
});
