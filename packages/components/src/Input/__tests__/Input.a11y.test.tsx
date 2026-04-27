/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Input 模块的 a11y 行为（axe 0 violation + reduced-motion）。
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Input } from '../';

describe('Input — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'passes axe in %s theme with label + description + error',
    async (theme) => {
      const { container } = renderWithProviders(
        <Input
          label="Email"
          description="We never share your email"
          errorMessage="Required"
          isRequired
        />,
        { theme },
      );
      await expectA11y(container);
    },
  );

  it('ships a prefers-reduced-motion rule that disables its adornment transitions', () => {
    renderWithProviders(<Input aria-label="x" defaultValue="x" isClearable onChange={() => {}} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)[^}]*transition:\s*none/);
  });
});
