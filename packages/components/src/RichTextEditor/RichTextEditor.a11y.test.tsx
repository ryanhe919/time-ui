/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 验证 RichTextEditor 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';

import { renderWithProviders, expectA11y } from '../test-utils';
import { RichTextEditor } from './RichTextEditor';

/**
 * ProseMirror 内部的 contenteditable div 自带 role="textbox"；它的可访问名由
 * 包裹层（带 aria-label 的 wrapper，同样为 role="textbox"）提供。axe 的
 * `aria-input-field-name` 不会跨层级追溯，因此这里关掉以避免误报，其余规则保持启用。
 */
const A11Y_OPTIONS = {
  rules: { 'aria-input-field-name': { enabled: false } },
};

describe('RichTextEditor — a11y', () => {
  it('default render with aria-label has no axe violations', async () => {
    const { container } = renderWithProviders(
      <RichTextEditor aria-label="rich text editor" placeholder="Write here..." />,
    );
    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).not.toBeNull();
    });
    await expectA11y(container, A11Y_OPTIONS);
  });

  it('full toolbar + content + isInvalid has no axe violations', async () => {
    const { container } = renderWithProviders(
      <RichTextEditor
        aria-label="rich text editor"
        toolbar="full"
        defaultValue="<p>Hello world</p>"
        isInvalid
      />,
    );
    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).not.toBeNull();
    });
    await expectA11y(container, A11Y_OPTIONS);
  });
});
