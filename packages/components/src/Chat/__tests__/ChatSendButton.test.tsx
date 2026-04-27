/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatSendButton 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ChatSendButton } from '../ChatSendButton';

describe('ChatSendButton — rendering', () => {
  it('renders with default aria-label "Send message"', () => {
    renderWithProviders(<ChatSendButton />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  it('respects custom aria-label', () => {
    renderWithProviders(<ChatSendButton aria-label="Submit prompt" />);
    expect(screen.getByRole('button', { name: 'Submit prompt' })).toBeInTheDocument();
  });

  it('renders an arrow-up SVG by default', () => {
    const { container } = renderWithProviders(<ChatSendButton />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('rect')).toBeNull();
  });

  it('forwards ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderWithProviders(<ChatSendButton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies className / style / id', () => {
    const { container } = renderWithProviders(
      <ChatSendButton id="send-id" className="send-cls" style={{ marginLeft: 8 }} />,
    );
    const btn = container.querySelector('#send-id') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.classList.contains('send-cls')).toBe(true);
    expect(btn.style.marginLeft).toBe('8px');
  });
});

describe('ChatSendButton — default mode', () => {
  it('fires onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<ChatSendButton onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when isDisabled', () => {
    const onClick = vi.fn();
    renderWithProviders(<ChatSendButton isDisabled onClick={onClick} />);
    const btn = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).toHaveAttribute('data-disabled', 'true');
  });
});

describe('ChatSendButton — streaming mode', () => {
  it('renders the stop label and a square stop icon', () => {
    const { container } = renderWithProviders(<ChatSendButton isStreaming onStop={() => {}} />);
    expect(screen.getByRole('button', { name: 'Stop generation' })).toBeInTheDocument();
    expect(container.querySelector('rect')).not.toBeNull();
  });

  it('respects custom stopAriaLabel', () => {
    renderWithProviders(<ChatSendButton isStreaming stopAriaLabel="Halt" onStop={() => {}} />);
    expect(screen.getByRole('button', { name: 'Halt' })).toBeInTheDocument();
  });

  it('clicking calls onStop, NOT onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onStop = vi.fn();
    renderWithProviders(<ChatSendButton isStreaming onClick={onClick} onStop={onStop} />);
    await user.click(screen.getByRole('button', { name: 'Stop generation' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('streaming + isDisabled still allows onStop', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    renderWithProviders(<ChatSendButton isStreaming isDisabled onStop={onStop} />);
    const btn = screen.getByRole('button', { name: 'Stop generation' });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('exposes data-streaming attribute', () => {
    renderWithProviders(<ChatSendButton isStreaming onStop={() => {}} />);
    expect(screen.getByRole('button', { name: 'Stop generation' })).toHaveAttribute(
      'data-streaming',
      'true',
    );
  });

  it('does not throw when onStop is not provided', () => {
    renderWithProviders(<ChatSendButton isStreaming />);
    fireEvent.click(screen.getByRole('button', { name: 'Stop generation' }));
  });

  it('does not throw when onClick is not provided in default mode', () => {
    renderWithProviders(<ChatSendButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  });
});
