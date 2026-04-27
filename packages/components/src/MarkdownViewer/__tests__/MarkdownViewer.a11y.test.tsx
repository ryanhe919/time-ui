/**
 * @author Ryan He
 * @description 验证 MarkdownViewer 的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { MarkdownViewer } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

const SAMPLE_MD = [
  '# Document title',
  '',
  'A short paragraph with **bold**, _italic_, and `inline code`.',
  '',
  '## Section A',
  '',
  '- bullet one',
  '- bullet two',
  '',
  '## Section B',
  '',
  '| col 1 | col 2 |',
  '|-------|-------|',
  '| one   | two   |',
].join('\n');

describe('MarkdownViewer a11y', () => {
  it('has no violations with default props', async () => {
    const { container } = renderWithProviders(
      <MarkdownViewer aria-label="Doc" source={SAMPLE_MD} />,
      { config: { locale: 'en' } },
    );
    await expectA11y(container);
  });

  it('has no violations without toolbar', async () => {
    const { container } = renderWithProviders(
      <MarkdownViewer aria-label="Doc" source={SAMPLE_MD} showToolbar={false} />,
      { config: { locale: 'en' } },
    );
    await expectA11y(container);
  });

  it('has no violations with TOC enabled', async () => {
    const { container } = renderWithProviders(
      <MarkdownViewer aria-label="Doc" source={SAMPLE_MD} showToc tocPosition="right" />,
      { config: { locale: 'en' } },
    );
    await expectA11y(container);
  });
});
