/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatKnowledgeRefs 组件：知识库引用 chips 列表。
 */

'use client';

import { forwardRef, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import type { ChatCommonStyleProps, ChatKnowledgeReference } from './Chat.types';

export interface ChatKnowledgeRefsProps extends ChatCommonStyleProps {
  /** 引用列表。 */
  references: ReadonlyArray<ChatKnowledgeReference>;
  /** 顶部小标题，默认 "Sources"。传 false 隐藏。 */
  title?: ReactNode | false;
  /** 单个 chip 点击回调（href 缺失时仍触发）。 */
  onSelect?: (reference: ChatKnowledgeReference) => void;
  /** 是否对带 href 的 chip 加打开新窗口属性。默认 true。 */
  isExternal?: boolean;
}

const SOURCE_INITIAL: Record<string, string> = {
  pdf: 'P',
  web: 'W',
  note: 'N',
  doc: 'D',
};

function getSourceInitial(ref: ChatKnowledgeReference): string {
  if (ref.source && SOURCE_INITIAL[ref.source]) return SOURCE_INITIAL[ref.source]!;
  if (ref.source) return ref.source.charAt(0).toUpperCase();
  return ref.title.charAt(0).toUpperCase();
}

export const ChatKnowledgeRefs = forwardRef<HTMLDivElement, ChatKnowledgeRefsProps>(
  function ChatKnowledgeRefs(
    { references, title = 'Sources', onSelect, isExternal = true, className, style, id },
    ref,
  ) {
    const theme = useTheme();
    const tokens = theme.components.chat;

    if (references.length === 0) return null;

    const containerCss = css`
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    `;

    const titleCss = css`
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${theme.colors.text.muted};
    `;

    // 用 div + role="list" 而非 ul/li：避开宿主页面（如 MDX prose）对 li 的 padding/::before 样式覆盖。
    const listCss = css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0;
      padding: 0;
    `;

    const chipBaseCss = css`
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: ${tokens.citationChipHeight};
      padding: 0 ${tokens.citationChipPaddingX};
      border-radius: ${tokens.citationChipRadius};
      background-color: ${theme.colors.default[100]};
      color: ${theme.colors.text.primary};
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      max-width: 220px;
      cursor: ${onSelect || references.some((r) => r.href) ? 'pointer' : 'default'};
      transition:
        background-color ${theme.motion.duration.normal} ${theme.motion.easing.easeInOut},
        color ${theme.motion.duration.normal} ${theme.motion.easing.easeInOut};
      &:hover {
        background-color: ${theme.colors.default[200]};
      }
      &:focus-visible {
        outline: 2px solid ${theme.colors.border.focus ?? theme.colors.focus};
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const chipBadgeCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 4px;
      background-color: ${theme.colors.bg.surface};
      color: ${theme.colors.text.secondary};
      font-size: 10px;
      font-weight: 700;
      flex: none;
    `;

    const chipLabelCss = css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    `;

    const renderChip = (refItem: ChatKnowledgeReference) => {
      const initial = getSourceInitial(refItem);
      const inner = (
        <>
          <span aria-hidden css={chipBadgeCss}>
            {initial}
          </span>
          <span css={chipLabelCss}>{refItem.title}</span>
        </>
      );
      const accessibleName = refItem.snippet
        ? `${refItem.title}: ${refItem.snippet}`
        : refItem.title;

      if (refItem.href) {
        return (
          <a
            href={refItem.href}
            title={refItem.snippet}
            aria-label={accessibleName}
            data-source={refItem.source}
            css={chipBaseCss}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            onClick={() => onSelect?.(refItem)}
          >
            {inner}
          </a>
        );
      }
      if (onSelect) {
        return (
          <button
            type="button"
            title={refItem.snippet}
            aria-label={accessibleName}
            data-source={refItem.source}
            css={chipBaseCss}
            onClick={() => onSelect(refItem)}
          >
            {inner}
          </button>
        );
      }
      return (
        <span
          title={refItem.snippet}
          aria-label={accessibleName}
          data-source={refItem.source}
          css={chipBaseCss}
        >
          {inner}
        </span>
      );
    };

    return (
      <div ref={ref} id={id} className={className} style={style} css={containerCss}>
        {title !== false ? <div css={titleCss}>{title}</div> : null}
        <div role="list" css={listCss}>
          {references.map((refItem) => (
            <div role="listitem" key={refItem.id}>
              {renderChip(refItem)}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

(ChatKnowledgeRefs as unknown as { displayName: string }).displayName = 'ChatKnowledgeRefs';
