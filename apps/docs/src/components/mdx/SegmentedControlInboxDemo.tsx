/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 SegmentedControlInboxDemo（带图标 + 受控）。
 */

'use client';

import { useState } from 'react';
import { SegmentedControl } from '@timeui/react';

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export function SegmentedControlInboxDemo() {
  type InboxTab = 'chats' | 'emails';
  const [tab, setTab] = useState<InboxTab>('chats');
  return (
    <SegmentedControl<InboxTab>
      aria-label="Inbox"
      value={tab}
      onChange={(v: InboxTab) => setTab(v)}
      options={[
        { value: 'chats', label: 'Chats', icon: <ChatIcon /> },
        { value: 'emails', label: 'Emails', icon: <MailIcon /> },
      ]}
    />
  );
}
