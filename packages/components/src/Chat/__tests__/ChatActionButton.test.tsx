/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatActionButton 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ChatActionButton } from '../ChatActionButton';

const Icon = () => (
  <svg viewBox="0 0 16 16" data-testid="icon">
    <path d="M0 0h16v16H0z" />
  </svg>
);

describe('ChatActionButton — rendering', () => {
  it('renders a <button type="button"> by default', () => {
    renderWithProviders(
      <ChatActionButton aria-label="attach">
        <Icon />
      </ChatActionButton>,
    );
    const btn = screen.getByRole('button', { name: 'attach' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('respects type="submit"', () => {
    renderWithProviders(
      <ChatActionButton aria-label="send" type="submit">
        <Icon />
      </ChatActionButton>,
    );
    expect(screen.getByRole('button', { name: 'send' })).toHaveAttribute('type', 'submit');
  });

  it('renders the children inside the button', () => {
    renderWithProviders(
      <ChatActionButton aria-label="x">
        <Icon />
      </ChatActionButton>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('forwards ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderWithProviders(
      <ChatActionButton aria-label="x" ref={ref}>
        <Icon />
      </ChatActionButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies className / style / id', () => {
    const { container } = renderWithProviders(
      <ChatActionButton aria-label="x" id="my-id" className="my-class" style={{ marginLeft: 12 }}>
        <Icon />
      </ChatActionButton>,
    );
    const btn = container.querySelector('#my-id') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.classList.contains('my-class')).toBe(true);
    expect(btn.style.marginLeft).toBe('12px');
  });
});

describe('ChatActionButton — interactions', () => {
  it('fires onClick on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <ChatActionButton aria-label="x" onClick={onClick}>
        <Icon />
      </ChatActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'x' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when isDisabled', async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <ChatActionButton aria-label="x" isDisabled onClick={onClick}>
        <Icon />
      </ChatActionButton>,
    );
    const btn = screen.getByRole('button', { name: 'x' });
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(btn).toBeDisabled();
  });

  it('reflects isActive via aria-pressed and data-active', () => {
    renderWithProviders(
      <ChatActionButton aria-label="rec" isActive>
        <Icon />
      </ChatActionButton>,
    );
    const btn = screen.getByRole('button', { name: 'rec' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAttribute('data-active', 'true');
  });

  it('does not set aria-pressed when not active', () => {
    renderWithProviders(
      <ChatActionButton aria-label="x">
        <Icon />
      </ChatActionButton>,
    );
    const btn = screen.getByRole('button', { name: 'x' });
    expect(btn).not.toHaveAttribute('aria-pressed');
    expect(btn).not.toHaveAttribute('data-active');
  });

  it('exposes data-disabled when isDisabled', () => {
    renderWithProviders(
      <ChatActionButton aria-label="x" isDisabled>
        <Icon />
      </ChatActionButton>,
    );
    expect(screen.getByRole('button', { name: 'x' })).toHaveAttribute('data-disabled', 'true');
  });

  it('renders tooltip via title attribute', () => {
    renderWithProviders(
      <ChatActionButton aria-label="x" tooltip="Attach a file">
        <Icon />
      </ChatActionButton>,
    );
    expect(screen.getByRole('button', { name: 'x' })).toHaveAttribute('title', 'Attach a file');
  });
});
