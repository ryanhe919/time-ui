/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description ChatScrollToBottom 单元测试：可见性 / 点击 / 未读计数 / 自定义图标 / a11y label。
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatScrollToBottom } from '../ChatScrollToBottom';

describe('ChatScrollToBottom', () => {
  it('does not render when isVisible=false', () => {
    const { container } = renderWithProviders(
      <ChatScrollToBottom isVisible={false} onClick={() => {}} />,
    );
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders and fires onClick', () => {
    const onClick = vi.fn();
    renderWithProviders(<ChatScrollToBottom isVisible onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /scroll to latest/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows unreadCount when > 0', () => {
    renderWithProviders(<ChatScrollToBottom isVisible onClick={() => {}} unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides unreadCount when 0 or undefined', () => {
    renderWithProviders(<ChatScrollToBottom isVisible onClick={() => {}} unreadCount={0} />);
    expect(screen.queryByText('0')).toBeNull();
  });

  it('uses custom aria-label when provided', () => {
    renderWithProviders(<ChatScrollToBottom isVisible onClick={() => {}} aria-label="跳到底部" />);
    expect(screen.getByRole('button', { name: '跳到底部' })).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    renderWithProviders(
      <ChatScrollToBottom
        isVisible
        onClick={() => {}}
        icon={<span data-testid="my-icon">↓</span>}
      />,
    );
    expect(screen.getByTestId('my-icon')).toBeInTheDocument();
  });
});

describe('ChatScrollToBottom a11y', () => {
  it.each(['light', 'dark'] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <ChatScrollToBottom isVisible onClick={() => {}} unreadCount={3} />,
      { theme },
    );
    await expectA11y(container);
  });
});
