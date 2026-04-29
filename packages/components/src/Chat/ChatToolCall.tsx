/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatToolCall 组件：折叠卡片，展示工具调用名称、参数、状态与结果。
 */

'use client';

import { forwardRef, useId, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import type { ChatCommonStyleProps, ChatToolCallData, ChatToolCallStatus } from './Chat.types';

export interface ChatToolCallProps extends ChatCommonStyleProps, Partial<ChatToolCallData> {
  /** 工具名（必填，覆盖 data.name）。 */
  name: string;
  /** 默认折叠态。 */
  defaultExpanded?: boolean;
  /** 受控折叠态。 */
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** 自定义参数渲染（覆盖默认 JSON 序列化）。 */
  renderArguments?: (args: unknown) => ReactNode;
  /** 自定义结果渲染。 */
  renderResult?: (result: unknown) => ReactNode;
  /** 隐藏头部右侧的展开图标（默认显示）。 */
  isCollapsible?: boolean;
}

const STATUS_LABEL: Record<ChatToolCallStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  success: 'Success',
  error: 'Error',
};

function formatJSON(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export const ChatToolCall = forwardRef<HTMLDivElement, ChatToolCallProps>(function ChatToolCall(
  {
    name,
    arguments: args,
    result,
    status = 'success',
    error,
    defaultExpanded = false,
    isExpanded,
    onExpandedChange,
    renderArguments,
    renderResult,
    isCollapsible = true,
    className,
    style,
    id,
  },
  ref,
) {
  const theme = useTheme();
  const tokens = theme.components.chat;
  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const baseId = id ?? `timeui-chat-toolcall-${safeAutoId}`;
  const bodyId = `${baseId}-body`;

  const [expanded, setExpanded] = useControllableState<boolean>({
    value: isExpanded,
    defaultValue: (isExpanded !== undefined ? undefined : defaultExpanded) as boolean,
    onChange: onExpandedChange,
    name: 'ChatToolCall',
  });

  const statusPalette: Record<ChatToolCallStatus, { fg: string; bg: string; dot: string }> = {
    pending: {
      fg: theme.colors.text.secondary,
      bg: theme.colors.default[100],
      dot: theme.colors.default[500],
    },
    running: {
      fg: theme.colors.primary.DEFAULT,
      bg: theme.colors.primary[100],
      dot: theme.colors.primary.DEFAULT,
    },
    success: {
      fg: theme.colors.success.DEFAULT,
      bg: theme.colors.success[100],
      dot: theme.colors.success.DEFAULT,
    },
    error: {
      fg: theme.colors.danger.DEFAULT,
      bg: theme.colors.danger[100],
      dot: theme.colors.danger.DEFAULT,
    },
  };
  const palette = statusPalette[status];
  const duration = theme.motion.duration.normal;
  const easing = theme.motion.easing.easeInOut;

  const headerCss = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${tokens.toolCardGap};
    width: 100%;
    padding: ${tokens.toolCardPaddingY} ${tokens.toolCardPaddingX};
    background: transparent;
    border: 0;
    color: inherit;
    text-align: left;
    cursor: ${isCollapsible ? 'pointer' : 'default'};
    border-radius: ${tokens.toolCardRadius};
    font: inherit;
    /* Y4：focus 时让整张卡片高亮（外凸 ring），不再用 inset outline——
       与 ChatActionButton / ChatSendButton / ChatKnowledgeRefs 的标准一致。 */
    &:focus-visible {
      outline: none;
    }
    &:focus-visible ~ * {
      /* placeholder：实际 ring 在 containerCss 通过 :focus-within 画 */
    }
  `;

  const containerCss = css`
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: ${theme.colors.bg.surface};
    border: 1px solid ${theme.colors.border.subtle};
    border-radius: ${tokens.toolCardRadius};
    overflow: hidden;
    font-family: inherit;
    transition:
      border-color ${duration} ${easing},
      box-shadow ${duration} ${easing};

    /* Y4：键盘 focus 落在内部 header button 时，让整张卡片高亮（外凸 ring + 主色边框）。 */
    &:focus-within {
      border-color: ${theme.colors.border.focus ?? theme.colors.focus};
      box-shadow: 0 0 0 2px ${theme.colors.border.focus ?? theme.colors.focus};
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  const titleRowCss = css`
    display: flex;
    align-items: center;
    gap: ${tokens.toolCardGap};
    min-width: 0;
    flex: 1;
  `;

  const iconCss = css`
    flex: none;
    color: ${theme.colors.text.secondary};
  `;

  const nameCss = css`
    font-size: 13px;
    font-weight: 600;
    color: ${theme.colors.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;

  const statusBadgeCss = css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 500;
    color: ${palette.fg};
    background-color: ${palette.bg};
    flex: none;
  `;

  const dotCss = css`
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background-color: ${palette.dot};
    ${status === 'running' ? `animation: timeui-chat-toolcall-pulse 1s ${easing} infinite;` : ''}
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
    @keyframes timeui-chat-toolcall-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.35;
      }
    }
  `;

  const chevronCss = css`
    flex: none;
    color: ${theme.colors.text.secondary};
    transition: transform ${duration} ${easing};
    transform: rotate(${expanded ? 180 : 0}deg);
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  const bodyCss = css`
    display: flex;
    flex-direction: column;
    gap: ${tokens.toolCardGap};
    padding: 0 ${tokens.toolCardPaddingX} ${tokens.toolCardPaddingY};
    border-top: 1px solid ${theme.colors.border.subtle};
  `;

  const sectionLabelCss = css`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${theme.colors.text.muted};
    margin-top: ${tokens.toolCardPaddingY};
  `;

  const codeCss = css`
    margin: 0;
    padding: 8px 10px;
    font-family: ${theme.typography.fontFamily?.mono ?? 'ui-monospace, SFMono-Regular, monospace'};
    font-size: 12px;
    line-height: 1.5;
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.bg.sunken};
    border-radius: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 240px;
    overflow: auto;
  `;

  const errorBoxCss = css`
    margin: 0;
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.5;
    color: ${theme.colors.danger.DEFAULT};
    background-color: ${theme.colors.danger[100]};
    border-radius: 8px;
  `;

  const argsContent = renderArguments
    ? renderArguments(args)
    : args !== undefined && <pre css={codeCss}>{formatJSON(args)}</pre>;
  const resultContent = renderResult
    ? renderResult(result)
    : result !== undefined && <pre css={codeCss}>{formatJSON(result)}</pre>;

  const handleToggle = () => {
    if (!isCollapsible) return;
    setExpanded(!expanded);
  };

  return (
    <div
      ref={ref}
      id={baseId}
      className={className}
      style={style}
      data-status={status}
      data-expanded={expanded || undefined}
      css={containerCss}
    >
      {isCollapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={handleToggle}
          css={headerCss}
        >
          <span css={titleRowCss}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              css={iconCss}
            >
              <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6L13 9.6 14.7 8z" />
            </svg>
            <span css={nameCss}>{name}</span>
          </span>
          <span css={statusBadgeCss} aria-label={`Status: ${STATUS_LABEL[status]}`}>
            <span aria-hidden css={dotCss} />
            <span>{STATUS_LABEL[status]}</span>
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            css={chevronCss}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      ) : (
        <div css={headerCss} aria-disabled={true}>
          <span css={titleRowCss}>
            <span css={nameCss}>{name}</span>
          </span>
          <span css={statusBadgeCss}>
            <span aria-hidden css={dotCss} />
            <span>{STATUS_LABEL[status]}</span>
          </span>
        </div>
      )}
      {expanded ? (
        <div id={bodyId} role="region" aria-label={`${name} details`} css={bodyCss}>
          {args !== undefined ? (
            <>
              <div css={sectionLabelCss}>Arguments</div>
              {argsContent}
            </>
          ) : null}
          {status === 'error' && error ? (
            <>
              <div css={sectionLabelCss}>Error</div>
              <div css={errorBoxCss}>{error}</div>
            </>
          ) : null}
          {result !== undefined ? (
            <>
              <div css={sectionLabelCss}>Result</div>
              {resultContent}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

(ChatToolCall as unknown as { displayName: string }).displayName = 'ChatToolCall';
