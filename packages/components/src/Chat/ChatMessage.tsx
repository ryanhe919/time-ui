/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatMessage 组件：单条聊天消息，支持 user / assistant / system / tool / knowledge 五种角色。
 */

'use client';

import { forwardRef, useMemo, type ReactNode } from 'react';
import { css, keyframes, useTheme } from '@emotion/react';
import { ChatAvatar } from './ChatAvatar';
import type { ChatAvatarSource, ChatCommonStyleProps, ChatMessageRole } from './Chat.types';

export interface ChatMessageProps extends ChatCommonStyleProps {
  /** 消息角色。 */
  role: ChatMessageRole;
  /** 显示在气泡上方的名称（如 "Claude"、"Ryan"）。 */
  name?: ReactNode;
  /** Avatar source 覆盖；省略时根据 name 派生首字母（user / assistant）。 */
  avatar?: ChatAvatarSource;
  /** 是否渲染 avatar 槽位。默认：user / assistant 为 true，system 为 false。 */
  showAvatar?: boolean;
  /** 时间戳，可传 Date / number(ms) / string。 */
  timestamp?: Date | number | string;
  /** 流式标志：在内容末尾显示闪烁光标，并标记 data-streaming。 */
  isStreaming?: boolean;
  /** 气泡内附加内容（ToolCall / KnowledgeRefs 等子卡片）。 */
  attachments?: ReactNode;
  /** 主消息内容。 */
  children: ReactNode;
}

type Side = 'left' | 'right' | 'center';

function sideForRole(role: ChatMessageRole): Side {
  if (role === 'user') return 'right';
  if (role === 'system') return 'center';
  // assistant / tool / knowledge / 自定义角色
  return 'left';
}

function defaultShowAvatar(role: ChatMessageRole): boolean {
  if (role === 'system') return false;
  return true;
}

// hour12: false 强制 24 小时制 —— 不带 AM/PM —— 让 server (常默认 en-US 12h)
// 与 client (浏览器 locale 可能 24h) 输出一致，避免 SSR hydration mismatch。
const TIME_FMT_OPTS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

function formatTimestamp(ts: Date | number | string): string {
  if (ts instanceof Date) return ts.toLocaleTimeString([], TIME_FMT_OPTS);
  if (typeof ts === 'number') return new Date(ts).toLocaleTimeString([], TIME_FMT_OPTS);
  return String(ts);
}

const caretBlink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  function ChatMessage(props, forwardedRef) {
    const {
      role,
      name,
      avatar,
      showAvatar,
      timestamp,
      isStreaming = false,
      attachments,
      children,
      className,
      style,
      id,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;
    const side = sideForRole(role);
    const isCenter = side === 'center';
    const isRight = side === 'right';
    const shouldShowAvatar = showAvatar ?? defaultShowAvatar(role);

    // 派生 avatar source：显式 avatar > 从 name 提取首字母（仅 user/assistant）。
    const resolvedAvatar: ChatAvatarSource | undefined = useMemo(() => {
      if (avatar) return avatar;
      if (typeof name === 'string' && name.trim().length > 0) {
        return { kind: 'text', text: name } satisfies ChatAvatarSource;
      }
      if (role === 'user') return { kind: 'text', text: 'U' };
      if (role === 'assistant') return { kind: 'text', text: 'A' };
      return undefined;
    }, [avatar, name, role]);

    // 视觉规则：根据角色映射气泡背景 / 边框 / 文字色 / 是否带气泡。
    const visual = useMemo(() => {
      switch (role) {
        case 'user':
          return {
            hasBubble: true,
            bubbleBg: theme.colors.primary[100],
            bubbleColor: theme.colors.text.primary,
            border: 'transparent',
          };
        case 'assistant':
          return {
            hasBubble: true,
            bubbleBg: theme.colors.bg.surface,
            bubbleColor: theme.colors.text.primary,
            border: theme.colors.border.subtle,
          };
        case 'system':
          return {
            hasBubble: true,
            bubbleBg: theme.colors.default[100],
            bubbleColor: theme.colors.text.secondary,
            border: 'transparent',
          };
        case 'tool':
        case 'knowledge':
        default:
          return {
            hasBubble: false,
            bubbleBg: 'transparent',
            bubbleColor: theme.colors.text.primary,
            border: 'transparent',
          };
      }
    }, [role, theme.colors]);

    // 气泡圆角："tail" 圆角靠近 avatar 一侧。
    const bubbleRadiusCss = useMemo(() => {
      const big = tokens.bubbleRadius;
      const small = tokens.bubbleRadiusSmall;
      if (isRight) {
        // user 右侧：右下角小（贴近右侧 avatar）。
        return `${big} ${big} ${small} ${big}`;
      }
      // assistant 等左侧：左下角小（贴近左侧 avatar）。
      return `${big} ${big} ${big} ${small}`;
    }, [isRight, tokens.bubbleRadius, tokens.bubbleRadiusSmall]);

    const rootCss = css`
      display: flex;
      flex-direction: ${isRight ? 'row-reverse' : 'row'};
      justify-content: ${isCenter ? 'center' : 'flex-start'};
      align-items: flex-start;
      gap: ${tokens.messageInnerGap};
      width: 100%;
      font-family: inherit;
    `;

    const bodyCss = css`
      display: flex;
      flex-direction: column;
      align-items: ${isRight ? 'flex-end' : isCenter ? 'center' : 'flex-start'};
      gap: ${tokens.metaGap};
      min-width: 0;
      max-width: ${isCenter ? '100%' : tokens.bubbleMaxWidth};
    `;

    const metaCss = css`
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      font-size: ${tokens.metaFontSize};
      color: ${theme.colors.text.secondary};
      line-height: 1.2;
    `;

    // system 在中心展示成 pill；其它带气泡角色用普通气泡；tool / knowledge 不带气泡（仅装 attachments / children）。
    const bubbleCss = visual.hasBubble
      ? isCenter
        ? css`
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 9999px;
            background-color: ${visual.bubbleBg};
            color: ${visual.bubbleColor};
            font-size: ${tokens.metaFontSize};
            line-height: ${tokens.contentLineHeight};
            word-break: break-word;
            white-space: pre-wrap;
          `
        : css`
            display: inline-block;
            padding: ${tokens.bubblePaddingY} ${tokens.bubblePaddingX};
            border-radius: ${bubbleRadiusCss};
            background-color: ${visual.bubbleBg};
            color: ${visual.bubbleColor};
            font-size: ${tokens.contentFontSize};
            line-height: ${tokens.contentLineHeight};
            box-shadow: ${visual.border !== 'transparent'
              ? `inset 0 0 0 1px ${visual.border}`
              : 'none'};
            word-break: break-word;
            /* Y6 (chat-audit)：user 输入要 pre-wrap 保留换行；
               assistant / 其它 role 默认 normal，避免嵌入 ChatMarkdown 时段落
               之间多出一个空行。消费者若需要 assistant 也保留输入换行，自己包一层
               <span style={{ whiteSpace: 'pre-wrap' }}> 即可。 */
            white-space: ${isRight ? 'pre-wrap' : 'normal'};
            max-width: 100%;
          `
      : css`
          display: block;
          font-size: ${tokens.contentFontSize};
          line-height: ${tokens.contentLineHeight};
          color: ${visual.bubbleColor};
          word-break: break-word;
          max-width: 100%;
        `;

    // Y5 (chat-audit)：caret 用 em 单位跟随字号缩放，不再硬编码 8x14px。
    // 0.55em / 1em 在 14px 字号下视觉等价于原 8x14px，但放大字号后比例正确。
    const caretCss = css`
      display: inline-block;
      width: 0.55em;
      height: 1em;
      margin-left: 0.15em;
      vertical-align: -0.12em;
      background-color: currentColor;
      border-radius: 1px;
      animation: ${caretBlink} 1s steps(1, end) infinite;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
        opacity: 0.7;
      }
    `;

    const attachmentsCss = css`
      display: flex;
      flex-direction: column;
      gap: ${tokens.metaGap};
      width: 100%;
      margin-top: ${tokens.metaGap};
    `;

    const showName = !!name;
    const showTimestamp = timestamp !== undefined;
    const showHeader = (showName || showTimestamp) && !isCenter;

    return (
      <div
        ref={forwardedRef}
        id={id}
        className={className}
        style={style}
        css={rootCss}
        role="article"
        data-role={role}
        data-side={side}
        data-streaming={isStreaming || undefined}
      >
        {shouldShowAvatar && resolvedAvatar && !isCenter ? (
          <ChatAvatar
            source={resolvedAvatar}
            role={role}
            aria-label={typeof name === 'string' ? name : undefined}
          />
        ) : null}
        <div css={bodyCss}>
          {showHeader ? (
            <div css={metaCss} data-meta="">
              {showName ? (
                <span
                  css={css`
                    font-weight: 600;
                    color: ${theme.colors.text.primary};
                  `}
                >
                  {name}
                </span>
              ) : null}
              {showTimestamp ? (
                <time
                  dateTime={
                    timestamp instanceof Date
                      ? timestamp.toISOString()
                      : typeof timestamp === 'number'
                        ? new Date(timestamp).toISOString()
                        : String(timestamp)
                  }
                >
                  {formatTimestamp(timestamp as Date | number | string)}
                </time>
              ) : null}
            </div>
          ) : null}
          {children !== null && children !== undefined && children !== false ? (
            <div css={bubbleCss} data-bubble="">
              {children}
              {isStreaming ? (
                <span aria-hidden="true" data-streaming-caret="" css={caretCss} />
              ) : null}
            </div>
          ) : null}
          {attachments ? (
            <div css={attachmentsCss} data-attachments="">
              {attachments}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

(ChatMessage as unknown as { displayName: string }).displayName = 'ChatMessage';
