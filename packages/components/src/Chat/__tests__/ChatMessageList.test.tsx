/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatMessageList 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { ChatMessageList } from '../ChatMessageList';
import { ChatMessage } from '../ChatMessage';

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
  it('follows streamed text while the message count stays the same', () => {
    const { container, rerender } = renderWithProviders(
      <ChatMessageList maxHeight={200}>
        <ChatMessage role="assistant">First token</ChatMessage>
      </ChatMessageList>,
    );
    const root = container.firstElementChild as HTMLElement;
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 500 });
    rerender(
      <ChatMessageList maxHeight={200}>
        <ChatMessage role="assistant">First token followed by more text</ChatMessage>
      </ChatMessageList>,
    );
    expect(root.scrollTop).toBe(500);
  });

  it('follows asynchronous content growth but preserves a reader scrolling through history', () => {
    let resize: ResizeObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    try {
      const { container, unmount } = renderWithProviders(
        <ChatMessageList maxHeight={200}>
          <ChatMessage role="assistant">Message with an image</ChatMessage>
        </ChatMessageList>,
      );
      const root = container.firstElementChild as HTMLElement;
      Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 500 });
      Object.defineProperty(root, 'clientHeight', { configurable: true, value: 200 });
      expect(observe).toHaveBeenCalledWith(root.querySelector('[role="article"]'));
      act(() => resize?.([], {} as ResizeObserver));
      expect(root.scrollTop).toBe(500);

      root.scrollTop = 100;
      fireEvent.scroll(root);
      act(() => resize?.([], {} as ResizeObserver));
      expect(root.scrollTop).toBe(100);
      unmount();
      expect(disconnect).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

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

  it('does not auto-scroll when shouldAutoScrollToBottom=false', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 999;
      },
    });

    const { container } = renderWithProviders(
      <ChatMessageList maxHeight={200} shouldAutoScrollToBottom={false}>
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
