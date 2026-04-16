import { expect } from 'vitest';
import { axe } from 'vitest-axe';

export type A11yOptions = Parameters<typeof axe>[1];

/**
 * Run axe-core against a rendered container and assert no WCAG violations.
 *
 * The `toHaveNoViolations` matcher is registered globally in
 * `src/test/setup.ts` (vitest `setupFiles`), so callers only need to import
 * this helper.
 *
 *   const { container } = renderWithProviders(<Button>Go</Button>);
 *   await expectA11y(container);
 */
export const expectA11y = async (
  container: Element | Document,
  options?: A11yOptions,
): Promise<void> => {
  const results = await axe(container as Element, options);
  // Matcher is augmented via `vitest-axe/extend-expect` in the setup file.
  (expect(results) as unknown as { toHaveNoViolations(): void }).toHaveNoViolations();
};
