/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 docs-i18n 基础能力。
 */

import type { Locale } from '@timeui/react';

/** 智能文档助手 Drawer 所需的文案集合。 */
export interface AssistantDrawerMessages {
  openLabel: string;
  drawerTitle: string;
  placeholder: string;
  welcome: string;
  suggestions: string[];
  errorNoKey: string;
  errorGeneric: string;
  sendLabel: string;
  closeLabel: string;
  clearLabel: string;
  assistantName: string;
  userName: string;
  toolCallRunning: string;
  knowledgeRefsTitle: string;
}

export interface DocsMessages {
  brand: string;
  sections: Record<string, string>;
  /** 侧边栏小标题（section 内按类型分组时用）。 */
  groups: Record<string, string>;
  pages: Record<string, string>;
  nav: {
    onThisPage: string;
    github: string;
    searchPlaceholder: string;
  };
  header: {
    toggleThemeLight: string;
    toggleThemeDark: string;
    toggleLocale: string;
  };
  assistant: AssistantDrawerMessages;
}

const zh: DocsMessages = {
  brand: 'TimeUI',
  sections: {
    'getting-started': '开始使用',
    chat: 'AI 对话',
    components: '组件',
  },
  groups: {
    general: '通用',
    layout: '布局',
    forms: '表单',
    'data-display': '数据展示',
    feedback: '反馈',
    overlays: '浮层',
    navigation: '导航',
  },
  pages: {
    introduction: '介绍',
    installation: '安装',
    mcp: 'MCP Server',
    overview: '总览',
    composer: '输入框',
    markdown: 'Markdown 渲染',
    api: 'API 参考',
    button: '按钮',
    callout: '提示块',
    'code-block': '代码块',
    search: '搜索',
    typography: '排版',
    layout: '布局',
    'form-field': '表单域',
    input: '输入框',
    textarea: '多行输入',
    select: '下拉选择',
    'multi-select': '多项选择',
    checkbox: '复选框',
    radio: '单选按钮',
    switch: '开关',
    slider: '滑块',
    'segmented-control': '分段控制',
    popover: '气泡卡片',
    tooltip: '文字提示',
    modal: '对话框',
    drawer: '抽屉',
    menu: '菜单',
    toast: '通知',
    'date-picker': '日期选择',
    'date-time-picker': '日期时间选择',
    tabs: '标签页',
    pagination: '分页',
    steps: '步骤条',
    table: '表格',
    avatar: '头像',
    tag: '标签',
    badge: '徽章',
    skeleton: '骨架屏',
    empty: '空状态',
    upload: '文件上传',
    card: '卡片',
    'stat-card': '统计卡片',
    'rich-text-editor': '富文本编辑器',
    'code-editor': '代码编辑器',
    'pdf-viewer': 'PDF 查看器',
    'markdown-viewer': 'Markdown 查看器',
  },
  nav: {
    onThisPage: '本页目录',
    github: '查看 GitHub 仓库',
    searchPlaceholder: '搜索文档…',
  },
  header: {
    toggleThemeLight: '切换到浅色模式',
    toggleThemeDark: '切换到深色模式',
    toggleLocale: '切换语言',
  },
  assistant: {
    openLabel: 'AI 助手',
    drawerTitle: '文档助手',
    placeholder: '问一个关于组件的问题…',
    welcome: '你好，我可以帮你检索 TimeUI 组件、对比 API、给出示例代码。试试下面的问题：',
    suggestions: ['有哪些表单组件？', 'Button 支持哪些 variant？', '对比 Modal 和 Drawer'],
    errorNoKey:
      '尚未配置 ANTHROPIC_API_KEY。请在 apps/docs/.env.local 中填入 MiniMax 凭据后重启开发服务器。',
    errorGeneric: '助手暂不可用，请稍后重试。',
    sendLabel: '发送',
    closeLabel: '关闭助手',
    clearLabel: '清除对话，重新开始',
    assistantName: '助手',
    userName: '你',
    toolCallRunning: '正在查询文档索引…',
    knowledgeRefsTitle: '相关组件',
  },
};

const en: DocsMessages = {
  brand: 'TimeUI',
  sections: {
    'getting-started': 'Getting Started',
    chat: 'AI Chat',
    components: 'Components',
  },
  groups: {
    general: 'General',
    layout: 'Layout',
    forms: 'Forms',
    'data-display': 'Data Display',
    feedback: 'Feedback',
    overlays: 'Overlays',
    navigation: 'Navigation',
  },
  pages: {
    introduction: 'Introduction',
    installation: 'Installation',
    mcp: 'MCP Server',
    overview: 'Overview',
    composer: 'Composer',
    markdown: 'Markdown',
    api: 'API Reference',
    button: 'Button',
    callout: 'Callout',
    'code-block': 'Code Block',
    search: 'Search',
    typography: 'Typography',
    layout: 'Layout',
    'form-field': 'Form Field',
    input: 'Input',
    textarea: 'Textarea',
    select: 'Select',
    'multi-select': 'Multi Select',
    checkbox: 'Checkbox',
    radio: 'Radio',
    switch: 'Switch',
    slider: 'Slider',
    'segmented-control': 'Segmented Control',
    popover: 'Popover',
    tooltip: 'Tooltip',
    modal: 'Modal',
    drawer: 'Drawer',
    menu: 'Menu',
    toast: 'Toast',
    'date-picker': 'Date Picker',
    'date-time-picker': 'Date Time Picker',
    tabs: 'Tabs',
    pagination: 'Pagination',
    steps: 'Steps',
    table: 'Table',
    avatar: 'Avatar',
    tag: 'Tag',
    badge: 'Badge',
    skeleton: 'Skeleton',
    empty: 'Empty',
    upload: 'Upload',
    card: 'Card',
    'stat-card': 'Stat Card',
    'rich-text-editor': 'Rich Text Editor',
    'code-editor': 'Code Editor',
    'pdf-viewer': 'PDF Viewer',
    'markdown-viewer': 'Markdown Viewer',
  },
  nav: {
    onThisPage: 'On this page',
    github: 'View on GitHub',
    searchPlaceholder: 'Search docs…',
  },
  header: {
    toggleThemeLight: 'Switch to light mode',
    toggleThemeDark: 'Switch to dark mode',
    toggleLocale: 'Switch language',
  },
  assistant: {
    openLabel: 'Ask AI',
    drawerTitle: 'Docs Assistant',
    placeholder: 'Ask a question about a component…',
    welcome:
      'Hi! I can look up TimeUI components, compare APIs, and surface example code. Try one of these:',
    suggestions: [
      'Which form components are available?',
      'What variants does Button support?',
      'Compare Modal vs Drawer',
    ],
    errorNoKey:
      'ANTHROPIC_API_KEY is not configured. Add MiniMax credentials to apps/docs/.env.local and restart the dev server.',
    errorGeneric: 'The assistant is temporarily unavailable. Please try again later.',
    sendLabel: 'Send',
    closeLabel: 'Close assistant',
    clearLabel: 'Clear conversation and start over',
    assistantName: 'Assistant',
    userName: 'You',
    toolCallRunning: 'Querying documentation index…',
    knowledgeRefsTitle: 'Related components',
  },
};

const dict: Record<Locale, DocsMessages> = { zh, en };

export function getDocsMessages(locale: Locale): DocsMessages {
  return dict[locale] ?? dict.zh;
}
