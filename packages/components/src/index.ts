/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 统一导出当前包的对外公共 API。
 */

export { ConfigProvider, ThemeProvider, useConfig, useTheme, useI18n } from '@timeui/core';
export type {
  TimeUIConfig,
  ConfigProviderProps,
  ThemeProviderProps,
  Locale,
  Messages,
} from '@timeui/core';
export { lightTheme, darkTheme, themes } from '@timeui/themes';
export type { TimeUITheme, ThemeMode } from '@timeui/themes';

export * from './Button';
export * from './Callout';
export * from './Search';
export * from './Typography';
export * from './Layout';

export * from './FormField';
export * from './Input';
export * from './Textarea';
export * from './Checkbox';
export * from './Radio';
export * from './Switch';
export * from './Slider';
export * from './SegmentedControl';
export * from './Select';
export * from './Upload';
export * from './Chat';

export * from './Popover';
export * from './Tooltip';
export * from './Modal';
export * from './Tabs';
export * from './Pagination';
export * from './Table';

export * from './Drawer';
export * from './Toast';
export * from './Menu';
export * from './DatePicker';
export * from './DateTimePicker';
export * from './Avatar';
export * from './Tag';
export * from './Badge';
export * from './Card';
export * from './StatCard';
export * from './Skeleton';
export * from './Empty';
export * from './Steps';
export * from './MultiSelect';

// 远程搜索契约：Select / MultiSelect 的 loadOptions 等 props 需要这些类型来标注实现。
export type {
  AsyncOptionLike,
  AsyncSearchProps,
  AsyncOptionsLoader,
  AsyncOptionsPage,
  AsyncOptionsReason,
  AsyncOptionsRequest,
} from './utils';

// 注意：以下组件均故意不在主 barrel 暴露，强制使用 subpath import 以避免把
// optional peer (TipTap / CodeMirror / pdfjs-dist / react-markdown / shiki) 拖进主 bundle：
//   - RichTextEditor → `@timeui/react/rich-text-editor`     (TipTap)
//   - CodeEditor     → `@timeui/react/code-editor`           (CodeMirror)
//   - PdfViewer      → `@timeui/react/pdf-viewer`            (pdfjs-dist)
//   - MarkdownViewer → `@timeui/react/markdown-viewer`       (react-markdown + remark-gfm)
//   - CodeBlock      → `@timeui/react/code-block`            (shiki)
//   - ChatMarkdown   → `@timeui/react/chat-markdown`         (react-markdown，给 Chat 消息流式渲染)
