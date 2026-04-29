/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ChatComposerDemo（含模型选择 / 附件 / 语音 / 发送按钮的 Composer）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import {
  ChatComposer,
  ChatActionButton,
  ChatSendButton,
  ChatVoiceWave,
  ChatFileChip,
  Select,
  SelectOption,
} from '@timeui/react';

const PaperclipIcon = () => (
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
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.95 8.83l-8.59 8.57a2 2 0 1 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const MicIcon = () => (
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
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

const ImageIcon = () => (
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
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

export function ChatComposerDemo() {
  const [value, setValue] = useState('');
  const [model, setModel] = useState('claude-opus-4-7');
  const [recording, setRecording] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>(['roadmap-q2.pdf', 'latency-bench.csv']);

  const handleSubmit = (text: string) => {
    setLastSent(text);
    setValue('');
    setStreaming(true);
    setTimeout(() => setStreaming(false), 1500);
  };

  return (
    <div
      css={css`
        width: min(560px, 100%);
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <ChatComposer
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Ask Claude anything…"
        aria-label="Chat input"
        topContent={
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            `}
          >
            {files.map((file) => (
              <ChatFileChip
                key={file}
                name={file}
                onRemove={() => setFiles((curr) => curr.filter((f) => f !== file))}
              />
            ))}
          </div>
        }
        startContent={
          <>
            <ChatActionButton aria-label="Attach file" tooltip="Attach file">
              <PaperclipIcon />
            </ChatActionButton>
            <ChatActionButton aria-label="Add image" tooltip="Add image">
              <ImageIcon />
            </ChatActionButton>
          </>
        }
        endContent={
          <div
            css={css`
              display: inline-flex;
              align-items: center;
              gap: 6px;
            `}
          >
            <ChatActionButton
              aria-label={recording ? 'Stop voice input' : 'Voice input'}
              tooltip={recording ? 'Recording…' : 'Voice'}
              isActive={recording}
              onClick={() => setRecording((v) => !v)}
            >
              {recording ? <ChatVoiceWave aria-label="Recording" /> : <MicIcon />}
            </ChatActionButton>
            <ChatSendButton
              isStreaming={streaming}
              isDisabled={!streaming && value.trim().length === 0}
              onClick={() => value.trim() && handleSubmit(value)}
              onStop={() => setStreaming(false)}
            />
          </div>
        }
        bottomContent={
          <div
            css={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              flex-wrap: wrap;
            `}
          >
            <div
              css={css`
                display: inline-flex;
                align-items: center;
                gap: 8px;
              `}
            >
              <Select
                size="sm"
                value={model}
                onChange={(v) => setModel(typeof v === 'string' ? v : '')}
                aria-label="Model"
                css={css`
                  min-width: 0;
                  width: auto;
                `}
              >
                <SelectOption value="claude-opus-4-7">Opus 4.7</SelectOption>
                <SelectOption value="claude-sonnet-4-6">Sonnet 4.6</SelectOption>
                <SelectOption value="claude-haiku-4-5">Haiku 4.5</SelectOption>
              </Select>
              <span
                css={css`
                  font-size: 12px;
                  color: var(--c-text-secondary);
                `}
              >
                Context window: 128k
              </span>
            </div>
            <span
              css={css`
                font-size: 12px;
                color: var(--c-text-secondary);
              `}
            >
              {value.length}/2000
            </span>
          </div>
        }
      />
      {lastSent ? (
        <div
          css={css`
            font-size: 12px;
            color: var(--c-text-secondary);
            padding-left: 8px;
          `}
        >
          Last sent: <code>{lastSent}</code> via <code>{model}</code>
        </div>
      ) : null}
    </div>
  );
}
