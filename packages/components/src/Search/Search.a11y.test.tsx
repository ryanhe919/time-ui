import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Search } from './Search';

describe('Search (a11y)', () => {
  it('is accessible (default)', async () => {
    const { container } = renderWithProviders(<Search />);
    await expectA11y(container);
  });

  it('is accessible with shortcut hint', async () => {
    const { container } = renderWithProviders(<Search placeholder="Search docs" shortcut="⌘K" />);
    await expectA11y(container);
  });
});
