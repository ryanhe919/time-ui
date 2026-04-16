import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../test-utils';
import { CodeBlock } from './CodeBlock';

describe('CodeBlock (a11y)', () => {
  it('is accessible with default props', async () => {
    const { container } = renderWithProviders(<CodeBlock code="const x = 1;" title="example.ts" />);
    await expectA11y(container);
  });

  it('is accessible without copy button', async () => {
    const { container } = renderWithProviders(<CodeBlock code="const x = 1;" copyable={false} />);
    await expectA11y(container);
  });
});
