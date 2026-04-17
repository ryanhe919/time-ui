/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 MDX 示例组件 SearchDialogDemo（演示 Search + SearchDialog 搭配）。
 */

'use client';

import { useState, type ReactNode } from 'react';
import { Search, SearchDialog } from '@timeui/react';
import type { SearchDialogItem } from '@timeui/react';

const BookIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 4.5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2v-14z" />
    <path d="M4 18.5h14" />
  </svg>
);
const RocketIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M14.7 2.3 21.7 9.3 12.4 18.6l-5.7-1.3-1.3-5.7L14.7 2.3z" />
    <path d="m6 18 1 4 4-1" />
  </svg>
);
const PaletteIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 22a10 10 0 1 1 10-10c0 2-2 3-4 3h-2a2 2 0 0 0-2 2v2c0 2-1 3-2 3z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="12" cy="6.5" r="1" />
    <circle cx="16.5" cy="11" r="1" />
  </svg>
);
const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const ComponentIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const PageIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

interface DocItem extends SearchDialogItem {
  href: string;
  iconNode: ReactNode;
}

const ITEMS: DocItem[] = [
  {
    id: 'intro',
    label: '快速开始 Introduction',
    hint: '/zh/docs/getting-started/introduction',
    href: '/zh/docs/getting-started/introduction',
    icon: <BookIcon />,
    iconNode: <BookIcon />,
  },
  {
    id: 'install',
    label: '安装 Installation',
    hint: '/zh/docs/getting-started/installation',
    href: '/zh/docs/getting-started/installation',
    icon: <DownloadIcon />,
    iconNode: <DownloadIcon />,
  },
  {
    id: 'theming',
    label: '主题系统 Theming',
    hint: '/docs/guides/theming',
    href: '/docs/guides/theming',
    icon: <PaletteIcon />,
    iconNode: <PaletteIcon />,
  },
  {
    id: 'button',
    label: '按钮 Button',
    hint: '/zh/docs/components/button',
    href: '/zh/docs/components/button',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'search',
    label: '搜索 Search',
    hint: '/zh/docs/components/search',
    href: '/zh/docs/components/search',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'callout',
    label: '提示块 Callout',
    hint: '/zh/docs/components/callout',
    href: '/zh/docs/components/callout',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'code-block',
    label: '代码块 CodeBlock',
    hint: '/zh/docs/components/code-block',
    href: '/zh/docs/components/code-block',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'slider',
    label: '滑块 Slider',
    hint: '/zh/docs/components/slider',
    href: '/zh/docs/components/slider',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'segmented-control',
    label: '分段控制 SegmentedControl',
    hint: '/zh/docs/components/segmented-control',
    href: '/zh/docs/components/segmented-control',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'switch',
    label: '开关 Switch',
    hint: '/zh/docs/components/switch',
    href: '/zh/docs/components/switch',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'checkbox',
    label: '复选框 Checkbox',
    hint: '/zh/docs/components/checkbox',
    href: '/zh/docs/components/checkbox',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'radio',
    label: '单选按钮 Radio',
    hint: '/zh/docs/components/radio',
    href: '/zh/docs/components/radio',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'select',
    label: '下拉选择 Select',
    hint: '/zh/docs/components/select',
    href: '/zh/docs/components/select',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'input',
    label: '输入框 Input',
    hint: '/zh/docs/components/input',
    href: '/zh/docs/components/input',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'typography',
    label: '排版 Typography',
    hint: '/zh/docs/components/typography',
    href: '/zh/docs/components/typography',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'layout',
    label: '布局 Layout',
    hint: '/zh/docs/components/layout',
    href: '/zh/docs/components/layout',
    icon: <ComponentIcon />,
    iconNode: <ComponentIcon />,
  },
  {
    id: 'chat-overview',
    label: 'AI 对话总览',
    hint: '/zh/docs/chat/overview',
    href: '/zh/docs/chat/overview',
    icon: <PageIcon />,
    iconNode: <PageIcon />,
  },
  {
    id: 'chat-composer',
    label: 'AI 对话输入框',
    hint: '/zh/docs/chat/composer',
    href: '/zh/docs/chat/composer',
    icon: <PageIcon />,
    iconNode: <PageIcon />,
  },
  {
    id: 'chat-api',
    label: 'AI 对话 API',
    hint: '/zh/docs/chat/api',
    href: '/zh/docs/chat/api',
    icon: <PageIcon />,
    iconNode: <PageIcon />,
  },
  {
    id: 'changelog',
    label: '更新日志 Changelog',
    hint: '/docs/changelog',
    href: '/docs/changelog',
    icon: <RocketIcon />,
    iconNode: <RocketIcon />,
  },
];

export function SearchDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Search
        placeholder="点击打开命令面板…"
        shortcut="⌘K"
        onClick={() => setOpen(true)}
        aria-label="打开命令面板"
      />

      <SearchDialog
        isOpen={open}
        onOpenChange={setOpen}
        items={ITEMS}
        placeholder="搜索文档、组件、指南…"
        emptyMessage="没有匹配的结果"
        shortcut="mod+k"
        aria-label="命令面板"
        onSelect={(item) => {
          // 真实场景：router.push((item as DocItem).href)
          // 这里只是 demo，关闭即可
          console.log('selected', item.id);
        }}
      />
    </div>
  );
}
