/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Radio 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Radio, RadioGroup } from '../';

describe('Radio a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (Radio with description inside group)',
    async (theme) => {
      const { container } = renderWithProviders(
        <RadioGroup label="Preference" defaultValue="a">
          <Radio value="a" description="Recommended">
            Alpha
          </Radio>
          <Radio value="b">Bravo</Radio>
        </RadioGroup>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
