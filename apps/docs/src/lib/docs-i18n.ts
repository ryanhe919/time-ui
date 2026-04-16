import type { Locale } from '@timeui/react';

/** Docs-app-scoped UI strings. Library-scoped strings live in `@timeui/core`. */
export interface DocsMessages {
  brand: string;
  sections: Record<string, string>;
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
    components: '组件',
  },
  pages: {
    introduction: '介绍',
    installation: '安装',
    button: '按钮',
    callout: '提示块',
    'code-block': '代码块',
    search: '搜索',
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
    components: 'Components',
  },
  pages: {
    introduction: 'Introduction',
    installation: 'Installation',
    button: 'Button',
    callout: 'Callout',
    'code-block': 'Code Block',
    search: 'Search',
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
