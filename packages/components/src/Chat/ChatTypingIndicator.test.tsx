/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatTypingIndicator 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '../test-utils';
import { ChatTypingIndicator } from './ChatTypingIndicator';

describe('ChatTypingIndicator — base rendering', () => {
  it('renders with role="status" and default aria-label', () => {
    renderWithProviders(<ChatTypingIndicator />);
    const node = screen.getByRole('status');
    expect(node).toHaveAttribute('aria-live', 'polite');
    expect(node).toHaveAttribute('aria-label', 'AI is typing');
  });

  it('renders three dots', () => {
    const { container } = renderWithProviders(<ChatTypingIndicator />);
    const dots = container.querySelectorAll('[data-typing-dot]');
    expect(dots).toHaveLength(3);
    expect((dots[0] as HTMLElement).dataset.typingDot).toBe('0');
    expect((dots[1] as HTMLElement).dataset.typingDot).toBe('1');
    expect((dots[2] as HTMLElement).dataset.typingDot).toBe('2');
  });

  it('uses a custom label', () => {
    renderWithProviders(<ChatTypingIndicator label="Claude 正在输入" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Claude 正在输入');
  });
});

describe('ChatTypingIndicator — sizes', () => {
  it.each([['sm'], ['md']] as const)('renders size=%s', (size) => {
    const { container } = renderWithProviders(<ChatTypingIndicator size={size} />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.dataset.size).toBe(size);
  });
});

describe('ChatTypingIndicator — pass-through', () => {
  it('forwards ref to the root span', () => {
    let captured: HTMLSpanElement | null = null;
    renderWithProviders(
      <ChatTypingIndicator
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLSpanElement);
  });

  it('respects className / style / id', () => {
    const { container } = renderWithProviders(
      <ChatTypingIndicator id="typing" className="extra" style={{ marginTop: 4 }} />,
    );
    const node = container.querySelector('#typing') as HTMLElement;
    expect(node).not.toBeNull();
    expect(node.classList.contains('extra')).toBe(true);
    expect(node.style.marginTop).toBe('4px');
  });
});

describe('ChatTypingIndicator — motion', () => {
  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(<ChatTypingIndicator />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});

describe('ChatTypingIndicator — a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <div>
        <ChatTypingIndicator />
        <ChatTypingIndicator size="sm" label="Thinking…" />
      </div>,
      { theme },
    );
    await expectA11y(container);
  });
});
