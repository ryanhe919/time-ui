/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatToolCall 组件的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ChatToolCall } from '../ChatToolCall';
import type { ChatToolCallStatus } from '../Chat.types';

describe('ChatToolCall — basic rendering', () => {
  it('renders the tool name', () => {
    renderWithProviders(<ChatToolCall name="search_web" status="success" />);
    expect(screen.getByText('search_web')).toBeInTheDocument();
  });

  it('exposes data-status reflecting the status prop', () => {
    const { container } = renderWithProviders(<ChatToolCall name="x" status="running" />);
    expect(container.firstElementChild).toHaveAttribute('data-status', 'running');
  });

  it.each<ChatToolCallStatus>(['pending', 'running', 'success', 'error'])(
    'renders status badge "%s" without crashing',
    (status) => {
      renderWithProviders(<ChatToolCall name="t" status={status} />);
      expect(screen.getByText(new RegExp(status, 'i'))).toBeInTheDocument();
    },
  );

  it('shows a chevron in collapsible mode and exposes aria-expanded on the toggle', () => {
    renderWithProviders(<ChatToolCall name="t" status="success" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('isCollapsible=false hides the toggle button', () => {
    renderWithProviders(<ChatToolCall name="t" status="success" isCollapsible={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ChatToolCall — expand / collapse', () => {
  it('uncontrolled: clicking the header toggles expanded and reveals body', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChatToolCall
        name="search"
        status="success"
        arguments={{ query: 'react' }}
        result={{ items: 10 }}
      />,
    );
    expect(screen.queryByText(/Arguments/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(screen.getByText(/Arguments/i)).toBeInTheDocument();
    expect(screen.getByText(/Result/i)).toBeInTheDocument();
  });

  it('controlled: isExpanded prop drives the open state', () => {
    const onExpandedChange = vi.fn();
    const { rerender } = renderWithProviders(
      <ChatToolCall
        name="x"
        status="success"
        isExpanded={false}
        onExpandedChange={onExpandedChange}
        arguments={{ a: 1 }}
      />,
    );
    expect(screen.queryByText(/Arguments/i)).not.toBeInTheDocument();
    rerender(
      <ChatToolCall
        name="x"
        status="success"
        isExpanded
        onExpandedChange={onExpandedChange}
        arguments={{ a: 1 }}
      />,
    );
    expect(screen.getByText(/Arguments/i)).toBeInTheDocument();
  });

  it('defaultExpanded=true opens initially', () => {
    renderWithProviders(
      <ChatToolCall name="x" status="success" defaultExpanded arguments={{ a: 1 }} />,
    );
    expect(screen.getByText(/Arguments/i)).toBeInTheDocument();
  });

  it('clicking calls onExpandedChange with the next value', async () => {
    const onExpandedChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ChatToolCall
        name="x"
        status="success"
        defaultExpanded={false}
        onExpandedChange={onExpandedChange}
      />,
    );
    await user.click(screen.getByRole('button'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });
});

describe('ChatToolCall — body content', () => {
  it('serializes object arguments as JSON', () => {
    renderWithProviders(
      <ChatToolCall name="x" status="success" defaultExpanded arguments={{ q: 'abc' }} />,
    );
    expect(screen.getByText(/"q": "abc"/)).toBeInTheDocument();
  });

  it('passes string arguments through verbatim', () => {
    renderWithProviders(
      <ChatToolCall name="x" status="success" defaultExpanded arguments={'plain string args'} />,
    );
    expect(screen.getByText(/plain string args/)).toBeInTheDocument();
  });

  it('shows error block when status="error" and error provided', () => {
    renderWithProviders(
      <ChatToolCall name="x" status="error" defaultExpanded error="rate limited" />,
    );
    expect(screen.getByText(/rate limited/)).toBeInTheDocument();
  });

  it('renderArguments / renderResult overrides default rendering', () => {
    renderWithProviders(
      <ChatToolCall
        name="x"
        status="success"
        defaultExpanded
        arguments={{ q: 1 }}
        result={{ items: [] }}
        renderArguments={() => <div data-testid="custom-args">custom!</div>}
        renderResult={() => <div data-testid="custom-result">also custom</div>}
      />,
    );
    expect(screen.getByTestId('custom-args')).toBeInTheDocument();
    expect(screen.getByTestId('custom-result')).toBeInTheDocument();
  });

  it('handles non-serializable values without throwing (circular reference)', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    renderWithProviders(
      <ChatToolCall name="x" status="success" defaultExpanded arguments={circular} />,
    );
    // Falls back to String(value), which yields "[object Object]".
    expect(screen.getByText(/object/i)).toBeInTheDocument();
  });

  it('hides Arguments section when arguments undefined', () => {
    renderWithProviders(
      <ChatToolCall name="x" status="success" defaultExpanded result={{ a: 1 }} />,
    );
    expect(screen.queryByText(/Arguments/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Result/i)).toBeInTheDocument();
  });
});

describe('ChatToolCall — refs and pass-through', () => {
  it('forwards ref to the wrapper div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <ChatToolCall
        name="x"
        status="success"
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects a custom id on the wrapper', () => {
    const { container } = renderWithProviders(
      <ChatToolCall id="my-tool" name="x" status="success" />,
    );
    expect(container.querySelector('#my-tool')).not.toBeNull();
  });
});
