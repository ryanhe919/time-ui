/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Callout 模块的可访问性行为。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Callout } from './Callout';

describe('Callout (a11y)', () => {
  it('is accessible (info)', async () => {
    const { container } = renderWithProviders(
      <Callout title="Note">Body text with enough contrast.</Callout>,
    );
    await expectA11y(container);
  });

  it('is accessible (danger)', async () => {
    const { container } = renderWithProviders(
      <Callout variant="danger" title="Error">
        Something went wrong.
      </Callout>,
    );
    await expectA11y(container);
  });
});
