/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatKnowledgeRefs 组件的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ChatKnowledgeRefs } from '../ChatKnowledgeRefs';
import type { ChatKnowledgeReference } from '../Chat.types';

const SAMPLE: ReadonlyArray<ChatKnowledgeReference> = [
  { id: '1', title: 'React Docs', source: 'web', href: 'https://react.dev', snippet: 'Official' },
  { id: '2', title: 'Design Brief.pdf', source: 'pdf', snippet: 'Internal v2' },
  { id: '3', title: 'Notes 2026-04', source: 'note' },
];

describe('ChatKnowledgeRefs — basic rendering', () => {
  it('renders one chip per reference with the title text', () => {
    renderWithProviders(<ChatKnowledgeRefs references={SAMPLE} />);
    SAMPLE.forEach((ref) => {
      expect(screen.getByText(ref.title)).toBeInTheDocument();
    });
  });

  it('renders the default "Sources" title above the list', () => {
    renderWithProviders(<ChatKnowledgeRefs references={SAMPLE} />);
    expect(screen.getByText('Sources')).toBeInTheDocument();
  });

  it('hides the title when title={false}', () => {
    renderWithProviders(<ChatKnowledgeRefs references={SAMPLE} title={false} />);
    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
  });

  it('accepts custom title node', () => {
    renderWithProviders(<ChatKnowledgeRefs references={SAMPLE} title="参考资料" />);
    expect(screen.getByText('参考资料')).toBeInTheDocument();
  });

  it('returns null for empty references array', () => {
    const { container } = renderWithProviders(<ChatKnowledgeRefs references={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ChatKnowledgeRefs — chip element type', () => {
  it('renders an <a> with href when reference.href is provided', () => {
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[0]!]} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://react.dev');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('isExternal=false drops target/rel on links', () => {
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[0]!]} isExternal={false} />);
    const link = screen.getByRole('link');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders a <button> when no href but onSelect provided', () => {
    const onSelect = vi.fn();
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[1]!]} onSelect={onSelect} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders a static <span> when neither href nor onSelect', () => {
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[2]!]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Notes 2026-04')).toBeInTheDocument();
  });

  it('clicking a button chip fires onSelect with the reference', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[1]!]} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(SAMPLE[1]);
  });

  it('clicking a link chip also fires onSelect (in addition to navigating)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[0]!]} onSelect={onSelect} />);
    await user.click(screen.getByRole('link'));
    expect(onSelect).toHaveBeenCalledWith(SAMPLE[0]);
  });
});

describe('ChatKnowledgeRefs — accessible name and badge', () => {
  it('builds aria-label from title + snippet when snippet present', () => {
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[0]!]} />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'React Docs: Official');
  });

  it('falls back to plain title when no snippet', () => {
    renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[2]!]} />);
    const span = screen.getByLabelText('Notes 2026-04');
    expect(span).toBeInTheDocument();
  });

  it('places source on data-source attribute', () => {
    const { container } = renderWithProviders(<ChatKnowledgeRefs references={[SAMPLE[0]!]} />);
    expect(container.querySelector('[data-source="web"]')).not.toBeNull();
  });
});

describe('ChatKnowledgeRefs — refs and pass-through', () => {
  it('forwards ref to the wrapper div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <ChatKnowledgeRefs
        references={SAMPLE}
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects a custom id on the wrapper', () => {
    const { container } = renderWithProviders(
      <ChatKnowledgeRefs id="my-refs" references={SAMPLE} />,
    );
    expect(container.querySelector('#my-refs')).not.toBeNull();
  });
});
