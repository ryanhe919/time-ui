/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 mdx-components 模块。
 */

import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import {
  Callout,
  CodeBlock,
  Code,
  Button,
  Box,
  Grid,
  Container,
  Flex,
  Stack,
  Text,
  Heading,
  Paragraph,
  Link,
  FormField,
  Input,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Switch,
  Slider,
  SegmentedControl,
  Select,
  SelectOption,
  ChatMessage,
  ChatMessageList,
  ChatAvatar,
  ChatTypingIndicator,
  ChatToolCall,
  ChatKnowledgeRefs,
  ChatComposer,
  ChatActionButton,
  ChatSendButton,
  ChatVoiceWave,
  ChatMarkdown,
  RichTextEditor,
  CodeEditor,
  PdfViewer,
  MarkdownViewer,
  Popover,
  Tooltip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  TabPanel,
  Pagination,
  Table,
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  ToastProvider,
  Menu,
  MenuItem,
  MenuSection,
  MenuDivider,
  DatePicker,
  DateRangePicker,
  Avatar,
  AvatarGroup,
  Tag,
  Badge,
  Skeleton,
  SkeletonGroup,
  Empty,
  Steps,
  Upload,
  UploadList,
  UploadItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  StatCard,
} from '@/components/timeui-client';
import { PropsTable } from '@/components/mdx/PropsTable';
import { LiveDemo } from '@/components/mdx/LiveDemo';
import { SearchDialogDemo } from '@/components/mdx/SearchDialogDemo';
import { InputFormDemo } from '@/components/mdx/InputFormDemo';
import { TextareaDemo } from '@/components/mdx/TextareaDemo';
import { CheckboxGroupDemo } from '@/components/mdx/CheckboxGroupDemo';
import { RadioGroupDemo } from '@/components/mdx/RadioGroupDemo';
import { SwitchSettingsDemo } from '@/components/mdx/SwitchSettingsDemo';
import { SliderVolumeDemo } from '@/components/mdx/SliderVolumeDemo';
import { SliderRangeDemo } from '@/components/mdx/SliderRangeDemo';
import { SegmentedControlInboxDemo } from '@/components/mdx/SegmentedControlInboxDemo';
import { SegmentedControlRangeDemo } from '@/components/mdx/SegmentedControlRangeDemo';
import { SegmentedControlIconOnlyDemo } from '@/components/mdx/SegmentedControlIconOnlyDemo';
import { ButtonIconOnlyDemo } from '@/components/mdx/ButtonIconOnlyDemo';
import { ChatOverviewDemo } from '@/components/mdx/ChatOverviewDemo';
import { ChatComposerDemo } from '@/components/mdx/ChatComposerDemo';
import { ChatStreamingDemo } from '@/components/mdx/ChatStreamingDemo';
import { ChatToolStatesDemo } from '@/components/mdx/ChatToolStatesDemo';
import { ChatWorkspaceDemo } from '@/components/mdx/ChatWorkspaceDemo';
import { SelectDemo } from '@/components/mdx/SelectDemo';
import { CodeBlockOnCopyDemo } from '@/components/mdx/CodeBlockOnCopyDemo';
import { PopoverDemo } from '@/components/mdx/PopoverDemo';
import { PopoverPlacementDemo } from '@/components/mdx/PopoverPlacementDemo';
import { ModalBasicDemo } from '@/components/mdx/ModalBasicDemo';
import { ModalSizesDemo } from '@/components/mdx/ModalSizesDemo';
import { TabsBasicDemo } from '@/components/mdx/TabsBasicDemo';
import { PaginationBasicDemo } from '@/components/mdx/PaginationBasicDemo';
import { PaginationFullDemo } from '@/components/mdx/PaginationFullDemo';
import { TableSortableDemo } from '@/components/mdx/TableSortableDemo';
import { TableSelectionDemo } from '@/components/mdx/TableSelectionDemo';
import { TableWithPaginationDemo } from '@/components/mdx/TableWithPaginationDemo';
import { TableFixedColumnsDemo } from '@/components/mdx/TableFixedColumnsDemo';
import { TableCustomRenderDemo } from '@/components/mdx/TableCustomRenderDemo';
import { DrawerBasicDemo } from '@/components/mdx/DrawerBasicDemo';
import { DrawerSizesDemo } from '@/components/mdx/DrawerSizesDemo';
import { ToastBasicDemo } from '@/components/mdx/ToastBasicDemo';
import { ToastPromiseDemo } from '@/components/mdx/ToastPromiseDemo';
import { MenuBasicDemo } from '@/components/mdx/MenuBasicDemo';
import { MenuSelectionDemo } from '@/components/mdx/MenuSelectionDemo';
import { DatePickerBasicDemo } from '@/components/mdx/DatePickerBasicDemo';
import { DatePickerSizesDemo } from '@/components/mdx/DatePickerSizesDemo';
import { DateRangePickerDemo } from '@/components/mdx/DateRangePickerDemo';
import { DateTimePickerBasicDemo } from '@/components/mdx/DateTimePickerBasicDemo';
import { DateTimePickerGranularityDemo } from '@/components/mdx/DateTimePickerGranularityDemo';
import { TagClosableDemo, TagInteractiveDemo } from '@/components/mdx/TagInteractiveDemo';
import { UploadWithProgressDemo } from '@/components/mdx/UploadWithProgressDemo';
import { UploadCustomRequestDemo } from '@/components/mdx/UploadCustomRequestDemo';
import { UploadRejectDemo } from '@/components/mdx/UploadRejectDemo';
import { UploadBeforeUploadDemo } from '@/components/mdx/UploadBeforeUploadDemo';
import { UploadCustomRenderDemo } from '@/components/mdx/UploadCustomRenderDemo';
import { UploadControlledDemo } from '@/components/mdx/UploadControlledDemo';
import { CardPressableDemo } from '@/components/mdx/CardPressableDemo';
import { StatCardDeltaDemo } from '@/components/mdx/StatCardDeltaDemo';
import { StatCardLoadingDemo } from '@/components/mdx/StatCardLoadingDemo';
import { StatCardPressableDemo } from '@/components/mdx/StatCardPressableDemo';
import { RichTextEditorBasicDemo } from '@/components/mdx/RichTextEditorBasicDemo';
import { RichTextEditorVariantsDemo } from '@/components/mdx/RichTextEditorVariantsDemo';
import { RichTextEditorToolbarDemo } from '@/components/mdx/RichTextEditorToolbarDemo';
import { CodeEditorBasicDemo } from '@/components/mdx/CodeEditorBasicDemo';
import { CodeEditorLanguagesDemo } from '@/components/mdx/CodeEditorLanguagesDemo';
import { CodeEditorVariantsDemo } from '@/components/mdx/CodeEditorVariantsDemo';
import { CodeEditorStatesDemo } from '@/components/mdx/CodeEditorStatesDemo';
import { PdfViewerBasicDemo } from '@/components/mdx/PdfViewerBasicDemo';
import { PdfViewerToolbarDemo } from '@/components/mdx/PdfViewerToolbarDemo';
import { MarkdownViewerBasicDemo } from '@/components/mdx/MarkdownViewerBasicDemo';
import { MarkdownViewerTocDemo } from '@/components/mdx/MarkdownViewerTocDemo';

type MDXComponents = Record<string, unknown>;

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getTextContent(node.props.children);
  return '';
}

function getCodeBlockPropsFromPre(children: ReactNode) {
  const [firstChild] = Children.toArray(children);
  if (!isValidElement<{ children?: ReactNode; className?: string }>(firstChild)) return null;

  const className = firstChild.props.className ?? '';
  const code = getTextContent(firstChild.props.children).replace(/\n$/, '');
  if (!code) return null;
  const language =
    className
      .split(/\s+/)
      .find((token) => token.startsWith('language-'))
      ?.replace(/^language-/, '') || 'tsx';

  return { code, language };
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    PropsTable,
    CodeBlock,
    LiveDemo,
    SearchDialogDemo,
    InputFormDemo,
    TextareaDemo,
    CheckboxGroupDemo,
    RadioGroupDemo,
    SwitchSettingsDemo,
    SliderVolumeDemo,
    SliderRangeDemo,
    SegmentedControlInboxDemo,
    SegmentedControlRangeDemo,
    SegmentedControlIconOnlyDemo,
    ButtonIconOnlyDemo,
    ChatOverviewDemo,
    ChatComposerDemo,
    ChatStreamingDemo,
    ChatToolStatesDemo,
    ChatWorkspaceDemo,
    SelectDemo,
    CodeBlockOnCopyDemo,
    PopoverDemo,
    PopoverPlacementDemo,
    ModalBasicDemo,
    ModalSizesDemo,
    TabsBasicDemo,
    PaginationBasicDemo,
    PaginationFullDemo,
    TableSortableDemo,
    TableSelectionDemo,
    TableWithPaginationDemo,
    TableFixedColumnsDemo,
    TableCustomRenderDemo,
    DrawerBasicDemo,
    DrawerSizesDemo,
    ToastBasicDemo,
    ToastPromiseDemo,
    MenuBasicDemo,
    MenuSelectionDemo,
    DatePickerBasicDemo,
    DatePickerSizesDemo,
    DateRangePickerDemo,
    DateTimePickerBasicDemo,
    DateTimePickerGranularityDemo,
    TagClosableDemo,
    TagInteractiveDemo,
    UploadWithProgressDemo,
    UploadCustomRequestDemo,
    UploadRejectDemo,
    UploadBeforeUploadDemo,
    UploadCustomRenderDemo,
    UploadControlledDemo,
    CardPressableDemo,
    StatCardDeltaDemo,
    StatCardLoadingDemo,
    StatCardPressableDemo,
    RichTextEditorBasicDemo,
    RichTextEditorVariantsDemo,
    RichTextEditorToolbarDemo,
    CodeEditorBasicDemo,
    CodeEditorLanguagesDemo,
    CodeEditorVariantsDemo,
    CodeEditorStatesDemo,
    PdfViewerBasicDemo,
    PdfViewerToolbarDemo,
    MarkdownViewerBasicDemo,
    MarkdownViewerTocDemo,

    Button,
    Box,
    Grid,
    Container,
    Flex,
    Stack,
    Text,
    Heading,
    Paragraph,
    Link,
    Code,

    FormField,
    Input,
    Textarea,
    Checkbox,
    CheckboxGroup,
    Radio,
    RadioGroup,
    Switch,
    Slider,
    SegmentedControl,
    Select,
    SelectOption,
    ChatMessage,
    ChatMessageList,
    ChatAvatar,
    ChatTypingIndicator,
    ChatToolCall,
    ChatKnowledgeRefs,
    ChatComposer,
    ChatActionButton,
    ChatSendButton,
    ChatVoiceWave,
    ChatMarkdown,
    RichTextEditor,
    CodeEditor,
    PdfViewer,
    MarkdownViewer,
    Popover,
    Tooltip,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tabs,
    Tab,
    TabPanel,
    Pagination,
    Table,
    Drawer,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    ToastProvider,
    Menu,
    MenuItem,
    MenuSection,
    MenuDivider,
    DatePicker,
    DateRangePicker,
    Avatar,
    AvatarGroup,
    Tag,
    Badge,
    Skeleton,
    SkeletonGroup,
    Empty,
    Steps,
    Upload,
    UploadList,
    UploadItem,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    StatCard,

    code: (p: ComponentPropsWithoutRef<'code'>) =>
      typeof p.children === 'string' ? <Code {...p}>{p.children}</Code> : <code {...p} />,

    pre: (p: ComponentPropsWithoutRef<'pre'>) => {
      const extracted = getCodeBlockPropsFromPre(p.children);
      if (!extracted) return <pre {...p} />;
      return <CodeBlock code={extracted.code} language={extracted.language} />;
    },

    ...components,
  };
}
