/**
 * @author Ryan He
 * @date 2026-04-28
 * @description LiveDemo v2 的"沙盒 scope"。
 *
 *              spec v2 §5：把 transpile 出来的代码片段在 `new Function(...scopeKeys, body)`
 *              里执行时，需要把可用的符号（React 钩子 / TimeUI 组件 / docs 内部 demo
 *              wrappers）以位置参数的形式注入。本文件就是那张表。
 *
 *              **同步规则**（spec v2 §5 + CONTRIBUTING）：
 *              - 本文件的 import 列表 **必须** 与
 *                `apps/docs/src/mdx-components.tsx` 的 `from '@/components/timeui-client'`
 *                + `from '@/components/mdx/*Demo'` 列表保持完全一致。
 *              - 任何一边的改动必须**同 PR** 改另一边。
 *
 *              为什么是 `Object.freeze`：
 *              - 防止 transpile 出的用户代码在 runtime 修改 scope（`scope.Button = null`），
 *                那会"污染下一次 transpile"。React 元素本身仍然可变，frozen 只锁顶层 keys。
 *
 *              为什么 `React` 是 namespace 而不是 default：
 *              - sucrase classic JSX 输出 `React.createElement(...)` 与 `React.Fragment`，
 *                必须能从 scope 解构出 `React`。我们额外把 `Fragment` / 各 hook 也单独
 *                列出来，方便用户写 `useState` 而不必加 `React.` 前缀。
 */

'use client';

import {
  Fragment,
  createElement,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useId,
} from 'react';

import * as TimeUI from '@/components/timeui-client';
// 本次新增的 chat 组件已通过 timeui-client re-export 自动进入 TimeUI namespace 扩散：
// ChatScrollToBottom（N1）/ ChatFileChip（N8）。无需在此手工列出。

// 与 mdx-components.tsx 已 import 的 *Demo 列表保持同步：
import { ButtonIconOnlyDemo } from '../ButtonIconOnlyDemo';
import { CardPressableDemo } from '../CardPressableDemo';
import { ChatComposerDemo } from '../ChatComposerDemo';
import { ChatOverviewDemo } from '../ChatOverviewDemo';
import { ChatStreamingDemo } from '../ChatStreamingDemo';
import { ChatToolStatesDemo } from '../ChatToolStatesDemo';
import { ChatWorkspaceDemo } from '../ChatWorkspaceDemo';
import { CheckboxGroupDemo } from '../CheckboxGroupDemo';
import { CodeBlockOnCopyDemo } from '../CodeBlockOnCopyDemo';
import { CodeEditorBasicDemo } from '../CodeEditorBasicDemo';
import { CodeEditorLanguagesDemo } from '../CodeEditorLanguagesDemo';
import { CodeEditorStatesDemo } from '../CodeEditorStatesDemo';
import { CodeEditorVariantsDemo } from '../CodeEditorVariantsDemo';
import { DatePickerBasicDemo } from '../DatePickerBasicDemo';
import { DatePickerSizesDemo } from '../DatePickerSizesDemo';
import { DateRangePickerDemo } from '../DateRangePickerDemo';
import { DateTimePickerBasicDemo } from '../DateTimePickerBasicDemo';
import { DateTimePickerGranularityDemo } from '../DateTimePickerGranularityDemo';
import { DrawerBasicDemo } from '../DrawerBasicDemo';
import { DrawerSizesDemo } from '../DrawerSizesDemo';
import { InputFormDemo } from '../InputFormDemo';
import { MarkdownViewerBasicDemo } from '../MarkdownViewerBasicDemo';
import { MarkdownViewerTocDemo } from '../MarkdownViewerTocDemo';
import { MenuBasicDemo } from '../MenuBasicDemo';
import { MenuSelectionDemo } from '../MenuSelectionDemo';
import { ModalBasicDemo } from '../ModalBasicDemo';
import { ModalSizesDemo } from '../ModalSizesDemo';
import { PaginationBasicDemo } from '../PaginationBasicDemo';
import { PaginationFullDemo } from '../PaginationFullDemo';
import { PdfViewerBasicDemo } from '../PdfViewerBasicDemo';
import { PdfViewerToolbarDemo } from '../PdfViewerToolbarDemo';
import { PopoverDemo } from '../PopoverDemo';
import { PopoverPlacementDemo } from '../PopoverPlacementDemo';
import { RadioGroupDemo } from '../RadioGroupDemo';
import { RichTextEditorBasicDemo } from '../RichTextEditorBasicDemo';
import { RichTextEditorToolbarDemo } from '../RichTextEditorToolbarDemo';
import { RichTextEditorVariantsDemo } from '../RichTextEditorVariantsDemo';
import { SearchDialogDemo } from '../SearchDialogDemo';
import { SegmentedControlIconOnlyDemo } from '../SegmentedControlIconOnlyDemo';
import { SegmentedControlInboxDemo } from '../SegmentedControlInboxDemo';
import { SegmentedControlRangeDemo } from '../SegmentedControlRangeDemo';
import { MultiSelectControlledDemo } from '../MultiSelectControlledDemo';
import { SelectDemo } from '../SelectDemo';
import { SliderRangeDemo } from '../SliderRangeDemo';
import { SliderVolumeDemo } from '../SliderVolumeDemo';
import { StatCardDeltaDemo } from '../StatCardDeltaDemo';
import { StatCardLoadingDemo } from '../StatCardLoadingDemo';
import { StatCardPressableDemo } from '../StatCardPressableDemo';
import { SwitchSettingsDemo } from '../SwitchSettingsDemo';
import { TableCustomRenderDemo } from '../TableCustomRenderDemo';
import { TableFixedColumnsDemo } from '../TableFixedColumnsDemo';
import { TableSelectionDemo } from '../TableSelectionDemo';
import { TableSortableDemo } from '../TableSortableDemo';
import { TableWithPaginationDemo } from '../TableWithPaginationDemo';
import { TabsBasicDemo } from '../TabsBasicDemo';
import { TagClosableDemo, TagInteractiveDemo } from '../TagInteractiveDemo';
import { TextareaDemo } from '../TextareaDemo';
import { ToastBasicDemo } from '../ToastBasicDemo';
import { ToastPromiseDemo } from '../ToastPromiseDemo';
import { UploadBeforeUploadDemo } from '../UploadBeforeUploadDemo';
import { UploadControlledDemo } from '../UploadControlledDemo';
import { UploadCustomRenderDemo } from '../UploadCustomRenderDemo';
import { UploadCustomRequestDemo } from '../UploadCustomRequestDemo';
import { UploadRejectDemo } from '../UploadRejectDemo';
import { UploadWithProgressDemo } from '../UploadWithProgressDemo';

/**
 * sucrase classic JSX runtime 把 `<Foo/>` 翻译成 `React.createElement(Foo, ...)`，
 * 把 `<>...</>` 翻译成 `React.createElement(React.Fragment, ...)`。
 * 所以 scope 必须有一个 `React` namespace，最少含 `createElement` + `Fragment`。
 *
 * 我们额外把所有用户可能用的 hook 也挂上去（`useState` / `useEffect` / ...），
 * 让示例代码可以写 `const [x, setX] = useState(0)` 不用前缀。
 */
const ReactNamespace = {
  Fragment,
  createElement,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useId,
};

/**
 * LiveDemo 在 transpile 后注入的命名空间。冻结，禁止 runtime 修改。
 *
 * 顺序故意按"使用频率 + 可读性"排：React 钩子 / TimeUI 组件 / 文档 demo wrappers。
 * 因为 `transpile.ts` 用 `Object.keys(scope)` 作为 `new Function` 的位置参数名，
 * 本顺序也决定了 fnSource 的参数顺序，方便排错时阅读。
 */
export const liveScope: Readonly<Record<string, unknown>> = Object.freeze({
  // ── React 必需 ─────────────────────────────────────────────────────
  React: ReactNamespace,
  Fragment,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useId,

  // ── TimeUI 组件全集（来自 timeui-client 的 re-export） ──────────────
  ...TimeUI,

  // ── docs 内部 demo wrappers（C 档示例可写 `<XxxDemo />`） ────────────
  ButtonIconOnlyDemo,
  CardPressableDemo,
  ChatComposerDemo,
  ChatOverviewDemo,
  ChatStreamingDemo,
  ChatToolStatesDemo,
  ChatWorkspaceDemo,
  CheckboxGroupDemo,
  CodeBlockOnCopyDemo,
  CodeEditorBasicDemo,
  CodeEditorLanguagesDemo,
  CodeEditorStatesDemo,
  CodeEditorVariantsDemo,
  DatePickerBasicDemo,
  DatePickerSizesDemo,
  DateRangePickerDemo,
  DateTimePickerBasicDemo,
  DateTimePickerGranularityDemo,
  DrawerBasicDemo,
  DrawerSizesDemo,
  InputFormDemo,
  MarkdownViewerBasicDemo,
  MarkdownViewerTocDemo,
  MenuBasicDemo,
  MenuSelectionDemo,
  ModalBasicDemo,
  ModalSizesDemo,
  PaginationBasicDemo,
  PaginationFullDemo,
  PdfViewerBasicDemo,
  PdfViewerToolbarDemo,
  PopoverDemo,
  PopoverPlacementDemo,
  RadioGroupDemo,
  RichTextEditorBasicDemo,
  RichTextEditorToolbarDemo,
  RichTextEditorVariantsDemo,
  SearchDialogDemo,
  SegmentedControlIconOnlyDemo,
  SegmentedControlInboxDemo,
  SegmentedControlRangeDemo,
  MultiSelectControlledDemo,
  SelectDemo,
  SliderRangeDemo,
  SliderVolumeDemo,
  StatCardDeltaDemo,
  StatCardLoadingDemo,
  StatCardPressableDemo,
  SwitchSettingsDemo,
  TableCustomRenderDemo,
  TableFixedColumnsDemo,
  TableSelectionDemo,
  TableSortableDemo,
  TableWithPaginationDemo,
  TabsBasicDemo,
  TagClosableDemo,
  TagInteractiveDemo,
  TextareaDemo,
  ToastBasicDemo,
  ToastPromiseDemo,
  UploadBeforeUploadDemo,
  UploadControlledDemo,
  UploadCustomRenderDemo,
  UploadCustomRequestDemo,
  UploadRejectDemo,
  UploadWithProgressDemo,
});

/**
 * scope 类型别名 —— 给 LiveDemo / LiveEditor 标参数类型时用。
 * 故意保持成 `Readonly<Record<string, unknown>>`，避免把每个 key 的具体组件
 * 类型耦合到调用方。
 */
export type LiveScope = typeof liveScope;
