/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatSendButton 组件：聊天 composer 的 primary 发送 / 停止按钮。
 */

'use client';

import { forwardRef } from 'react';
import { css, useTheme } from '@emotion/react';
import type { ChatCommonStyleProps } from './Chat.types';

export interface ChatSendButtonProps extends ChatCommonStyleProps {
  onClick?: () => void;
  isDisabled?: boolean;
  /** 加载 / 流式状态 — 显示停止图标，点击触发 onStop。 */
  isStreaming?: boolean;
  onStop?: () => void;
  'aria-label'?: string;
  stopAriaLabel?: string;
}

const ArrowUpIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    focusable={false}
  >
    <path d="M8 13V3" />
    <path d="m3.5 7.5 4.5-4.5 4.5 4.5" />
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
    <rect x="4" y="4" width="8" height="8" rx="1.5" />
  </svg>
);

export const ChatSendButton = forwardRef<HTMLButtonElement, ChatSendButtonProps>(
  function ChatSendButton(props, forwardedRef) {
    const {
      onClick,
      isDisabled = false,
      isStreaming = false,
      onStop,
      'aria-label': ariaLabel = 'Send message',
      stopAriaLabel = 'Stop generation',
      className,
      style,
      id,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const duration = theme.motion.duration.normal ?? '250ms';

    const primary = theme.colors.primary;
    const neutral = theme.colors.default;

    // streaming：保持 primary 实色，强调"可点击停止"。
    // 普通禁用：灰色背景。
    // 普通可用：primary 实色。
    const isGrayedOut = isDisabled && !isStreaming;
    const bg = isGrayedOut ? neutral[200] : primary.DEFAULT;
    const fg = isGrayedOut ? theme.colors.text.disabled : primary.foreground;
    const hoverBg = isGrayedOut ? neutral[200] : primary[600];

    const handleClick = () => {
      if (isStreaming) {
        onStop?.();
        return;
      }
      if (isDisabled) return;
      onClick?.();
    };

    const buttonCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: ${tokens.composerActionSize};
      height: ${tokens.composerActionSize};
      padding: 0;
      margin: 0;
      border: 0;
      border-radius: ${tokens.composerActionRadius};
      background-color: ${bg};
      color: ${fg};
      cursor: ${isDisabled && !isStreaming ? 'not-allowed' : 'pointer'};
      flex: none;
      opacity: ${isDisabled && !isStreaming ? 0.6 : 1};
      pointer-events: ${isDisabled && !isStreaming ? 'none' : 'auto'};
      outline: 1.5px solid transparent;
      transition:
        background-color ${duration},
        color ${duration},
        opacity ${duration},
        transform ${duration};

      &:hover:not(:disabled):not([aria-disabled='true']) {
        background-color: ${hoverBg};
      }

      &:active:not(:disabled):not([aria-disabled='true']) {
        transform: scale(0.95);
      }

      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: 2px;
      }

      & > svg {
        width: ${tokens.composerActionIconSize};
        height: ${tokens.composerActionIconSize};
        display: block;
        flex: none;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
        &:active:not(:disabled):not([aria-disabled='true']) {
          transform: none;
        }
      }
    `;

    return (
      <button
        ref={forwardedRef}
        id={id}
        type="button"
        className={className}
        style={style}
        css={buttonCss}
        onClick={handleClick}
        disabled={isDisabled && !isStreaming}
        aria-label={isStreaming ? stopAriaLabel : ariaLabel}
        aria-disabled={isDisabled && !isStreaming ? true : undefined}
        data-streaming={isStreaming || undefined}
        data-disabled={isDisabled || undefined}
      >
        {isStreaming ? <StopIcon /> : <ArrowUpIcon />}
      </button>
    );
  },
);

(ChatSendButton as unknown as { displayName: string }).displayName = 'ChatSendButton';
