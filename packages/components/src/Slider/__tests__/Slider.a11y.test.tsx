/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Slider 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Slider } from '../';

describe('Slider — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (single + range)',
    async (theme) => {
      const { container } = renderWithProviders(
        <div>
          <Slider aria-label="volume" defaultValue={30} />
          <Slider aria-label="price" defaultValue={[100, 500]} max={1000} />
          <Slider aria-label="vertical" defaultValue={50} orientation="vertical" />
        </div>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
