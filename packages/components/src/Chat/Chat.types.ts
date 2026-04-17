/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Chat 组件族的共享 TypeScript 类型。
 */

import type { ReactNode, CSSProperties } from 'react';

/** 消息角色：5 种内置 + 字符串扩展位以兼容自定义角色。 */
export type ChatMessageRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool'
  | 'knowledge'
  | (string & {});

/** 工具调用执行状态。 */
export type ChatToolCallStatus = 'pending' | 'running' | 'success' | 'error';

/** 知识库引用条目。 */
export interface ChatKnowledgeReference {
  id: string;
  /** 来源短标题（chip 上展示的文字）。 */
  title: string;
  /** 长标题或片段，hover/详情场景。 */
  snippet?: string;
  /** 跳转链接（可选）。 */
  href?: string;
  /** 文档来源类别（如 'pdf' / 'web' / 'note'）。 */
  source?: string;
}

/** 工具调用数据，用于驱动 ChatToolCall 卡片。 */
export interface ChatToolCallData {
  /** 工具名（函数名）。 */
  name: string;
  /** 调用参数（结构化对象或已格式化字符串）。 */
  arguments?: unknown;
  /** 调用结果（结构化对象或字符串）。 */
  result?: unknown;
  status: ChatToolCallStatus;
  /** 错误信息，status='error' 时显示。 */
  error?: string;
}

/** 头像可接受的 source：图片 URL / 文字（首字母）/ 自定义节点。 */
export type ChatAvatarSource =
  | { kind: 'image'; src: string; alt?: string }
  | { kind: 'text'; text: string }
  | { kind: 'node'; node: ReactNode };

/** 公共可选样式钩子。 */
export interface ChatCommonStyleProps {
  className?: string;
  style?: CSSProperties;
  id?: string;
}
