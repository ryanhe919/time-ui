/**
 * TimeUI message dictionaries.
 *
 * Each component group gets its own namespace. Keep keys terse and
 * camelCased; values are user-facing strings surfaced by the component
 * library (aria-labels, placeholders, error hints, …).
 */

export type Locale = 'zh' | 'en';

export interface Messages {
  /** Generic, shared across multiple components. */
  common: {
    close: string;
    cancel: string;
    confirm: string;
    ok: string;
    loading: string;
    clear: string;
    showPassword: string;
    hidePassword: string;
  };
  /** Button-specific (kept minimal — Button has no default text today). */
  button: {
    loadingLabel: string;
  };
  /** CodeBlock — copy-to-clipboard affordance. */
  codeBlock: {
    copy: string;
    copied: string;
    /** Accessible label for the copy button. */
    copyLabel: string;
  };
  /** Search — trigger button + future input variants. */
  search: {
    placeholder: string;
    /** Accessible label when the visible placeholder isn't enough. */
    label: string;
  };
}

export const zh: Messages = {
  common: {
    close: '关闭',
    cancel: '取消',
    confirm: '确定',
    ok: '好',
    loading: '加载中',
    clear: '清除',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
  },
  button: {
    loadingLabel: '加载中',
  },
  codeBlock: {
    copy: '复制',
    copied: '已复制',
    copyLabel: '复制代码',
  },
  search: {
    placeholder: '搜索…',
    label: '搜索',
  },
};

export const en: Messages = {
  common: {
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    ok: 'OK',
    loading: 'Loading',
    clear: 'Clear',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  button: {
    loadingLabel: 'Loading',
  },
  codeBlock: {
    copy: 'Copy',
    copied: 'Copied',
    copyLabel: 'Copy code',
  },
  search: {
    placeholder: 'Search…',
    label: 'Search',
  },
};

export const messages: Record<Locale, Messages> = { zh, en };

export const defaultLocale: Locale = 'zh';
