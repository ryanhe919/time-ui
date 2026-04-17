/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatMessageList 组件：消息列表容器，含 maxHeight 滚动 + 自动滚到底部 + ARIA live 区域。
 */

'use client';

import { Children, forwardRef, useCallback, useRef, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useIsomorphicLayoutEffect } from '../utils';
import type { ChatCommonStyleProps } from './Chat.types';

export interface ChatMessageListProps extends ChatCommonStyleProps {
  /** 子节点变化时自动滚到底部。默认 true。 */
  autoScrollToBottom?: boolean;
  /** 最大高度（启用滚动）；默认 'none'，由父级决定。 */
  maxHeight?: string | number;
  /** 子节点：通常是 <ChatMessage>。 */
  children: ReactNode;
  /** ARIA role；默认 'log'。 */
  role?: 'log' | 'list' | 'region';
  /** polite live region；默认 true。 */
  isLive?: boolean;
}

function asLength(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList(props, forwardedRef) {
    const {
      autoScrollToBottom = true,
      maxHeight,
      children,
      role = 'log',
      isLive = true,
      className,
      style,
      id,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;

    const innerRef = useRef<HTMLDivElement | null>(null);
    // 用 child 数量作为 effect 依赖键；新增消息时触发滚动。
    const childCount = Children.count(children);

    const scrollToBottom = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      // jsdom 没有真实滚动；只要给 scrollTop 赋值即可被测试断言。
      el.scrollTop = el.scrollHeight;
    }, []);

    useIsomorphicLayoutEffect(() => {
      if (!autoScrollToBottom) return;
      if (maxHeight === undefined) return; // 无滚动容器时无需滚到底
      scrollToBottom();
    }, [autoScrollToBottom, childCount, maxHeight, scrollToBottom]);

    const resolvedMaxHeight = asLength(maxHeight);
    const isScrollable = resolvedMaxHeight !== undefined;
    const thumbColor = theme.colors.default[500];
    const thumbHoverColor = theme.colors.default[600] ?? theme.colors.text.muted;

    const rootCss = css`
      display: flex;
      flex-direction: column;
      gap: ${tokens.messageGap};
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      ${isScrollable
        ? `
          max-height: ${resolvedMaxHeight};
          overflow-y: auto;
          overflow-x: hidden;
          /* 细瘦半透明 thumb，悬停加深；轨道透明融入背景。 */
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          scrollbar-gutter: stable;
          &:hover, &:focus-within {
            scrollbar-color: ${thumbColor} transparent;
          }
          &::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            background: transparent;
          }
          &::-webkit-scrollbar-track {
            background: transparent;
          }
          &::-webkit-scrollbar-thumb {
            background: transparent;
            border: 2px solid transparent;
            border-radius: 9999px;
            background-clip: padding-box;
            transition: background-color 200ms ease;
          }
          &:hover::-webkit-scrollbar-thumb,
          &:focus-within::-webkit-scrollbar-thumb {
            background-color: ${thumbColor};
          }
          &::-webkit-scrollbar-thumb:hover {
            background-color: ${thumbHoverColor};
          }
          &::-webkit-scrollbar-corner {
            background: transparent;
          }
        `
        : ''}
    `;

    return (
      <div
        ref={mergeRefs(innerRef, forwardedRef)}
        id={id}
        className={className}
        style={style}
        css={rootCss}
        role={role}
        aria-live={isLive ? 'polite' : undefined}
        aria-relevant={isLive ? 'additions' : undefined}
        data-scrollable={isScrollable || undefined}
      >
        {children}
      </div>
    );
  },
);

(ChatMessageList as unknown as { displayName: string }).displayName = 'ChatMessageList';
