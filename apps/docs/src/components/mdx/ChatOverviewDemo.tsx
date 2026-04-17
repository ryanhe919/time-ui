/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ChatOverviewDemo（5 种 role + 工具调用 + 知识引用 + 流式光标）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { ChatMessage, ChatMessageList, ChatToolCall, ChatKnowledgeRefs } from '@timeui/react';

export function ChatOverviewDemo() {
  const [streaming] = useState(true);
  return (
    <div
      css={css`
        width: min(640px, 100%);
        padding: 16px;
        border-radius: 16px;
        background: var(--c-bg);
        border: 1px solid var(--c-hairline);
      `}
    >
      <ChatMessageList maxHeight={420} aria-label="Demo conversation">
        <ChatMessage role="system">
          You are a helpful research assistant. Cite your sources and explain your reasoning.
        </ChatMessage>

        <ChatMessage role="user" name="Ryan" timestamp={new Date('2026-04-17T09:30:00')}>
          What's the latest on React Server Components performance?
        </ChatMessage>

        <ChatMessage
          role="tool"
          name="search_web"
          attachments={
            <ChatToolCall
              name="search_web"
              status="success"
              defaultExpanded={false}
              arguments={{ query: 'React Server Components performance 2026', topK: 5 }}
              result={{ items: 5, sources: ['react.dev', 'vercel.com', 'github.com'] }}
            />
          }
        >
          Searched the web.
        </ChatMessage>

        <ChatMessage
          role="knowledge"
          name="Knowledge"
          attachments={
            <ChatKnowledgeRefs
              references={[
                {
                  id: '1',
                  title: 'React Docs · RSC',
                  source: 'web',
                  href: 'https://react.dev',
                  snippet: 'Official RSC reference',
                },
                {
                  id: '2',
                  title: 'Perf Notes 2026 Q1.pdf',
                  source: 'pdf',
                  snippet: 'Internal benchmark',
                },
                { id: '3', title: 'Migration Notes', source: 'note' },
              ]}
            />
          }
        >
          Pulled relevant sources from the knowledge base.
        </ChatMessage>

        <ChatMessage
          role="assistant"
          name="Claude"
          isStreaming={streaming}
          timestamp={new Date('2026-04-17T09:30:14')}
        >
          React Server Components in 2026 ship most leaf rendering off the client bundle —
          benchmarks show 30-60% TTI improvement on data-heavy pages. The biggest win comes from
          streaming HTML + suspended components co-resolving on the server
        </ChatMessage>
      </ChatMessageList>
    </div>
  );
}
