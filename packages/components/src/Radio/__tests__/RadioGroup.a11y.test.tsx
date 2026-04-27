/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 RadioGroup 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Radio, RadioGroup } from '../';

describe('RadioGroup a11y', () => {
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
