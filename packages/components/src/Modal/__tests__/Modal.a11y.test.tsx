/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Modal 组件的可访问性（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Modal } from '../';

describe('Modal — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (with title + footer)',
    async (theme) => {
      const { baseElement } = renderWithProviders(
        <Modal isOpen title="A11y check" footer={<button>OK</button>}>
          <p>Body content</p>
        </Modal>,
        { theme },
      );
      await expectA11y(baseElement);
    },
  );

  it('has zero axe violations using only aria-label', async () => {
    const { baseElement } = renderWithProviders(
      <Modal isOpen aria-label="aria-labelled-modal">
        <p>content</p>
      </Modal>,
    );
    await expectA11y(baseElement);
  });
});
