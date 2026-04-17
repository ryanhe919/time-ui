/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatAvatar 组件：聊天头像，支持图片 / 文字 / 节点，并按角色着色背景。
 */

'use client';

import { forwardRef, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import type { ChatAvatarSource, ChatCommonStyleProps, ChatMessageRole } from './Chat.types';

export type ChatAvatarSize = 'sm' | 'md' | 'lg';

export interface ChatAvatarProps extends ChatCommonStyleProps {
  /** 头像 source：image / text / node。 */
  source: ChatAvatarSource;
  /** 尺寸：sm 24px、md = tokens.avatarSize、lg 40px。 */
  size?: ChatAvatarSize;
  /** 角色，用于着色背景 tint。 */
  role?: ChatMessageRole;
  /** 无障碍标签（image 会覆盖 alt）。 */
  'aria-label'?: string;
}

/** 根据角色解析背景 tint + 前景文字色。 */
function resolveRoleTint(
  theme: ReturnType<typeof useTheme>,
  role: ChatMessageRole | undefined,
): { bg: string; fg: string } {
  switch (role) {
    case 'user':
      return { bg: theme.colors.secondary[100], fg: theme.colors.secondary[600] };
    case 'assistant':
      return { bg: theme.colors.primary[100], fg: theme.colors.primary[600] };
    case 'tool':
      return { bg: theme.colors.warning[100], fg: theme.colors.warning[600] };
    case 'knowledge':
      return { bg: theme.colors.success[100], fg: theme.colors.success[600] };
    case 'system':
    default:
      return { bg: theme.colors.default[100], fg: theme.colors.text.secondary };
  }
}

/** 从文字中提取 1-2 个字符作为首字母缩写。 */
function extractInitials(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  // 用空白分段，取首尾两段首字母。
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    // 单词：取前 2 个字符（支持中文 / emoji 时可能是 1 个码点；使用数组切片）。
    const chars = Array.from(parts[0]!);
    return chars
      .slice(0, chars.length >= 2 ? 2 : 1)
      .join('')
      .toUpperCase();
  }
  const first = Array.from(parts[0]!)[0] ?? '';
  const last = Array.from(parts[parts.length - 1]!)[0] ?? '';
  return (first + last).toUpperCase();
}

export const ChatAvatar = forwardRef<HTMLSpanElement, ChatAvatarProps>(
  function ChatAvatar(props, forwardedRef) {
    const { source, size = 'md', role, className, style, id, 'aria-label': ariaLabel } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;

    const dim = size === 'sm' ? '24px' : size === 'lg' ? '40px' : tokens.avatarSize;
    const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '16px' : '13px';

    const { bg, fg } = resolveRoleTint(theme, role);

    const isImage = source.kind === 'image';

    const rootCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: ${dim};
      height: ${dim};
      border-radius: ${tokens.avatarRadius};
      background-color: ${isImage ? 'transparent' : bg};
      color: ${fg};
      font-size: ${fontSize};
      font-weight: 600;
      line-height: 1;
      overflow: hidden;
      user-select: none;
      letter-spacing: 0.02em;
    `;

    const imgCss = css`
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    `;

    let content: ReactNode = null;
    if (source.kind === 'image') {
      content = (
        <img src={source.src} alt={ariaLabel ?? source.alt ?? ''} css={imgCss} draggable={false} />
      );
    } else if (source.kind === 'text') {
      content = (
        <span aria-hidden={ariaLabel ? 'true' : undefined}>{extractInitials(source.text)}</span>
      );
    } else {
      content = <span aria-hidden={ariaLabel ? 'true' : undefined}>{source.node}</span>;
    }

    return (
      <span
        ref={forwardedRef}
        id={id}
        className={className}
        style={style}
        css={rootCss}
        role={isImage ? undefined : 'img'}
        aria-label={isImage ? undefined : ariaLabel}
        data-role={role}
        data-size={size}
        data-kind={source.kind}
      >
        {content}
      </span>
    );
  },
);

(ChatAvatar as unknown as { displayName: string }).displayName = 'ChatAvatar';
