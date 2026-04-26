/**
 * @author Ryan He
 * @description MarkdownViewer 组件的类型定义。
 *
 *   面向"完整文档查看器"场景：解析后端返回的整篇 markdown，提供阅读型排版、
 *   目录、复制/下载/刷新工具条、可选 URL 拉取等能力。与 ChatMarkdown（流式
 *   片段渲染）刻意分离 —— 两者职责互不重叠。
 */

import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import type { Components } from 'react-markdown';

/** 数据来源类型：直接传入 markdown 字符串，或一个可 fetch 的 URL/路径。 */
export type MarkdownSourceType = 'content' | 'url';

/** 链接默认打开方式 —— 仅作用于"外链"，站内锚点始终在当前文档跳转。 */
export type MarkdownLinkTarget = '_self' | '_blank';

/** 工具条按钮可见性。任何字段省略均默认 true。 */
export interface MarkdownViewerToolbarConfig {
  copy?: boolean;
  download?: boolean;
  refresh?: boolean;
}

/** 工具条按钮的可定制文案，便于上层覆盖 i18n 文案。 */
export interface MarkdownViewerToolbarLabels {
  toolbarLabel: string;
  copy: string;
  copied: string;
  download: string;
  refresh: string;
}

/** TOC 摆放位置 */
export type MarkdownViewerTocPosition = 'left' | 'right';

/** TOC 节点（由 markdown 源同步推导，不依赖 DOM）。 */
export interface MarkdownTocItem {
  id: string;
  level: number;
  text: string;
  /** 标题在 markdown 源中的行号（1-based）—— 用作渲染端 SSR/CSR 一致的 id 查表 key。 */
  line: number;
}

export interface MarkdownViewerProps {
  /**
   * 当 `sourceType='content'` 时为 markdown 字符串；
   * 当 `sourceType='url'` 时为可 fetch 的 URL 或路径。
   */
  source: string;
  /** 数据来源类型，默认 `'content'`。 */
  sourceType?: MarkdownSourceType;
  /** `sourceType='url'` 时透传给 `fetch` 的选项（headers、credentials 等）。 */
  fetchOptions?: RequestInit;

  /** 是否渲染顶部工具条。默认 true。 */
  showToolbar?: boolean;
  /** 工具条按钮粒度配置；省略字段视为 true。 */
  toolbar?: MarkdownViewerToolbarConfig;
  /** 工具条文案覆盖（可选）。 */
  toolbarLabels?: Partial<MarkdownViewerToolbarLabels>;

  /** 是否渲染目录侧栏，默认 false。 */
  showToc?: boolean;
  /** 目录摆放位置，默认 `'right'`。 */
  tocPosition?: MarkdownViewerTocPosition;
  /** 目录最大层级（h1-h6），默认 3。 */
  tocMaxDepth?: number;

  /** 是否启用 GFM（表格、任务列表、删除线等），默认 true。 */
  gfm?: boolean;

  /** 外链打开方式（站内锚点不受此影响），默认 `'_blank'`。 */
  linkTarget?: MarkdownLinkTarget;
  /** 链接点击拦截器；调用 `e.preventDefault()` 可阻止默认导航，便于接 SPA 路由。 */
  onLinkClick?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;

  /** 透传给 react-markdown 的 components 覆盖映射，用户优先级高于内置。 */
  components?: Components;

  /** 文档加载完成（content 模式立即触发；url 模式 fetch 成功后触发）。 */
  onLoad?: (markdown: string) => void;
  /** 加载失败回调（仅 url 模式可能触发）。 */
  onError?: (error: Error) => void;

  /** 加载中渲染节点；不指定时使用内置极简 spinner。 */
  loadingFallback?: ReactNode;
  /** 加载失败渲染节点 / 渲染函数。 */
  errorFallback?: ReactNode | ((error: Error) => ReactNode);

  /** 文档内容最大宽度，默认 `'72ch'`（适合长文阅读）。 */
  maxWidth?: number | string;

  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
  /** 任意 `data-*` 属性透传到外层容器。 */
  [dataAttr: `data-${string}`]: string | number | boolean | undefined;
}
