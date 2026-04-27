/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 ChatMarkdown 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatMarkdown } from '../ChatMarkdown';

describe('ChatMarkdown — a11y', () => {
  it('has zero axe violations on a mixed-content document', async () => {
    const src = [
      '# Title',
      '',
      'A paragraph with **bold**, *italic* and `code` plus a [link](https://example.com).',
      '',
      '- one',
      '- two',
      '- three',
      '',
      '| col a | col b |',
      '|-------|-------|',
      '| 1     | 2     |',
      '',
      '```ts',
      'const answer = 42;',
      '```',
    ].join('\n');
    const { container } = renderWithProviders(<ChatMarkdown>{src}</ChatMarkdown>);
    await expectA11y(container);
  });
});
