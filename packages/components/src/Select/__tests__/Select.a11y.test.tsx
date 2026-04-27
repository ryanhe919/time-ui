/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Select 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Select } from '../';

const ITEMS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', isDisabled: true },
];

describe('Select a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <Select label="Fruit" description="Pick one" items={ITEMS} defaultValue="a" />,
      { theme },
    );
    await expectA11y(container);
  });
});
