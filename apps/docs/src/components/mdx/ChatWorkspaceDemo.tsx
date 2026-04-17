/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ChatWorkspaceDemo（完整 AI 工作台展示：侧栏 + 会话流 + Composer）。
 */

'use client';

import { useMemo, useState } from 'react';
import { css } from '@emotion/react';
import {
  ChatActionButton,
  ChatComposer,
  ChatKnowledgeRefs,
  ChatMessage,
  ChatMessageList,
  ChatSendButton,
  ChatToolCall,
  ChatTypingIndicator,
} from '@timeui/react';

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function ChatWorkspaceDemo() {
  const [value, setValue] = useState('给我总结一下这周用户反馈的前三个主题');
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState<string[]>([
    '本周反馈主要集中在首屏速度、搜索结果质量，以及 AI 回复格式一致性。',
  ]);

  const sessions = useMemo(
    () => [
      { title: 'Weekly product review', meta: '18 messages', active: true },
      { title: 'Support issue triage', meta: '7 messages', active: false },
      { title: 'Q2 launch brief', meta: '12 messages', active: false },
    ],
    [],
  );

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    setStreaming(true);
    setValue('');
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        '优先级最高的是搜索召回偏差，其次是深色模式对比度，再是移动端输入框遮挡问题。',
      ]);
      setStreaming(false);
    }, 1200);
  };

  return (
    <div
      css={css`
        width: min(920px, 100%);
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        border-radius: 22px;
        overflow: hidden;
        border: 1px solid var(--c-hairline);
        background: var(--c-bg);

        @media (max-width: 840px) {
          grid-template-columns: 1fr;
        }
      `}
    >
      <aside
        css={css`
          padding: 16px;
          background: linear-gradient(180deg, var(--c-bg-secondary), var(--c-bg));
          border-right: 1px solid var(--c-hairline);
          display: flex;
          flex-direction: column;
          gap: 12px;

          @media (max-width: 840px) {
            border-right: 0;
            border-bottom: 1px solid var(--c-hairline);
          }
        `}
      >
        <button
          type="button"
          css={css`
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            height: 38px;
            border-radius: 12px;
            border: 1px solid var(--c-hairline);
            background: var(--c-bg);
            color: var(--c-text);
            font: inherit;
          `}
        >
          <PlusIcon />
          New thread
        </button>

        <div
          css={css`
            display: grid;
            gap: 8px;
          `}
        >
          {sessions.map((session) => (
            <div
              key={session.title}
              css={css`
                padding: 12px;
                border-radius: 14px;
                border: 1px solid ${session.active ? 'var(--c-accent)' : 'var(--c-hairline)'};
                background: ${session.active ? 'rgba(0, 113, 227, 0.06)' : 'transparent'};
              `}
            >
              <div
                css={css`
                  font-size: 13px;
                  font-weight: 600;
                `}
              >
                {session.title}
              </div>
              <div
                css={css`
                  margin-top: 4px;
                  font-size: 12px;
                  color: var(--c-text-secondary);
                `}
              >
                {session.meta}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div
        css={css`
          display: flex;
          flex-direction: column;
          min-width: 0;
        `}
      >
        <div
          css={css`
            padding: 18px 20px 0;
          `}
        >
          <div
            css={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            `}
          >
            <div>
              <div
                css={css`
                  font-size: 16px;
                  font-weight: 700;
                `}
              >
                Weekly product review
              </div>
              <div
                css={css`
                  margin-top: 4px;
                  font-size: 12px;
                  color: var(--c-text-secondary);
                `}
              >
                Team workspace · Claude Sonnet 4.6
              </div>
            </div>
            <span
              css={css`
                height: 28px;
                padding: 0 10px;
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                background: rgba(0, 113, 227, 0.08);
                color: var(--c-accent);
                font-size: 12px;
                font-weight: 600;
              `}
            >
              Live analysis
            </span>
          </div>
        </div>

        <div
          css={css`
            padding: 20px;
          `}
        >
          <ChatMessageList maxHeight={420} aria-label="Workspace conversation">
            <ChatMessage role="system">
              Summarize the top weekly themes and cite relevant notes.
            </ChatMessage>

            <ChatMessage role="user" name="Ryan" timestamp="09:18">
              帮我把客服、社区和销售这三路反馈汇总成一个简报。
            </ChatMessage>

            <ChatMessage
              role="tool"
              name="aggregate_feedback"
              attachments={
                <ChatToolCall
                  name="aggregate_feedback"
                  status="success"
                  arguments={{ sources: ['support', 'community', 'sales'], week: '2026-W16' }}
                  result={{ rows: 183, clusters: 11 }}
                  defaultExpanded={false}
                />
              }
            >
              Collected and clustered feedback streams.
            </ChatMessage>

            <ChatMessage
              role="knowledge"
              attachments={
                <ChatKnowledgeRefs
                  references={[
                    {
                      id: '1',
                      title: 'Support digest',
                      source: 'note',
                      snippet: 'Recurring reports around mobile input overlap',
                    },
                    {
                      id: '2',
                      title: 'Search quality report.pdf',
                      source: 'pdf',
                      snippet: 'Precision dropped on long-tail queries',
                    },
                    {
                      id: '3',
                      title: 'Sales call highlights',
                      source: 'doc',
                      snippet: 'Enterprise prospects asked for stronger export controls',
                    },
                  ]}
                />
              }
            >
              Selected references for the summary.
            </ChatMessage>

            {messages.map((message) => (
              <ChatMessage key={message} role="assistant" name="Claude" timestamp="09:19">
                {message}
              </ChatMessage>
            ))}

            {streaming ? (
              <ChatMessage
                role="assistant"
                name="Claude"
                attachments={<ChatTypingIndicator label="Claude is thinking" />}
              >
                正在组织结论与优先级…
              </ChatMessage>
            ) : null}
          </ChatMessageList>
        </div>

        <div
          css={css`
            padding: 0 20px 20px;
          `}
        >
          <ChatComposer
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder="继续追问、补充上下文，或要求导出成 brief…"
            aria-label="Workspace composer"
            topContent={
              <div
                css={css`
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                `}
              >
                {['support-digest.md', 'sales-weekly.csv'].map((file) => (
                  <span
                    key={file}
                    css={css`
                      display: inline-flex;
                      align-items: center;
                      height: 28px;
                      padding: 0 10px;
                      border-radius: 999px;
                      background: var(--c-bg-secondary);
                      border: 1px solid var(--c-hairline);
                      font-size: 12px;
                    `}
                  >
                    {file}
                  </span>
                ))}
              </div>
            }
            startContent={<ChatActionButton aria-label="Add context">+</ChatActionButton>}
            endContent={
              <ChatSendButton
                isStreaming={streaming}
                isDisabled={!streaming && value.trim().length === 0}
                onClick={() => handleSubmit(value)}
                onStop={() => setStreaming(false)}
              />
            }
            bottomContent={
              <div
                css={css`
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 12px;
                  flex-wrap: wrap;
                  font-size: 12px;
                  color: var(--c-text-secondary);
                `}
              >
                <span>Auto-save enabled</span>
                <span>{value.length}/2000</span>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
