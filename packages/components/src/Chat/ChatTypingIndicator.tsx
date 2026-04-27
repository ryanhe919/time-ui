/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatTypingIndicator 组件：三点跳动的「正在输入」指示器，含 reduced-motion 回退。
 */

'use client';

import { forwardRef } from 'react';
import { css, keyframes, useTheme } from '@emotion/react';
import type { ChatCommonStyleProps } from './Chat.types';

export type ChatTypingIndicatorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ChatTypingIndicatorProps extends ChatCommonStyleProps {
  /** 尺寸：xs / sm / md / lg / xl，默认 md。 */
  size?: ChatTypingIndicatorSize;
  /** ARIA-live 公告文本，默认 "AI is typing"。 */
  label?: string;
}

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-25%);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

export const ChatTypingIndicator = forwardRef<HTMLSpanElement, ChatTypingIndicatorProps>(
  function ChatTypingIndicator(props, forwardedRef) {
    const { size = 'md', label = 'AI is typing', className, style, id } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;

    const dotSize =
      size === 'xs'
        ? '4px'
        : size === 'sm'
          ? '5px'
          : size === 'lg'
            ? '7px'
            : size === 'xl'
              ? '8px'
              : tokens.typingDotSize;
    const dotGap =
      size === 'xs'
        ? '2px'
        : size === 'sm'
          ? '3px'
          : size === 'lg'
            ? '5px'
            : size === 'xl'
              ? '6px'
              : tokens.typingDotGap;
    const dotColor = theme.colors.text.muted;
    const duration = '1.2s';

    const rootCss = css`
      display: inline-flex;
      align-items: center;
      gap: ${dotGap};
      padding: 6px 10px;
      border-radius: 9999px;
      background-color: ${theme.colors.bg.surface};
      box-shadow: inset 0 0 0 1px ${theme.colors.border.subtle};
      line-height: 1;
    `;

    const dotCss = (delay: string) => css`
      display: inline-block;
      width: ${dotSize};
      height: ${dotSize};
      border-radius: 9999px;
      background-color: ${dotColor};
      animation: ${bounce} ${duration} ${delay} infinite ease-in-out both;
      @media (prefers-reduced-motion: reduce) {
        animation: ${pulse} 1.6s ${delay} infinite ease-in-out both;
        transform: none;
      }
    `;

    return (
      <span
        ref={forwardedRef}
        id={id}
        className={className}
        style={style}
        css={rootCss}
        role="status"
        aria-live="polite"
        aria-label={label}
        data-size={size}
      >
        <span aria-hidden="true" data-typing-dot="0" css={dotCss('0s')} />
        <span aria-hidden="true" data-typing-dot="1" css={dotCss('0.15s')} />
        <span aria-hidden="true" data-typing-dot="2" css={dotCss('0.3s')} />
      </span>
    );
  },
);

(ChatTypingIndicator as unknown as { displayName: string }).displayName = 'ChatTypingIndicator';
