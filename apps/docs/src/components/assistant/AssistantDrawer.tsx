/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 智能文档助手 Drawer：从 TopNav 打开，组合 Chat 组件族展示多轮对话 +
 *   流式 assistant 回复 + 工具调用进度 + 命中组件引用。
 */

'use client';

import { css, useTheme } from '@emotion/react';
import {
  Callout,
  ChatComposer,
  ChatKnowledgeRefs,
  ChatMessage,
  ChatMessageList,
  ChatSendButton,
  ChatToolCall,
  ChatTypingIndicator,
  type ChatKnowledgeReference,
  type ChatToolCallData,
} from '@timeui/react';
import { ChatMarkdown } from '@timeui/react/chat-markdown';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AssistantDrawerMessages } from '@/lib/docs-i18n';
import { parseAssistantStream, type AssistantRefComponent } from './parse-sse';

interface Props {
  open: boolean;
  onClose: () => void;
  locale: 'zh' | 'en';
  messages: AssistantDrawerMessages;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 仅 assistant：此轮内本地执行过的工具。 */
  toolCalls?: ChatToolCallData[];
  /** 仅 assistant：命中的组件引用。 */
  refs?: ChatKnowledgeReference[];
}

interface WireMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CloseIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden
  >
    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
  </svg>
);

// 清除对话图标：垃圾桶。与 CloseIcon 保持相同尺寸 / stroke 风格。
const ClearIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M2.5 4h11" />
    <path d="M6 4V2.75A.75.75 0 0 1 6.75 2h2.5a.75.75 0 0 1 .75.75V4" />
    <path d="M3.75 4l.7 8.4a1.25 1.25 0 0 0 1.25 1.15h4.6a1.25 1.25 0 0 0 1.25-1.15L12.25 4" />
    <path d="M6.75 7v4M9.25 7v4" />
  </svg>
);

export function AssistantDrawer(props: Props) {
  const { open, onClose, locale, messages } = props;
  const theme = useTheme();
  const titleId = useId();

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [composerValue, setComposerValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [topLevelError, setTopLevelError] = useState<string | null>(null);

  // SSR 安全：只在挂载后用 portal，避免 server 端访问 document。
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // fetch 控制器 —— 关闭 drawer / 重发时中止正在跑的请求。
  const abortRef = useRef<AbortController | null>(null);

  // panel ref —— 清空对话后把焦点还给输入框。
  const panelRef = useRef<HTMLElement | null>(null);

  // 关 drawer → 停流；避免后台 fetch 继续消耗 token。
  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, [open]);

  // ESC 关 drawer（仅在 open 时绑定）。
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const sendQuery = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || isStreaming) return;

      // 生成对话 id —— 避免 SSR hydration mismatch，用 crypto.randomUUID() 但仅在 client 触发。
      const userId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `u-${Date.now()}`;
      const assistantId = `a-${userId}`;

      setTopLevelError(null);

      // 先把 user + 空 assistant 推进列表；assistant 会被流式 setState 替换。
      setTurns((prev) => [
        ...prev,
        { id: userId, role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '', toolCalls: [], refs: [] },
      ]);
      setComposerValue('');
      setIsStreaming(true);

      const wire: WireMessage[] = [
        ...turns.map((t) => ({ role: t.role, content: t.content })),
        { role: 'user', content: trimmed },
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: wire, locale }),
          signal: controller.signal,
        });
        if (!res.ok && res.status !== 200) {
          throw new Error(`HTTP ${res.status}`);
        }

        for await (const event of parseAssistantStream(res)) {
          if (event.type === 'delta') {
            appendAssistant(setTurns, assistantId, event.text);
          } else if (event.type === 'tool_use') {
            upsertToolCall(setTurns, assistantId, event.name, 'running');
          } else if (event.type === 'tool_result') {
            finishToolCall(setTurns, assistantId, event.name, event.summary);
          } else if (event.type === 'refs') {
            applyRefs(setTurns, assistantId, event.components);
          } else if (event.type === 'error') {
            const msg =
              event.code === 'no-key'
                ? messages.errorNoKey
                : event.message || messages.errorGeneric;
            setTopLevelError(msg);
          } else if (event.type === 'done') {
            // 正常收尾，break 后面的 reader。
            break;
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          // 手动中止：不报错，只清 streaming 状态。
        } else {
          setTopLevelError(messages.errorGeneric);
          console.error('[assistant] fetch error', err);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming, turns, locale, messages.errorGeneric, messages.errorNoKey],
  );

  const handleSubmit = useCallback(
    (value: string) => {
      void sendQuery(value);
    },
    [sendQuery],
  );

  const handleSuggestion = useCallback(
    (q: string) => {
      setComposerValue(q);
      void sendQuery(q);
    },
    [sendQuery],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  // 清除对话：先中止正在跑的流（避免回调继续 appendAssistant），再把状态全部清零，
  // 最后把焦点还给 composer，这样用户可以直接继续问。不做二次确认，保持轻量节奏。
  const handleClear = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setTurns([]);
    setTopLevelError(null);
    setComposerValue('');
    // 下一帧再聚焦，给 React 重新渲染 composer（isDisabled 可能切换）的时间。
    requestAnimationFrame(() => {
      const textarea = panelRef.current?.querySelector<HTMLTextAreaElement>('textarea');
      textarea?.focus();
    });
  }, []);

  const canClear = turns.length > 0 || topLevelError !== null || isStreaming;

  // Drawer 容器 + overlay CSS
  const viewportCss = css`
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    visibility: ${open ? 'visible' : 'hidden'};
    transition: visibility 0s ${open ? '0s' : '240ms'};
    z-index: 1400;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  const overlayCss = css`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    opacity: ${open ? 1 : 0};
    pointer-events: ${open ? 'auto' : 'none'};
    transition:
      opacity 200ms ease,
      visibility 200ms ease;
    z-index: 1400;
  `;

  const panelCss = css`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(640px, 100vw);
    background: ${theme.colors.bg.canvas};
    color: ${theme.colors.text.primary};
    border-left: 1px solid ${theme.colors.border.subtle};
    box-shadow: -12px 0 32px rgba(0, 0, 0, 0.14);
    display: flex;
    flex-direction: column;
    pointer-events: ${open ? 'auto' : 'none'};
    transform: translateX(${open ? '0%' : '100%'});
    transition: transform 240ms cubic-bezier(0.32, 0.72, 0, 1);
    z-index: 1401;
    @media (max-width: 540px) {
      width: 100vw;
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  const headerCss = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid ${theme.colors.border.subtle};
    font-weight: 600;
    font-size: 14px;
  `;

  const bodyCss = css`
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 12px;
    overflow: hidden;
  `;

  const emptyStateCss = css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 4px;
    color: ${theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.55;
  `;

  const suggestionBtnCss = css`
    appearance: none;
    text-align: left;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid ${theme.colors.border.subtle};
    background: ${theme.colors.bg.surface};
    color: ${theme.colors.text.primary};
    font-size: 13px;
    cursor: pointer;
    transition:
      background-color 180ms ease,
      border-color 180ms ease;
    &:hover {
      background: ${theme.colors.bg.muted};
      border-color: ${theme.colors.border.default};
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  const closeBtnCss = css`
    appearance: none;
    background: transparent;
    border: 0;
    padding: 6px;
    border-radius: 8px;
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    display: inline-flex;
    &:hover:not(:disabled) {
      background: ${theme.colors.bg.muted};
      color: ${theme.colors.text.primary};
    }
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    &:focus-visible {
      outline: 2px solid ${theme.colors.border.focus};
      outline-offset: 2px;
    }
  `;

  const headerActionsCss = css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
  `;

  const listWrapperCss = css`
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  const isEmpty = turns.length === 0;
  // 最后一条 assistant 正在流式 —— 给它加 isStreaming caret，同时显示 typing indicator。
  const lastTurn = turns[turns.length - 1];
  const streamingAssistantId =
    isStreaming && lastTurn && lastTurn.role === 'assistant' ? lastTurn.id : null;

  const chatContent = useMemo(() => {
    return turns.map((turn) => {
      const isStreamingTurn = turn.id === streamingAssistantId;
      // assistant 消息走 markdown 渲染（代码块 / 列表 / 链接 / 表格），
      // user 消息保持纯文本，避免用户输入里的 # 或 * 被意外格式化。
      const body =
        turn.role === 'assistant' && turn.content ? (
          <ChatMarkdown>{turn.content}</ChatMarkdown>
        ) : (
          turn.content || (isStreamingTurn ? '' : null)
        );
      return (
        <ChatMessage
          key={turn.id}
          role={turn.role}
          name={turn.role === 'user' ? messages.userName : messages.assistantName}
          isStreaming={isStreamingTurn && turn.role === 'assistant'}
          attachments={renderAttachments(turn, messages)}
        >
          {body}
        </ChatMessage>
      );
    });
  }, [turns, streamingAssistantId, messages]);

  // 挂到 body 而不是 TopNav 内部 —— header 的 backdrop-filter 会建立新的
  // containing block，让里面 position:fixed 的 Drawer 退化成相对于 header
  // 的 48px 高度区域。portal 到 body 解决后 Drawer 真正相对于 viewport。
  if (!mounted) return null;

  const tree = (
    <div
      aria-hidden={!open}
      css={viewportCss}
      ref={(node) => {
        if (node) node.inert = !open;
      }}
    >
      <div css={overlayCss} onClick={onClose} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        css={panelCss}
        // 避免点击 panel 冒泡到 overlay 触发关闭。
        onClick={(e) => e.stopPropagation()}
      >
        <div css={headerCss}>
          <span id={titleId}>{messages.drawerTitle}</span>
          <div css={headerActionsCss}>
            <button
              type="button"
              css={closeBtnCss}
              aria-label={messages.clearLabel}
              title={messages.clearLabel}
              onClick={handleClear}
              disabled={!canClear}
            >
              <ClearIcon />
            </button>
            <button
              type="button"
              css={closeBtnCss}
              aria-label={messages.closeLabel}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div css={bodyCss}>
          {topLevelError ? <Callout variant="danger">{topLevelError}</Callout> : null}

          {isEmpty ? (
            <div css={emptyStateCss}>
              <div>{messages.welcome}</div>
              {messages.suggestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  css={suggestionBtnCss}
                  onClick={() => handleSuggestion(q)}
                  disabled={isStreaming}
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            <div css={listWrapperCss}>
              <ChatMessageList maxHeight="100%">
                {chatContent}
                {isStreaming && lastTurn?.role === 'assistant' && lastTurn.content === '' ? (
                  <ChatTypingIndicator aria-label={messages.toolCallRunning} />
                ) : null}
              </ChatMessageList>
            </div>
          )}

          <ChatComposer
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={handleSubmit}
            placeholder={messages.placeholder}
            isDisabled={isStreaming}
            aria-label={messages.placeholder}
            endContent={
              <ChatSendButton
                onClick={() => handleSubmit(composerValue)}
                isDisabled={composerValue.trim().length === 0}
                isStreaming={isStreaming}
                onStop={handleStop}
                aria-label={messages.sendLabel}
              />
            }
          />
        </div>
      </aside>
    </div>
  );

  return createPortal(tree, document.body);
}

// ---------- Mutators for streaming turns ----------

function appendAssistant(
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>,
  assistantId: string,
  chunk: string,
): void {
  setTurns((prev) =>
    prev.map((t) => (t.id === assistantId ? { ...t, content: t.content + chunk } : t)),
  );
}

function upsertToolCall(
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>,
  assistantId: string,
  name: string,
  status: 'running',
): void {
  setTurns((prev) =>
    prev.map((t) => {
      if (t.id !== assistantId) return t;
      const list = t.toolCalls ? [...t.toolCalls] : [];
      // 同名工具可能多次触发；每次都新增一条，保留时序。
      list.push({ name, status });
      return { ...t, toolCalls: list };
    }),
  );
}

function finishToolCall(
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>,
  assistantId: string,
  name: string,
  summary: string,
): void {
  setTurns((prev) =>
    prev.map((t) => {
      if (t.id !== assistantId) return t;
      if (!t.toolCalls) return t;
      const list = [...t.toolCalls];
      // 找到最近一条同名且 running 的，标记完成；防止并发时错认。
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].name === name && list[i].status === 'running') {
          list[i] = { ...list[i], status: 'success', result: summary };
          break;
        }
      }
      return { ...t, toolCalls: list };
    }),
  );
}

function applyRefs(
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>,
  assistantId: string,
  comps: AssistantRefComponent[],
): void {
  setTurns((prev) =>
    prev.map((t) => {
      if (t.id !== assistantId) return t;
      const merged = new Map<string, ChatKnowledgeReference>();
      for (const r of t.refs ?? []) merged.set(r.id, r);
      for (const c of comps) {
        merged.set(c.slug, { id: c.slug, title: c.title, href: c.href });
      }
      return { ...t, refs: Array.from(merged.values()) };
    }),
  );
}

function renderAttachments(turn: ChatTurn, messages: AssistantDrawerMessages): React.ReactNode {
  const parts: React.ReactNode[] = [];
  if (turn.toolCalls && turn.toolCalls.length > 0) {
    for (let i = 0; i < turn.toolCalls.length; i++) {
      const tc = turn.toolCalls[i];
      parts.push(
        <ChatToolCall key={`tool-${i}`} name={tc.name} status={tc.status} result={tc.result} />,
      );
    }
  }
  if (turn.refs && turn.refs.length > 0) {
    parts.push(
      <ChatKnowledgeRefs key="refs" references={turn.refs} title={messages.knowledgeRefsTitle} />,
    );
  }
  return parts.length > 0 ? <>{parts}</> : null;
}
