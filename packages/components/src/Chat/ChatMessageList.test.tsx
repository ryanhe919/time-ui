/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatMessageList 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '../test-utils';
import { ChatMessageList } from './ChatMessageList';
import { ChatMessage } from './ChatMessage';

describe('ChatMessageList — base rendering', () => {
  it('defaults to role="log" + aria-live="polite"', () => {
    renderWithProviders(
      <ChatMessageList>
        <ChatMessage role="user">a</ChatMessage>
      </ChatMessageList>,
    );
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(log).toHaveAttribute('aria-relevant', 'additions');
  });

  it('renders all children inside the list', () => {
    renderWithProviders(
      <ChatMessageList>
        <ChatMessage role="user">m1</ChatMessage>
        <ChatMessage role="assistant">m2</ChatMessage>
        <ChatMessage role="system">m3</ChatMessage>
      </ChatMessageList>,
    );
    expect(screen.getByText('m1')).toBeInTheDocument();
    expect(screen.getByText('m2')).toBeInTheDocument();
    expect(screen.getByText('m3')).toBeInTheDocument();
  });

  it('honors custom role="region"', () => {
    const { container } = renderWithProviders(
      <ChatMessageList role="region">
        <ChatMessage role="user">x</ChatMessage>
      </ChatMessageList>,
    );
    const list = container.querySelector('[role="region"]') as HTMLElement;
    expect(list).not.toBeNull();
  });

  it('omits aria-live when isLive=false', () => {
    renderWithProviders(
      <ChatMessageList isLive={false}>
        <ChatMessage role="user">x</ChatMessage>
      </ChatMessageList>,
    );
    const log = screen.getByRole('log');
    expect(log.getAttribute('aria-live')).toBeNull();
    expect(log.getAttribute('aria-relevant')).toBeNull();
  });
});

describe('ChatMessageList — scrolling', () => {
  it('does not enable scroll when maxHeight is omitted', () => {
    const { container } = renderWithProviders(
      <ChatMessageList>
        <ChatMessage role="user">x</ChatMessage>
      </ChatMessageList>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.scrollable).toBeUndefined();
  });

  it('enables scroll container when maxHeight is provided (string)', () => {
    const { container } = renderWithProviders(
      <ChatMessageList maxHeight="300px">
        <ChatMessage role="user">x</ChatMessage>
      </ChatMessageList>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.scrollable).toBe('true');
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/max-height:\s*300px/);
  });

  it('converts numeric maxHeight to px', () => {
    renderWithProviders(
      <ChatMessageList maxHeight={400}>
        <ChatMessage role="user">x</ChatMessage>
      </ChatMessageList>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/max-height:\s*400px/);
  });

  it('assigns scrollTop = scrollHeight when children grow', () => {
    // jsdom doesn't real-scroll; we stub scrollHeight on the eventual node and verify the assignment.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 1234;
      },
    });

    const { container, rerender } = renderWithProviders(
      <ChatMessageList maxHeight={200}>
        <ChatMessage role="user">m1</ChatMessage>
      </ChatMessageList>,
    );
    const root = container.firstElementChild as HTMLElement;
    // Initial mount triggers the layout effect; scrollTop should equal stubbed scrollHeight.
    expect(root.scrollTop).toBe(1234);

    // Reset scrollTop and add a message; the effect should reassign it.
    root.scrollTop = 0;
    rerender(
      <ChatMessageList maxHeight={200}>
        <ChatMessage role="user">m1</ChatMessage>
        <ChatMessage role="assistant">m2</ChatMessage>
      </ChatMessageList>,
    );
    expect(root.scrollTop).toBe(1234);

    // Restore: delete the stub so other tests aren't affected.
    delete (HTMLElement.prototype as unknown as { scrollHeight?: number }).scrollHeight;
  });

  it('does not auto-scroll when autoScrollToBottom=false', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 999;
      },
    });

    const { container } = renderWithProviders(
      <ChatMessageList maxHeight={200} autoScrollToBottom={false}>
        <ChatMessage role="user">m1</ChatMessage>
      </ChatMessageList>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.scrollTop).toBe(0);

    delete (HTMLElement.prototype as unknown as { scrollHeight?: number }).scrollHeight;
  });

  it('does not attempt scroll when maxHeight is omitted (no scroll container)', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 555;
      },
    });

    const { container } = renderWithProviders(
      <ChatMessageList>
        <ChatMessage role="user">m1</ChatMessage>
      </ChatMessageList>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.scrollTop).toBe(0);

    delete (HTMLElement.prototype as unknown as { scrollHeight?: number }).scrollHeight;
  });
});

describe('ChatMessageList — pass-through', () => {
  it('forwards ref to root div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <ChatMessageList
        ref={(node) => {
          captured = node;
        }}
      >
        <ChatMessage role="user">x</ChatMessage>
      </ChatMessageList>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects className / style / id', () => {
    const { container } = renderWithProviders(
      <ChatMessageList id="my-list" className="extra" style={{ paddingTop: 4 }}>
        <ChatMessage role="user">x</ChatMessage>
      </ChatMessageList>,
    );
    const root = container.querySelector('#my-list') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.classList.contains('extra')).toBe(true);
    expect(root.style.paddingTop).toBe('4px');
  });
});

describe('ChatMessageList — a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <ChatMessageList maxHeight={300}>
        <ChatMessage role="user" name="Ryan">
          Hi
        </ChatMessage>
        <ChatMessage role="assistant" name="Claude">
          Hello!
        </ChatMessage>
        <ChatMessage role="system">Connected</ChatMessage>
      </ChatMessageList>,
      { theme },
    );
    await expectA11y(container);
  });
});
