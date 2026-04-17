/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ChatStreamingDemo（演示 useChatStream + 受控流式光标）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { ChatMessage, ChatMessageList, Button, useChatStream } from '@timeui/react';

const SCRIPT =
  'In 2026, React Server Components have matured into a default rendering strategy for new ' +
  'apps — most teams reach for them first because the bundle savings on data-heavy pages are too ' +
  'large to ignore. The streaming model pairs well with Suspense boundaries on the server side.';

async function* fakeStream(text: string, chunkSize = 6, delayMs = 40) {
  for (let i = 0; i < text.length; i += chunkSize) {
    await new Promise((r) => setTimeout(r, delayMs));
    yield text.slice(i, i + chunkSize);
  }
}

export function ChatStreamingDemo() {
  const stream = useChatStream();
  const [done, setDone] = useState(false);

  const run = async () => {
    setDone(false);
    await stream.start(fakeStream(SCRIPT));
    setDone(true);
  };

  return (
    <div
      css={css`
        width: min(640px, 100%);
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <div
        css={css`
          display: flex;
          gap: 8px;
        `}
      >
        <Button size="sm" onClick={run} disabled={stream.isStreaming}>
          {stream.isStreaming ? 'Streaming…' : done ? 'Replay' : 'Start'}
        </Button>
        <Button size="sm" variant="ghost" onClick={stream.cancel} disabled={!stream.isStreaming}>
          Cancel
        </Button>
        <Button size="sm" variant="ghost" onClick={stream.reset} disabled={stream.isStreaming}>
          Reset
        </Button>
      </div>
      <div
        css={css`
          padding: 12px;
          border-radius: 16px;
          background: var(--c-bg);
          border: 1px solid var(--c-hairline);
        `}
      >
        <ChatMessageList aria-label="Streaming demo">
          {stream.text || stream.isStreaming ? (
            <ChatMessage role="assistant" name="Claude" isStreaming={stream.isStreaming}>
              {stream.text}
            </ChatMessage>
          ) : (
            <ChatMessage role="system">Press Start to stream a response.</ChatMessage>
          )}
        </ChatMessageList>
      </div>
    </div>
  );
}
