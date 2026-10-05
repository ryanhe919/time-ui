/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatMessageList 组件：消息列表容器，含 maxHeight 滚动 + 自动滚到底部 + ARIA live 区域。
 */

'use client';

import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useIsomorphicLayoutEffect } from '../utils';
import type { ChatCommonStyleProps } from './Chat.types';

/** 阈值：用户离底部多少 px 内仍视为"贴底"，新消息可继续 auto-scroll。 */
const NEAR_BOTTOM_THRESHOLD_PX = 32;

export interface ChatMessageListProps extends ChatCommonStyleProps {
  /**
   * 子节点变化时自动滚到底部。默认 true。
   *
   * **抢位防护**：只有在用户已经"贴底"（离底部 ≤ 32px）时才自动滚动；
   * 用户向上滚动查看历史时不会被新消息打断。配合 `<ChatScrollToBottom>` 浮动按钮，
   * 可让用户手动回到底部并恢复 auto-follow 行为。
   */
  shouldAutoScrollToBottom?: boolean;
  /** 最大高度（启用滚动）；默认 'none'，由父级决定。 */
  maxHeight?: string | number;
  /** 子节点：通常是 <ChatMessage>。 */
  children: ReactNode;
  /** ARIA role；默认 'log'。 */
  role?: 'log' | 'list' | 'region';
  /**
   * polite live region；默认 true。
   *
   * **a11y 设计共识**：当 `isLive` 为 true 时，容器声明
   * `role="log"` + `aria-live="polite"` + `aria-relevant="additions"`。
   * 故意省略 `'text'` 是为了避免屏幕阅读器在 assistant 流式输出每个 token 时
   * 重复朗读已念过的部分；新消息节点加入仍会被朗读。
   */
  isLive?: boolean;
  /**
   * 用户向上滚开导致 auto-scroll 被抑制时的回调；接收 `true` 表示"用户离底了，
   * 该显示 ScrollToBottom 按钮"，`false` 表示"用户回到底部了，按钮可隐藏"。
   * 与 `<ChatScrollToBottom>` 浮动按钮配套使用。
   */
  onAtBottomChange?: (atBottom: boolean) => void;
}

function asLength(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList(props, forwardedRef) {
    const {
      shouldAutoScrollToBottom = true,
      maxHeight,
      children,
      role = 'log',
      isLive = true,
      onAtBottomChange,
      className,
      style,
      id,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;

    const innerRef = useRef<HTMLDivElement | null>(null);
    // 跟踪用户是否"贴底"：默认 true（首次渲染视作贴底）。
    const isNearBottomRef = useRef(true);
    const [, forceTick] = useState(0);

    const isNearBottom = useCallback((el: HTMLDivElement) => {
      return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_THRESHOLD_PX;
    }, []);

    const scrollToBottom = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      // jsdom 没有真实滚动；只要给 scrollTop 赋值即可被测试断言。
      el.scrollTop = el.scrollHeight;
    }, []);

    useIsomorphicLayoutEffect(() => {
      if (!shouldAutoScrollToBottom) return;
      if (maxHeight === undefined) return; // 无滚动容器时无需滚到底
      // 抢位防护：只在用户当前贴底时才自动滚动；向上看历史时不打扰。
      if (isNearBottomRef.current) {
        scrollToBottom();
      }
    }, [shouldAutoScrollToBottom, children, maxHeight, scrollToBottom]);

    // Streaming text, highlighted code and loaded images can grow an existing
    // message without adding a child to the list or re-rendering this component.
    useEffect(() => {
      const el = innerRef.current;
      if (!el || maxHeight === undefined || !shouldAutoScrollToBottom) return;
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => {
        if (isNearBottomRef.current) scrollToBottom();
      });
      observer.observe(el);
      for (const child of Array.from(el.children)) observer.observe(child);
      return () => observer.disconnect();
    }, [children, maxHeight, shouldAutoScrollToBottom, scrollToBottom]);

    useEffect(() => {
      const el = innerRef.current;
      if (!el || maxHeight === undefined) return;
      const handle = () => {
        const next = isNearBottom(el);
        if (next !== isNearBottomRef.current) {
          isNearBottomRef.current = next;
          onAtBottomChange?.(next);
          forceTick((t) => t + 1);
        }
      };
      el.addEventListener('scroll', handle, { passive: true });
      // 初始同步一次
      handle();
      return () => el.removeEventListener('scroll', handle);
    }, [maxHeight, isNearBottom, onAtBottomChange]);

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
