/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Steps 组件的可访问性（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Steps } from '../';
import type { StepItem } from '../Steps.types';

const BASE_ITEMS: StepItem[] = [
  { key: 'a', title: 'Login', description: 'Provide credentials' },
  { key: 'b', title: 'Verify', description: 'Email verification' },
  { key: 'c', title: 'Profile', description: 'Set up profile' },
  { key: 'd', title: 'Done', description: 'All set' },
];

describe('Steps — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (variants × direction)',
    async (theme) => {
      const { container } = renderWithProviders(
        <div>
          <Steps aria-label="Flow" items={BASE_ITEMS} current={1} />
          <Steps aria-label="Vertical flow" items={BASE_ITEMS} current={1} direction="vertical" />
          <Steps aria-label="Dot flow" items={BASE_ITEMS} current={1} variant="dot" />
          <Steps aria-label="Nav flow" items={BASE_ITEMS} current={1} variant="navigation" />
          <Steps aria-label="Clickable flow" items={BASE_ITEMS} current={0} isClickable />
        </div>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
