/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 浮动"回到底部"按钮，与 ChatMessageList 的 onAtBottomChange 回调配套：
 *              用户向上滚开后显示，点击后滚回最新消息并恢复 auto-follow。
 */

'use client';

import { forwardRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';

export interface ChatScrollToBottomProps {
  /**
   * 是否显示。一般绑定 `<ChatMessageList onAtBottomChange={(at) => setShow(!at)} />`。
   * 隐藏时不渲染，避免占用 DOM 与 a11y 树。
   */
  isVisible: boolean;
  /** 点击触发：通常调用 `messageListRef.current?.scrollTo({ top: scrollHeight })`。 */
  onClick: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  /** 可选的"N 条新消息"未读计数；> 0 时显示在按钮内。 */
  unreadCount?: number;
  /** 可选自定义图标，默认是向下箭头。 */
  icon?: ReactNode;
  /** ARIA label；默认 'Scroll to latest messages'。 */
  'aria-label'?: string;
  className?: string;
  id?: string;
}

const DefaultArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden focusable="false">
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChatScrollToBottom = forwardRef<HTMLButtonElement, ChatScrollToBottomProps>(
  function ChatScrollToBottom(props, ref) {
    const {
      isVisible,
      onClick,
      unreadCount,
      icon,
      'aria-label': ariaLabel = 'Scroll to latest messages',
      className,
      id,
    } = props;

    const theme = useTheme();
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const surface = theme.colors.bg.surface;
    const fg = theme.colors.text.primary;
    const duration = theme.motion.duration.normal ?? '250ms';

    if (!isVisible) return null;

    const showCount = typeof unreadCount === 'number' && unreadCount > 0;

    const buttonCss = css`
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: ${showCount ? '6px 10px 6px 8px' : '6px'};
      min-height: 32px;
      ${showCount ? '' : 'min-width: 32px; justify-content: center;'}
      border: 1px solid ${theme.colors.border.default};
      border-radius: 9999px;
      background-color: ${surface};
      color: ${fg};
      font-family: inherit;
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transition:
        transform ${duration},
        box-shadow ${duration},
        background-color ${duration};

      &:hover {
        background-color: ${theme.colors.bg.muted ?? surface};
      }

      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: 2px;
      }

      &:active {
        transform: translateY(1px);
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const iconWrapperCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: ${fg};
    `;

    return (
      <button
        ref={ref}
        type="button"
        id={id}
        className={className}
        css={buttonCss}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <span aria-hidden css={iconWrapperCss}>
          {icon ?? <DefaultArrowIcon />}
        </span>
        {showCount ? <span>{unreadCount}</span> : null}
      </button>
    );
  },
);

(ChatScrollToBottom as unknown as { displayName: string }).displayName = 'ChatScrollToBottom';
