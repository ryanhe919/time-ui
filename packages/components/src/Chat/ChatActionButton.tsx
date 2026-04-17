/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatActionButton 组件：聊天 composer 工具栏的圆形 icon 按钮。
 */

'use client';

import { forwardRef, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import type { ChatCommonStyleProps } from './Chat.types';

export interface ChatActionButtonProps extends ChatCommonStyleProps {
  /** 图标节点（建议 16x16 SVG）。 */
  children: ReactNode;
  onClick?: () => void;
  isDisabled?: boolean;
  /** 切换的"激活"状态（如麦克风正在录制）。默认 false。 */
  isActive?: boolean;
  /** ARIA 标签 — 纯图标按钮必填。 */
  'aria-label': string;
  /** 悬浮提示文字（原生 title）。可选。 */
  tooltip?: string;
  /** 默认 type=button。 */
  type?: 'button' | 'submit';
}

export const ChatActionButton = forwardRef<HTMLButtonElement, ChatActionButtonProps>(
  function ChatActionButton(props, forwardedRef) {
    const {
      children,
      onClick,
      isDisabled = false,
      isActive = false,
      'aria-label': ariaLabel,
      tooltip,
      type = 'button',
      className,
      style,
      id,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const duration = theme.motion.duration.normal ?? '250ms';

    const baseFg = theme.colors.text.secondary;
    const hoverBg = theme.colors.default[100];
    const activeBg = theme.colors.primary[100];
    const activeFg = theme.colors.primary[600];

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
      background-color: ${isActive ? activeBg : 'transparent'};
      color: ${isActive ? activeFg : baseFg};
      cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
      flex: none;
      opacity: ${isDisabled ? 0.4 : 1};
      pointer-events: ${isDisabled ? 'none' : 'auto'};
      outline: 1.5px solid transparent;
      transition:
        background-color ${duration},
        color ${duration},
        opacity ${duration};

      &:hover:not(:disabled):not([aria-disabled='true']) {
        background-color: ${isActive ? activeBg : hoverBg};
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
      }
    `;

    return (
      <button
        ref={forwardedRef}
        id={id}
        type={type}
        className={className}
        style={style}
        css={buttonCss}
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-pressed={isActive || undefined}
        aria-disabled={isDisabled || undefined}
        title={tooltip}
        data-active={isActive || undefined}
        data-disabled={isDisabled || undefined}
      >
        {children}
      </button>
    );
  },
);

(ChatActionButton as unknown as { displayName: string }).displayName = 'ChatActionButton';
