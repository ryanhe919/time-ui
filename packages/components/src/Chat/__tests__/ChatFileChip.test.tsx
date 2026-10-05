/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description ChatFileChip 单元测试：name 渲染 / kind 推导 / 移除按钮 / progress bar / 错误态 / 可点击模式。
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatFileChip } from '../ChatFileChip';

describe('ChatFileChip', () => {
  it('renders the file name', () => {
    renderWithProviders(<ChatFileChip name="report.pdf" />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('derives kind from extension when not provided', () => {
    const { container } = renderWithProviders(<ChatFileChip name="hello.tsx" />);
    expect(container.querySelector('[data-kind="code"]')).not.toBeNull();
  });

  it('honors explicit kind prop over extension', () => {
    const { container } = renderWithProviders(<ChatFileChip name="hello.tsx" kind="document" />);
    expect(container.querySelector('[data-kind="document"]')).not.toBeNull();
  });

  it('shows size when provided', () => {
    renderWithProviders(<ChatFileChip name="big.zip" size="3.2 MB" />);
    expect(screen.getByText('3.2 MB')).toBeInTheDocument();
  });

  it('renders remove button only when onRemove is provided', () => {
    const onRemove = vi.fn();
    const { rerender } = renderWithProviders(<ChatFileChip name="x.txt" />);
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();

    rerender(<ChatFileChip name="x.txt" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove x.txt' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders progress bar when progress is between 0 and 100', () => {
    const { container } = renderWithProviders(<ChatFileChip name="up.pdf" progress={42} />);
    expect(container.querySelector('[data-testid="chat-file-chip-progress"]')).not.toBeNull();
  });

  it('hides progress bar when progress >= 100', () => {
    const { container } = renderWithProviders(<ChatFileChip name="up.pdf" progress={100} />);
    expect(container.querySelector('[data-testid="chat-file-chip-progress"]')).toBeNull();
  });

  it('reflects isError on the wrapper', () => {
    const { container } = renderWithProviders(<ChatFileChip name="bad.png" isError />);
    expect(container.querySelector('[data-error="true"]')).not.toBeNull();
  });

  it('renders as button when onClick is provided and forwards click', () => {
    const onClick = vi.fn();
    renderWithProviders(<ChatFileChip name="preview.pdf" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /preview\.pdf/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not bubble remove click to wrapper onClick', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    renderWithProviders(<ChatFileChip name="preview.pdf" onClick={onClick} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove preview.pdf' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps preview and remove controls as siblings with independent keyboard actions', async () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    const { container } = renderWithProviders(
      <ChatFileChip name="preview.pdf" onClick={onClick} onRemove={onRemove} />,
    );
    expect(container.querySelector('button button')).toBeNull();
    screen.getByRole('button', { name: 'preview.pdf' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
    expect(onRemove).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove preview.pdf' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses custom removeAriaLabel', () => {
    renderWithProviders(
      <ChatFileChip name="x.png" onRemove={() => {}} removeAriaLabel="移除附件" />,
    );
    expect(screen.getByRole('button', { name: '移除附件' })).toBeInTheDocument();
  });
});

describe('ChatFileChip a11y', () => {
  it.each(['light', 'dark'] as const)('has zero axe violations in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <>
        <ChatFileChip name="brief.pdf" size="1.4 MB" onRemove={() => {}} />
        <ChatFileChip name="hero.png" kind="image" progress={56} />
        <ChatFileChip name="bad.zip" isError />
        <ChatFileChip name="preview.pdf" onClick={() => {}} onRemove={() => {}} />
      </>,
      { theme },
    );
    await expectA11y(container);
  });
});
