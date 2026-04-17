/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 docs-i18n 基础能力。
 */

import type { Locale } from '@timeui/react';

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
    forms: '表单',
    overlays: '浮层',
    navigation: '导航',
    'data-display': '数据展示',
  },
  pages: {
    introduction: '介绍',
    installation: '安装',
    overview: '总览',
    composer: '输入框',
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
    tabs: '标签页',
    pagination: '分页',
    steps: '步骤条',
    table: '表格',
    avatar: '头像',
    tag: '标签',
    badge: '徽章',
    skeleton: '骨架屏',
    empty: '空状态',
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
    forms: 'Forms',
    overlays: 'Overlays',
    navigation: 'Navigation',
    'data-display': 'Data Display',
  },
  pages: {
    introduction: 'Introduction',
    installation: 'Installation',
    overview: 'Overview',
    composer: 'Composer',
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
    tabs: 'Tabs',
    pagination: 'Pagination',
    steps: 'Steps',
    table: 'Table',
    avatar: 'Avatar',
    tag: 'Tag',
    badge: 'Badge',
    skeleton: 'Skeleton',
    empty: 'Empty',
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
};

const dict: Record<Locale, DocsMessages> = { zh, en };

export function getDocsMessages(locale: Locale): DocsMessages {
  return dict[locale] ?? dict.zh;
}
