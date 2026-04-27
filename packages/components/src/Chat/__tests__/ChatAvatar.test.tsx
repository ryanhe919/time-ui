/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatAvatar 模块的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { ChatAvatar } from '../ChatAvatar';
import type { ChatMessageRole } from '../Chat.types';

describe('ChatAvatar — base rendering', () => {
  it('renders an image when source.kind="image" with alt fallback', () => {
    renderWithProviders(
      <ChatAvatar source={{ kind: 'image', src: '/u.png', alt: 'Ryan' }} role="user" />,
    );
    const img = screen.getByRole('img', { name: 'Ryan' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe('/u.png');
  });

  it('aria-label overrides image alt text', () => {
    renderWithProviders(
      <ChatAvatar source={{ kind: 'image', src: '/u.png', alt: 'fallback' }} aria-label="custom" />,
    );
    expect(screen.getByRole('img', { name: 'custom' })).toBeInTheDocument();
  });

  it('renders text initials uppercase from a single word', () => {
    renderWithProviders(<ChatAvatar source={{ kind: 'text', text: 'ryan' }} role="user" />);
    expect(screen.getByText('RY')).toBeInTheDocument();
  });

  it('renders first+last initial for multi-word text', () => {
    renderWithProviders(<ChatAvatar source={{ kind: 'text', text: 'Ryan He' }} role="assistant" />);
    expect(screen.getByText('RH')).toBeInTheDocument();
  });

  it('renders nothing readable when text is whitespace only', () => {
    const { container } = renderWithProviders(
      <ChatAvatar source={{ kind: 'text', text: '   ' }} />,
    );
    const node = container.firstElementChild as HTMLElement;
    expect(node.textContent ?? '').toBe('');
  });

  it('renders a custom node source', () => {
    renderWithProviders(
      <ChatAvatar source={{ kind: 'node', node: <span data-testid="node">N</span> }} />,
    );
    expect(screen.getByTestId('node')).toBeInTheDocument();
  });

  it('handles single-character text without slicing past length', () => {
    renderWithProviders(<ChatAvatar source={{ kind: 'text', text: 'a' }} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('image with no alt and no aria-label uses empty alt', () => {
    const { container } = renderWithProviders(
      <ChatAvatar source={{ kind: 'image', src: '/x.png' }} />,
    );
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('alt')).toBe('');
  });

  it('text source applies aria-hidden inner span when aria-label is set', () => {
    const { container } = renderWithProviders(
      <ChatAvatar source={{ kind: 'text', text: 'AB' }} aria-label="Label" />,
    );
    const inner = container.querySelector('span > span');
    expect(inner?.getAttribute('aria-hidden')).toBe('true');
  });

  it('node source applies aria-hidden inner span when aria-label is set', () => {
    const { container } = renderWithProviders(
      <ChatAvatar source={{ kind: 'node', node: <i data-testid="i">·</i> }} aria-label="Label" />,
    );
    const inner = container.querySelector('span > span');
    expect(inner?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('ChatAvatar — sizes', () => {
  it.each([['xs'], ['sm'], ['md'], ['lg'], ['xl']] as const)('renders size=%s', (size) => {
    const { container } = renderWithProviders(
      <ChatAvatar source={{ kind: 'text', text: 'AB' }} size={size} />,
    );
    const node = container.firstElementChild as HTMLElement;
    expect(node.dataset.size).toBe(size);
  });

  it('omits role attribute when image (img element handles role natively)', () => {
    const { container } = renderWithProviders(
      <ChatAvatar source={{ kind: 'image', src: '/x.png' }} aria-label="x" />,
    );
    const node = container.firstElementChild as HTMLElement;
    expect(node.getAttribute('role')).toBeNull();
  });

  it('uses role="img" wrapper when source is text', () => {
    const { container } = renderWithProviders(<ChatAvatar source={{ kind: 'text', text: 'AB' }} />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.getAttribute('role')).toBe('img');
  });
});

describe('ChatAvatar — role tints', () => {
  it.each([['user'], ['assistant'], ['system'], ['tool'], ['knowledge']] as const)(
    'sets data-role=%s',
    (role) => {
      const { container } = renderWithProviders(
        <ChatAvatar source={{ kind: 'text', text: 'AA' }} role={role as ChatMessageRole} />,
      );
      const node = container.firstElementChild as HTMLElement;
      expect(node.dataset.role).toBe(role);
    },
  );

  it('falls back to default tint when role is undefined', () => {
    const { container } = renderWithProviders(<ChatAvatar source={{ kind: 'text', text: 'AA' }} />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.dataset.role).toBeUndefined();
  });
});

describe('ChatAvatar — refs and pass-through', () => {
  it('forwards ref to the root span', () => {
    let captured: HTMLSpanElement | null = null;
    renderWithProviders(
      <ChatAvatar
        source={{ kind: 'text', text: 'AB' }}
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLSpanElement);
  });

  it('respects custom id, className, style', () => {
    const { container } = renderWithProviders(
      <ChatAvatar
        source={{ kind: 'text', text: 'AB' }}
        id="my-avatar"
        className="extra"
        style={{ marginTop: 4 }}
      />,
    );
    const node = container.querySelector('#my-avatar') as HTMLElement;
    expect(node).not.toBeNull();
    expect(node.classList.contains('extra')).toBe(true);
    expect(node.style.marginTop).toBe('4px');
  });
});
