/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ChatToolStatesDemo（工具调用状态矩阵 + 知识引用组合展示）。
 */

'use client';

import { css } from '@emotion/react';
import { ChatKnowledgeRefs, ChatToolCall } from '@timeui/react';

export function ChatToolStatesDemo() {
  return (
    <div
      css={css`
        width: min(720px, 100%);
        display: grid;
        gap: 16px;
      `}
    >
      <div
        css={css`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        `}
      >
        <ChatToolCall
          name="search_web"
          status="pending"
          arguments={{ query: 'AI observability stack', topK: 8 }}
          defaultExpanded
        />
        <ChatToolCall
          name="fetch_docs"
          status="running"
          arguments={{ ids: ['react-rsc', 'suspense-streaming'] }}
          result="Reading 2 documents..."
          defaultExpanded
        />
        <ChatToolCall
          name="summarize_findings"
          status="success"
          arguments={{ maxBullets: 5, tone: 'executive' }}
          result={{ bullets: 5, citations: 3, confidence: 'high' }}
          defaultExpanded
        />
        <ChatToolCall
          name="query_warehouse"
          status="error"
          arguments={{ table: 'latency_daily', range: 'last_30_days' }}
          error="Query timeout after 12s. Retry with a narrower time range."
          defaultExpanded
        />
      </div>

      <div
        css={css`
          padding: 16px;
          border-radius: 16px;
          background: var(--c-bg);
          border: 1px solid var(--c-hairline);
        `}
      >
        <ChatKnowledgeRefs
          title="Evidence pack"
          references={[
            {
              id: '1',
              title: 'React Docs · Server Components',
              source: 'web',
              href: 'https://react.dev',
              snippet: 'Official reference and usage guidance',
            },
            {
              id: '2',
              title: 'perf-benchmark-q1.pdf',
              source: 'pdf',
              snippet: 'Synthetic + real-world latency benchmark',
            },
            {
              id: '3',
              title: 'Migration checklist',
              source: 'note',
              snippet: 'Internal rollout notes and caveats',
            },
            {
              id: '4',
              title: 'Design review memo',
              source: 'doc',
              snippet: 'Tradeoff summary for the new stack',
            },
          ]}
        />
      </div>
    </div>
  );
}
