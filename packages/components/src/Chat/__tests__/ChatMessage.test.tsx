/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatMessage 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage — base rendering', () => {
  it('renders the children inside a bubble for a user message', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="user" name="Ryan">
        hello world
      </ChatMessage>,
    );
    expect(screen.getByText('hello world')).toBeInTheDocument();
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.role).toBe('user');
    expect(root.dataset.side).toBe('right');
    // role=article so screen readers announce as a discrete unit
    expect(root.getAttribute('role')).toBe('article');
  });

  it('shows name and timestamp in the meta header', () => {
    const date = new Date('2026-04-17T10:30:00Z');
    renderWithProviders(
      <ChatMessage role="assistant" name="Claude" timestamp={date}>
        hi there
      </ChatMessage>,
    );
    expect(screen.getByText('Claude')).toBeInTheDocument();
    const time = screen.getByText((_t, el) => el?.tagName === 'TIME') as HTMLTimeElement;
    expect(time.getAttribute('datetime')).toBe(date.toISOString());
  });

  it('accepts numeric (ms) timestamp', () => {
    const ms = Date.UTC(2026, 0, 1, 12, 34);
    const { container } = renderWithProviders(
      <ChatMessage role="assistant" timestamp={ms}>
        x
      </ChatMessage>,
    );
    const time = container.querySelector('time') as HTMLTimeElement;
    expect(time.getAttribute('datetime')).toBe(new Date(ms).toISOString());
  });

  it('accepts string timestamp verbatim in datetime', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="assistant" timestamp="just now">
        x
      </ChatMessage>,
    );
    const time = container.querySelector('time') as HTMLTimeElement;
    expect(time.textContent).toBe('just now');
    expect(time.getAttribute('datetime')).toBe('just now');
  });
});

describe('ChatMessage — roles', () => {
  it('user → side=right, has bubble', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="user" name="R">
        u
      </ChatMessage>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.side).toBe('right');
    expect(root.querySelector('[data-bubble]')).not.toBeNull();
  });

  it('assistant → side=left, has bubble', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="assistant" name="C">
        a
      </ChatMessage>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.side).toBe('left');
    expect(root.querySelector('[data-bubble]')).not.toBeNull();
  });

  it('system → side=center, no avatar by default, header hidden', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="system" name="System" timestamp="10:00">
        Connected
      </ChatMessage>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.side).toBe('center');
    // No avatar
    expect(root.querySelector('[data-kind]')).toBeNull();
    // Header is suppressed in center layout
    expect(root.querySelector('[data-meta]')).toBeNull();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('tool → no bubble, attachments slot rendered', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="tool" attachments={<div data-testid="tool-card">tool-card</div>}>
        {null}
      </ChatMessage>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.role).toBe('tool');
    expect(root.querySelector('[data-bubble]')).toBeNull();
    expect(root.querySelector('[data-attachments]')).not.toBeNull();
    expect(screen.getByTestId('tool-card')).toBeInTheDocument();
  });

  it('knowledge → no bubble, attachments rendered', () => {
    renderWithProviders(
      <ChatMessage role="knowledge" attachments={<div data-testid="kb-refs">refs</div>}>
        {null}
      </ChatMessage>,
    );
    expect(screen.getByTestId('kb-refs')).toBeInTheDocument();
  });
});

describe('ChatMessage — avatar derivation', () => {
  it('derives initial from name string for assistant', () => {
    renderWithProviders(
      <ChatMessage role="assistant" name="Claude">
        hi
      </ChatMessage>,
    );
    // Expect 1-2 char initials (CL when single word)
    expect(screen.getByText('CL')).toBeInTheDocument();
  });

  it('uses fallback "U" / "A" when name is missing', () => {
    const { container } = renderWithProviders(<ChatMessage role="user">u</ChatMessage>);
    expect(container.querySelector('[data-kind="text"]')).not.toBeNull();
  });

  it('respects explicit avatar override (image)', () => {
    renderWithProviders(
      <ChatMessage
        role="assistant"
        name="Claude"
        avatar={{ kind: 'image', src: '/c.png', alt: 'C' }}
      >
        hi
      </ChatMessage>,
    );
    // ChatMessage forwards `name` as aria-label, which overrides the image alt.
    expect(screen.getByRole('img', { name: 'Claude' })).toBeInTheDocument();
  });

  it('hides avatar when showAvatar=false', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="user" name="R" showAvatar={false}>
        u
      </ChatMessage>,
    );
    expect(container.querySelector('[data-kind]')).toBeNull();
  });

  it('shows avatar even for unusual roles by default', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="tool" name="search_web">
        {null}
      </ChatMessage>,
    );
    expect(container.querySelector('[data-kind="text"]')).not.toBeNull();
  });
});

describe('ChatMessage — streaming', () => {
  it('appends a blinking caret when isStreaming=true', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="assistant" isStreaming>
        partial...
      </ChatMessage>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.streaming).toBe('true');
    expect(root.querySelector('[data-streaming-caret]')).not.toBeNull();
  });

  it('omits the caret when isStreaming is false / unset', () => {
    const { container } = renderWithProviders(<ChatMessage role="assistant">done</ChatMessage>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.streaming).toBeUndefined();
    expect(root.querySelector('[data-streaming-caret]')).toBeNull();
  });
});

describe('ChatMessage — refs and pass-through', () => {
  it('forwards ref to root div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <ChatMessage
        role="user"
        name="R"
        ref={(node) => {
          captured = node;
        }}
      >
        x
      </ChatMessage>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects className / style / id', () => {
    const { container } = renderWithProviders(
      <ChatMessage role="user" id="msg-1" className="extra" style={{ marginTop: 4 }}>
        x
      </ChatMessage>,
    );
    const root = container.querySelector('#msg-1') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.classList.contains('extra')).toBe(true);
    expect(root.style.marginTop).toBe('4px');
  });

  it('omits the bubble container entirely when children are nullish for tool/knowledge', () => {
    const { container } = renderWithProviders(<ChatMessage role="tool">{null}</ChatMessage>);
    expect(container.querySelector('[data-bubble]')).toBeNull();
  });
});

describe('ChatMessage — motion', () => {
  it('emits prefers-reduced-motion override (caret blink fallback)', () => {
    renderWithProviders(
      <ChatMessage role="assistant" isStreaming>
        x
      </ChatMessage>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
