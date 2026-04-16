/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Button 模块的可访问性行为。
 */

import { describe, it } from 'vitest';
import { Button } from './Button';
import { renderWithProviders, expectA11y } from '../test-utils';

describe('Button — accessibility', () => {
  it('has no axe-core violations for the default variant', async () => {
    const { container } = renderWithProviders(<Button>Save</Button>);
    await expectA11y(container);
  });

  it('has no axe-core violations for the ghost variant', async () => {
    const { container } = renderWithProviders(
      <Button variant="ghost" aria-label="Close dialog">
        x
      </Button>,
    );
    await expectA11y(container);
  });
});
