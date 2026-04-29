/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 统一导出 Chat 组件族的对外接口。
 */

export type {
  ChatMessageRole,
  ChatToolCallStatus,
  ChatKnowledgeReference,
  ChatToolCallData,
  ChatAvatarSource,
  ChatCommonStyleProps,
} from './Chat.types';

export { ChatAvatar } from './ChatAvatar';
export type { ChatAvatarProps } from './ChatAvatar';

export { ChatTypingIndicator } from './ChatTypingIndicator';
export type { ChatTypingIndicatorProps } from './ChatTypingIndicator';

export { ChatVoiceWave } from './ChatVoiceWave';
export type { ChatVoiceWaveProps, ChatVoiceWaveSize, ChatVoiceWaveColor } from './ChatVoiceWave';

export { ChatMessage } from './ChatMessage';
export type { ChatMessageProps } from './ChatMessage';

export { ChatMessageList } from './ChatMessageList';
export type { ChatMessageListProps } from './ChatMessageList';

export { ChatToolCall } from './ChatToolCall';
export type { ChatToolCallProps } from './ChatToolCall';

export { ChatKnowledgeRefs } from './ChatKnowledgeRefs';
export type { ChatKnowledgeRefsProps } from './ChatKnowledgeRefs';

export { ChatComposer } from './ChatComposer';
export type { ChatComposerHandle, ChatComposerProps } from './ChatComposer';

export { ChatScrollToBottom } from './ChatScrollToBottom';
export type { ChatScrollToBottomProps } from './ChatScrollToBottom';

export { ChatFileChip } from './ChatFileChip';
export type { ChatFileChipKind, ChatFileChipProps } from './ChatFileChip';

export { ChatActionButton } from './ChatActionButton';
export type { ChatActionButtonProps } from './ChatActionButton';

export { ChatSendButton } from './ChatSendButton';
export type { ChatSendButtonProps } from './ChatSendButton';

export { useChatStream } from './useChatStream';
export type { UseChatStreamOptions, UseChatStreamResult } from './useChatStream';
