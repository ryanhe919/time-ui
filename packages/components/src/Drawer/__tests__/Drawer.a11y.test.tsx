/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Drawer 组件的可访问性（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Drawer } from '../';

describe('Drawer — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (with header + footer)',
    async (theme) => {
      const { baseElement } = renderWithProviders(
        <Drawer isOpen aria-label="A11y check" header="A11y header" footer={<button>OK</button>}>
          <p>Body content</p>
        </Drawer>,
        { theme },
      );
      await expectA11y(baseElement);
    },
  );

  it('has zero axe violations using aria-label only (no header/footer)', async () => {
    const { baseElement } = renderWithProviders(
      <Drawer isOpen aria-label="aria-only-drawer">
        <p>content</p>
      </Drawer>,
    );
    await expectA11y(baseElement);
  });
});
