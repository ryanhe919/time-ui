/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatComposer 组件：聊天输入框，含 auto-grow textarea 与上 / 下 / 左 / 右 slot。
 */

'use client';

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState, useIsomorphicLayoutEffect } from '../utils';
import type { ChatCommonStyleProps } from './Chat.types';

/**
 * 由 `ref` 暴露给消费者的 imperative handle。
 * 让 `composerRef.current?.focus()` 真正落到 textarea 而不是包装 div，
 * 这是 starter card / suggestion 点击后把焦点送回输入框的必备能力。
 */
export interface ChatComposerHandle {
  /** 把焦点送到内部 textarea。 */
  focus: () => void;
  /** 让 textarea 失去焦点。 */
  blur: () => void;
  /** 拿到包装 `<div>`（用于宽度测量、定位等）。 */
  getElement: () => HTMLDivElement | null;
  /** 拿到内部 `<textarea>`（用于选区操作等高级需求）。 */
  getTextarea: () => HTMLTextAreaElement | null;
}

export interface ChatComposerProps extends ChatCommonStyleProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  /** 禁用提交 + textarea。 */
  isDisabled?: boolean;
  /** 占位文字。 */
  placeholder?: string;
  /** Textarea 最小 / 最大行数（覆盖 token 默认值）。 */
  minRows?: number;
  maxRows?: number;
  /** 回车提交（Shift+Enter 换行）。默认 true。 */
  submitOnEnter?: boolean;
  /** Textarea 左侧 slot（如附件工具栏）。 */
  startContent?: ReactNode;
  /** Textarea 右侧 slot（如发送按钮 + 语音）。 */
  endContent?: ReactNode;
  /** 工具栏行上方、shell 内的 slot（如文件 chip）。 */
  topContent?: ReactNode;
  /** 工具栏行下方、shell 内的 slot（如模型选择器）。 */
  bottomContent?: ReactNode;
  /** Textarea 的 ARIA 标签。 */
  'aria-label'?: string;
  /** Form 集成：底层 textarea 的 name 属性。 */
  name?: string;
}

/** 解析行高（px），fallback 为 fontSize * 1.4。 */
function readLineHeightPx(node: HTMLElement): number {
  if (typeof window === 'undefined') return 20;
  const computed = window.getComputedStyle(node);
  const lh = computed.lineHeight;
  if (lh && lh !== 'normal') {
    const parsed = parseFloat(lh);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  const fs = parseFloat(computed.fontSize);
  return (Number.isNaN(fs) ? 14 : fs) * 1.4;
}

export const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(
  function ChatComposer(props, forwardedRef) {
    const {
      value,
      defaultValue,
      onChange,
      onSubmit,
      isDisabled = false,
      placeholder,
      minRows = 1,
      maxRows = 8,
      submitOnEnter = true,
      startContent,
      endContent,
      topContent,
      bottomContent,
      'aria-label': ariaLabel,
      name,
      className,
      style,
      id,
    } = props;

    const theme = useTheme();
    const tokens = theme.components.chat;
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const duration = theme.motion.duration.normal ?? '250ms';

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(
      forwardedRef,
      (): ChatComposerHandle => ({
        focus: () => textareaRef.current?.focus(),
        blur: () => textareaRef.current?.blur(),
        getElement: () => wrapperRef.current,
        getTextarea: () => textareaRef.current,
      }),
      [],
    );
    const isComposingRef = useRef(false);

    const [rawValue, setValue] = useControllableState<string>({
      value,
      // 仅在非受控模式下传递 defaultValue，避免 useControllableState 的双模式警告。
      defaultValue: (value !== undefined ? undefined : (defaultValue ?? '')) as string,
      onChange,
      name: 'ChatComposer',
    });
    const currentValue = rawValue ?? '';
    const isControlled = value !== undefined;

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
      },
      [setValue],
    );

    const submit = useCallback(() => {
      const trimmed = currentValue.trim();
      if (!trimmed) return;
      if (isDisabled) return;
      onSubmit?.(currentValue);
      if (!isControlled) {
        setValue('');
      }
    }, [currentValue, isControlled, isDisabled, onSubmit, setValue]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter') return;
        if (!submitOnEnter) return;
        if (e.shiftKey) return;
        if (isComposingRef.current) return;
        // 一些浏览器 / IME 仍可能在 keydown 时携带 isComposing=true。
        if ((e.nativeEvent as KeyboardEvent['nativeEvent'] & { isComposing?: boolean }).isComposing)
          return;
        e.preventDefault();
        submit();
      },
      [submitOnEnter, submit],
    );

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback((_e: CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
    }, []);

    // Auto-grow：reset → 'auto'，再读取 scrollHeight 并夹在 [minHeight, maxHeight]。
    useIsomorphicLayoutEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      const lineHeightPx = readLineHeightPx(el);
      const computed = window.getComputedStyle(el);
      const verticalPadding =
        (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0);
      // scrollHeight includes padding; a border-box height must leave room
      // for it as well, otherwise the last configured row is clipped.
      const minHeight = lineHeightPx * minRows + verticalPadding;
      const maxHeight = Math.max(minHeight, lineHeightPx * maxRows + verticalPadding);
      el.style.minHeight = `max(${tokens.composerMinHeight}, ${minHeight}px)`;
      el.style.maxHeight = `${maxHeight}px`;
      el.style.height = 'auto';
      const natural = el.scrollHeight;
      const clamped = Math.max(minHeight, Math.min(natural, maxHeight));
      el.style.height = `${clamped}px`;
      el.style.overflowY = natural > maxHeight ? 'auto' : 'hidden';
    }, [currentValue, minRows, maxRows, tokens.composerMinHeight]);

    // Y1+Y2 (chat-audit.md)：focus 视觉与 Input/Select 体系对齐 ——
    // 用 `:focus-within` 选择器（不再 useState 跟踪）+ 2px 内描边 box-shadow
    // 来代替 1→2px 边框宽度切换（避免 1px 跳变 + 与 fieldStyles 一致）。
    const shellCss = css`
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      padding: ${tokens.composerPaddingY} ${tokens.composerPaddingX};
      gap: ${tokens.composerToolbarGap};
      background-color: ${theme.colors.bg.surface};
      color: ${theme.colors.text.primary};
      border: 1px solid ${theme.colors.border.default};
      border-radius: ${tokens.composerRadius};
      font-family: inherit;
      transition:
        border-color ${duration},
        box-shadow ${duration},
        opacity ${duration};
      opacity: ${isDisabled ? 0.6 : 1};

      &:focus-within {
        border-color: ${focusColor};
        box-shadow: inset 0 0 0 1px ${focusColor};
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const textareaCss = css`
      width: 100%;
      min-height: ${tokens.composerMinHeight};
      max-height: ${tokens.composerMaxHeight};
      padding: 6px 4px;
      margin: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      appearance: none;
      box-sizing: border-box;
      pointer-events: ${isDisabled ? 'none' : 'auto'};

      &::placeholder {
        color: ${theme.colors.text.muted};
        opacity: 1;
      }
      &:disabled {
        cursor: not-allowed;
        color: ${theme.colors.text.disabled};
        -webkit-text-fill-color: ${theme.colors.text.disabled};
      }
    `;

    const toolbarCss = css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${tokens.composerToolbarGap};
      pointer-events: ${isDisabled ? 'none' : 'auto'};
    `;

    const toolbarSlotCss = css`
      display: inline-flex;
      align-items: center;
      gap: ${tokens.composerToolbarGap};
      min-width: 0;
    `;

    return (
      <div
        ref={wrapperRef}
        id={id}
        className={className}
        style={style}
        css={shellCss}
        data-disabled={isDisabled || undefined}
      >
        {topContent ? (
          <div data-slot="top" css={toolbarSlotCss}>
            {topContent}
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          name={name}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-disabled={isDisabled || undefined}
          rows={minRows}
          css={textareaCss}
          data-slot="textarea"
        />

        {startContent || endContent ? (
          <div data-slot="toolbar" css={toolbarCss}>
            <div data-slot="start" css={toolbarSlotCss}>
              {startContent}
            </div>
            <div data-slot="end" css={toolbarSlotCss}>
              {endContent}
            </div>
          </div>
        ) : null}

        {bottomContent ? (
          <div data-slot="bottom" css={toolbarSlotCss}>
            {bottomContent}
          </div>
        ) : null}
      </div>
    );
  },
);

(ChatComposer as unknown as { displayName: string }).displayName = 'ChatComposer';
