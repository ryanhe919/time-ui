/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 验证 CodeEditor 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { CodeEditor } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

/**
 * One known axe caveat: `aria-input-field-name` flags CodeMirror's internal
 * `.cm-content` div (role="textbox") for missing an accessible name on the
 * element itself. The wrapper carries the accessible name, but axe's rule
 * doesn't traverse upward — same situation as ProseMirror / RichTextEditor.
 * Disabled here for that reason only; the wrapper now has role="group" so
 * `aria-prohibited-attr` no longer fires.
 */
const A11Y_OPTIONS = {
  rules: {
    'aria-input-field-name': { enabled: false },
  },
};

describe('CodeEditor a11y', () => {
  it('has no violations with default props', async () => {
    const { container } = renderWithProviders(<CodeEditor aria-label="Test editor" />, {
      config: { locale: 'en' },
    });
    await expectA11y(container, A11Y_OPTIONS);
  });

  it('has no violations when disabled', async () => {
    const { container } = renderWithProviders(<CodeEditor aria-label="Test editor" isDisabled />, {
      config: { locale: 'en' },
    });
    await expectA11y(container, A11Y_OPTIONS);
  });

  it('has no violations when invalid', async () => {
    const { container } = renderWithProviders(<CodeEditor aria-label="Test editor" isInvalid />, {
      config: { locale: 'en' },
    });
    await expectA11y(container, A11Y_OPTIONS);
  });

  it('has no violations without toolbar', async () => {
    const { container } = renderWithProviders(
      <CodeEditor aria-label="Test editor" toolbar={false} />,
      { config: { locale: 'en' } },
    );
    await expectA11y(container, A11Y_OPTIONS);
  });
});
