/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Upload 组件的主实现：校验、队列、受控/非受控、button / dropzone 双形态。
 */

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useTheme, css } from '@emotion/react';
import { useI18n } from '@timeui/core';
import { useControllableState, isDev } from '../utils';
import { FormField } from '../FormField';
import { Button } from '../Button';
import { UploadList } from './UploadList';
import { useFilePreview } from './useFilePreview';
import { useUploadQueue } from './useUploadQueue';
import { interpolate, matchesAccept, validateFiles } from './validateFile';
import { AlertCircleIcon, ArrowUpTrayIcon, CloudUploadIcon } from './icons';
import type {
  UploadChangeMeta,
  UploadFile,
  UploadHandle,
  UploadProps,
  UploadRejection,
  UploadRejectReason,
} from './Upload.types';

function generateId(counter: { n: number }): string {
  const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
  const c = g && (g.crypto as Crypto | undefined);
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID();
    } catch {
      // fall through
    }
  }
  counter.n += 1;
  return `timeui-upload-${Date.now()}-${counter.n}`;
}

const warnOnce = (() => {
  const seen = new Set<string>();
  return (key: string, msg: string) => {
    if (!isDev) return;
    if (seen.has(key)) return;
    seen.add(key);

    console.warn(msg);
  };
})();

function reasonToMessage(
  reason: UploadRejectReason,
  name: string,
  max: number | undefined,
  i18n: ReturnType<typeof useI18n>,
): string {
  switch (reason) {
    case 'accept':
      return interpolate(i18n.upload.rejectByType, { name });
    case 'size':
      return interpolate(i18n.upload.rejectBySize, { name });
    case 'count':
      return interpolate(i18n.upload.rejectByCount, { max: max ?? 0 });
    case 'duplicate':
      return interpolate(i18n.upload.rejectByDuplicate, { name });
    case 'before-upload':
      return interpolate(i18n.upload.rejectByBeforeUpload, { name });
    default:
      return '';
  }
}

export const Upload = forwardRef<UploadHandle, UploadProps>(function Upload(
  {
    value,
    defaultValue,
    onChange,

    variant = 'button',
    size = 'md',
    color = 'default',
    radius,
    isFullWidth = false,

    accept,
    multiple = false,
    maxSize = Infinity,
    maxCount = Infinity,
    isDisabled = false,
    isReadOnly = false,

    customRequest,
    concurrency = 3,
    isAutoUpload = true,

    beforeUpload,
    onReject,
    onRemove,
    allowDuplicates = true,

    trigger,
    dropzoneContent,
    showFileList = true,
    renderItem,
    emptyContent,
    listPosition = 'bottom',

    onUploadProgress,
    onUploadComplete,

    dropzoneHeight = 160,
    disableClickToUpload = false,
    disableDragAndDrop = false,

    label,
    description,
    errorMessage,
    isRequired = false,
    isInvalid: isInvalidProp,
    name,

    className,
    style,
    classNames,
    id: idProp,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...restIncludingInjected
  },
  ref,
) {
  // FormField clones its child and injects some props; strip any leak that would end up on the root <div>.
  const {
    required: _required,
    'aria-required': ariaRequiredInjected,
    'aria-invalid': ariaInvalidInjected,
    ...rest
  } = restIncludingInjected as Record<string, unknown>;
  void _required;
  void ariaRequiredInjected;
  void ariaInvalidInjected;
  const theme = useTheme();
  const i18n = useI18n();
  const autoId = useId();
  const id = idProp ?? `timeui-upload-${autoId}`;

  // dev warn: both value and defaultValue
  useEffect(() => {
    if (!isDev) return;
    if (value !== undefined && defaultValue !== undefined) {
      warnOnce(
        'upload-both',
        '[TimeUI] Upload: received both `value` and `defaultValue`. Components must be either controlled or uncontrolled — `defaultValue` will be ignored.',
      );
    }
  }, [value, defaultValue]);

  // `useControllableState` itself warns when both `value` and `defaultValue` are defined —
  // so to avoid spurious warnings we only synthesise an empty defaultValue when neither was
  // supplied (true uncontrolled-with-no-initial case).
  const isControlled = value !== undefined;
  const hookDefaultValue = useMemo<UploadFile[] | undefined>(() => {
    if (isControlled) return undefined;
    return defaultValue ?? [];
  }, [isControlled, defaultValue]);
  const [currentValue, setStateRaw] = useControllableState<UploadFile[]>({
    value,
    defaultValue: hookDefaultValue as UploadFile[],
    name: 'Upload',
  });

  const stateRef = useRef<UploadFile[]>(currentValue);
  useEffect(() => {
    stateRef.current = currentValue;
  }, [currentValue]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const onRejectRef = useRef(onReject);
  useEffect(() => {
    onRejectRef.current = onReject;
  }, [onReject]);

  const onRemoveRef = useRef(onRemove);
  useEffect(() => {
    onRemoveRef.current = onRemove;
  }, [onRemove]);

  const onProgressRef = useRef(onUploadProgress);
  useEffect(() => {
    onProgressRef.current = onUploadProgress;
  }, [onUploadProgress]);

  const onCompleteRef = useRef(onUploadComplete);
  useEffect(() => {
    onCompleteRef.current = onUploadComplete;
  }, [onUploadComplete]);

  const beforeUploadRef = useRef(beforeUpload);
  useEffect(() => {
    beforeUploadRef.current = beforeUpload;
  }, [beforeUpload]);

  const idCounter = useRef({ n: 0 });

  // 派发 onChange（和更新 state）的统一函数。
  // 对于非受控场景，value 内部 state 会同步更新；
  // 对于受控场景，只派发回调，父组件负责更新 value。
  const commit = useCallback(
    (next: UploadFile[], meta: UploadChangeMeta) => {
      stateRef.current = next;
      setStateRaw(next);
      onChangeRef.current?.(next, meta);
    },
    [setStateRaw],
  );

  // —— 队列 ——
  const queue = useUploadQueue({
    concurrency,
    customRequest,
    getFile: (qid) => stateRef.current.find((f) => f.id === qid),
    onProgress: (qid, percent) => {
      const list = stateRef.current;
      const idx = list.findIndex((f) => f.id === qid);
      if (idx < 0) return;
      const prev = list[idx];
      if (!prev) return;
      const nextItem: UploadFile = {
        ...prev,
        status: prev.status === 'ready' ? 'uploading' : prev.status,
        percent,
      };
      const next = list.slice();
      next[idx] = nextItem;
      stateRef.current = next;
      setStateRaw(next);
      // 进度不触发 onChange，只触发 onUploadProgress
      onProgressRef.current?.(nextItem, percent);
    },
    onSuccess: (qid, response) => {
      const list = stateRef.current;
      const idx = list.findIndex((f) => f.id === qid);
      if (idx < 0) return;
      const prev = list[idx];
      if (!prev) return;
      const nextItem: UploadFile = {
        ...prev,
        status: 'success',
        percent: 100,
        response,
      };
      const next = list.slice();
      next[idx] = nextItem;
      commit(next, { trigger: 'update', file: nextItem });
      maybeNotifyComplete(next);
    },
    onError: (qid, error) => {
      const list = stateRef.current;
      const idx = list.findIndex((f) => f.id === qid);
      if (idx < 0) return;
      const prev = list[idx];
      if (!prev) return;
      const nextItem: UploadFile = {
        ...prev,
        status: 'error',
        error,
      };
      const next = list.slice();
      next[idx] = nextItem;
      commit(next, { trigger: 'update', file: nextItem });
      maybeNotifyComplete(next);
    },
  });

  // 队列清空（没有 uploading / ready）边沿触发 onUploadComplete。
  const prevBusyRef = useRef(false);
  const maybeNotifyComplete = useCallback((list: UploadFile[]) => {
    const busy = list.some((f) => f.status === 'uploading' || f.status === 'ready');
    if (prevBusyRef.current && !busy) {
      onCompleteRef.current?.(list);
    }
    prevBusyRef.current = busy;
  }, []);

  // 每次 value 变化，同步 prevBusyRef
  useEffect(() => {
    prevBusyRef.current = currentValue.some(
      (f) => f.status === 'uploading' || f.status === 'ready',
    );
  }, [currentValue]);

  // —— preview ——
  useFilePreview(currentValue);

  // —— live region ——
  const liveRef = useRef<HTMLDivElement | null>(null);
  const announce = useCallback((msg: string) => {
    if (!liveRef.current) return;
    // 清空再写入，强制屏幕阅读器重读
    liveRef.current.textContent = '';
    window.setTimeout(() => {
      if (liveRef.current) liveRef.current.textContent = msg;
    }, 10);
  }, []);

  // —— ingest 统一入口 ——
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const ingest = useCallback(
    async (incoming: File[], _source: 'click' | 'drop') => {
      if (isDisabled || isReadOnly) return;
      if (incoming.length === 0) return;

      // multiple=false 时只取第一个
      const list = multiple ? incoming : incoming.slice(0, 1);

      const { accepted, rejections } = validateFiles(list, {
        accept,
        maxSize,
        maxCount,
        allowDuplicates,
        currentActive: stateRef.current,
      });

      // beforeUpload 过滤
      const acceptedAfterBefore: File[] = [];
      const beforeRejections: Array<{ file: File; reason: UploadRejectReason }> = [];
      if (beforeUploadRef.current && accepted.length > 0) {
        const allFiles = accepted.slice();
        for (const f of accepted) {
          let keep: boolean;
          try {
            const r = beforeUploadRef.current(f, allFiles);
            keep = r instanceof Promise ? await r : r;
          } catch {
            keep = false;
          }
          if (keep === false) {
            beforeRejections.push({ file: f, reason: 'before-upload' });
          } else {
            acceptedAfterBefore.push(f);
          }
        }
      } else {
        acceptedAfterBefore.push(...accepted);
      }

      const allRejections = rejections.concat(beforeRejections);
      if (allRejections.length > 0) {
        const payload: UploadRejection[] = allRejections.map((r) => ({
          file: r.file,
          reason: r.reason,
          message: reasonToMessage(
            r.reason,
            r.file.name,
            r.reason === 'count' ? maxCount : undefined,
            i18n,
          ),
        }));
        onRejectRef.current?.(payload);
        announce(interpolate(i18n.upload.liveRejected, { count: payload.length }));
      }

      if (acceptedAfterBefore.length === 0) return;

      const added: UploadFile[] = acceptedAfterBefore.map((file) => ({
        id: generateId(idCounter.current),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready',
        file,
      }));

      const nextValue = stateRef.current.concat(added);
      commit(nextValue, { trigger: 'add', file: added[0] });
      announce(interpolate(i18n.upload.liveAdded, { count: added.length }));

      if (isAutoUpload && customRequest) {
        for (const item of added) {
          queue.enqueue(item.id);
        }
      }
    },
    [
      isDisabled,
      isReadOnly,
      multiple,
      accept,
      maxSize,
      maxCount,
      allowDuplicates,
      isAutoUpload,
      customRequest,
      commit,
      queue,
      i18n,
      announce,
    ],
  );

  // —— 触发器事件 ——
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      void ingest(files, 'click');
      // 重置，同一个文件二次选择也能触发 onChange
      e.target.value = '';
    },
    [ingest],
  );

  const openPicker = useCallback(() => {
    if (isDisabled || isReadOnly) return;
    inputRef.current?.click();
  }, [isDisabled, isReadOnly]);

  // —— Dropzone handlers ——
  const dragDepthRef = useRef(0);
  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (disableDragAndDrop || isDisabled || isReadOnly) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current += 1;
      setIsDragging(true);
      // 预判 accept 匹配。dragover 阶段只有 type。
      const items = Array.from(e.dataTransfer?.items ?? []);
      if (accept && items.length > 0) {
        const anyMatch = items.some((it) => {
          if (it.kind !== 'file') return false;
          const mock = new File([], 'probe', { type: it.type });
          return matchesAccept(mock, accept);
        });
        setIsRejecting(!anyMatch);
      } else {
        setIsRejecting(false);
      }
    },
    [disableDragAndDrop, isDisabled, isReadOnly, accept],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (disableDragAndDrop || isDisabled || isReadOnly) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    },
    [disableDragAndDrop, isDisabled, isReadOnly],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (disableDragAndDrop || isDisabled || isReadOnly) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDragging(false);
        setIsRejecting(false);
      }
    },
    [disableDragAndDrop, isDisabled, isReadOnly],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (disableDragAndDrop || isDisabled || isReadOnly) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragging(false);
      setIsRejecting(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      void ingest(files, 'drop');
    },
    [disableDragAndDrop, isDisabled, isReadOnly, ingest],
  );

  const handleDropzoneKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disableClickToUpload) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        openPicker();
      }
    },
    [disableClickToUpload, openPicker],
  );

  const handleDropzoneClick = useCallback(() => {
    if (disableClickToUpload) return;
    openPicker();
  }, [disableClickToUpload, openPicker]);

  // —— 删除 / 重试 ——
  const removeFile = useCallback(
    async (file: UploadFile) => {
      if (isDisabled || isReadOnly) return;
      let result: unknown;
      try {
        result = onRemoveRef.current?.(file);
        if (result instanceof Promise) {
          result = await result;
        }
      } catch {
        result = false;
      }
      if (result === false) return;

      // abort in-flight
      queue.abort(file.id);

      const list = stateRef.current;
      const next = list.filter((f) => f.id !== file.id);
      commit(next, { trigger: 'remove', file });
      announce(interpolate(i18n.upload.liveRemoved, { name: file.name }));
    },
    [isDisabled, isReadOnly, queue, commit, i18n, announce],
  );

  const retryFile = useCallback(
    (file: UploadFile) => {
      if (isDisabled || isReadOnly) return;
      const list = stateRef.current;
      const idx = list.findIndex((f) => f.id === file.id);
      if (idx < 0) return;
      const prev = list[idx];
      if (!prev) return;
      const next = list.slice();
      next[idx] = { ...prev, status: 'ready', error: undefined, percent: 0 };
      commit(next, { trigger: 'update', file: next[idx] });
      if (customRequest) {
        queue.enqueue(file.id);
      }
    },
    [isDisabled, isReadOnly, commit, customRequest, queue],
  );

  // —— 命令式 ref ——
  useImperativeHandle(
    ref,
    () => ({
      open: () => openPicker(),
      submit: (ids?: string[]) => {
        if (!customRequest) return;
        const list = stateRef.current;
        const targets = ids
          ? list.filter((f) => ids.includes(f.id) && f.status === 'ready')
          : list.filter((f) => f.status === 'ready');
        for (const t of targets) queue.enqueue(t.id);
      },
      retry: (rid: string) => {
        const f = stateRef.current.find((x) => x.id === rid);
        if (f) retryFile(f);
      },
      abort: (aid: string) => {
        queue.abort(aid);
        const list = stateRef.current;
        const idx = list.findIndex((f) => f.id === aid);
        if (idx < 0) return;
        const prev = list[idx];
        if (!prev) return;
        if (prev.status !== 'uploading' && prev.status !== 'ready') return;
        const next = list.slice();
        next[idx] = {
          ...prev,
          status: 'error',
          error: new Error('Upload aborted'),
        };
        commit(next, { trigger: 'update', file: next[idx] });
      },
      clear: () => {
        queue.abortAll();
        commit([], { trigger: 'reset' });
      },
    }),
    [openPicker, retryFile, queue, commit, customRequest],
  );

  // —— 渲染 ——
  const hasError = errorMessage !== undefined && errorMessage !== null && errorMessage !== false;
  const isInvalid = isInvalidProp ?? hasError;

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={handleInputChange}
      disabled={isDisabled || isReadOnly}
      aria-hidden="true"
      tabIndex={-1}
      css={css`
        display: none;
      `}
      data-slot="input"
    />
  );

  const hiddenName = name ? <input type="hidden" name={name} value="" aria-hidden="true" /> : null;

  const liveRegion = (
    <div
      ref={liveRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      css={visuallyHiddenCss}
    />
  );

  const triggerNode: ReactNode = (() => {
    if (variant !== 'button') return null;
    if (trigger) {
      return (
        <span
          className={classNames?.trigger}
          onClick={openPicker}
          role="presentation"
          data-slot="trigger"
        >
          {trigger}
        </span>
      );
    }
    return (
      <Button
        type="button"
        size={size}
        color={color === 'default' ? undefined : color}
        isDisabled={isDisabled}
        onClick={openPicker}
        aria-label={ariaLabel ?? i18n.upload.triggerLabel}
        isFullWidth={isFullWidth}
        data-slot="trigger"
        className={classNames?.trigger}
      >
        <span
          css={css`
            display: inline-flex;
            align-items: center;
            gap: 6px;
          `}
        >
          <ArrowUpTrayIcon
            aria-hidden="true"
            width={size === 'xs' || size === 'sm' ? 14 : 16}
            height={size === 'xs' || size === 'sm' ? 14 : 16}
          />
          {i18n.upload.triggerText}
        </span>
      </Button>
    );
  })();

  const dropzoneNode: ReactNode = (() => {
    if (variant !== 'dropzone') return null;
    const effectiveHeight =
      typeof dropzoneHeight === 'number' ? `${dropzoneHeight}px` : dropzoneHeight;

    const contentStateArg = { isDragging, isRejecting };
    const content: ReactNode =
      typeof dropzoneContent === 'function'
        ? (dropzoneContent as (s: { isDragging: boolean; isRejecting: boolean }) => ReactNode)(
            contentStateArg,
          )
        : (dropzoneContent ?? defaultDropzoneContent(i18n, isDragging, isRejecting, accept));

    return (
      <div
        ref={dropzoneRef}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={ariaLabel ?? i18n.upload.dropzoneLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-disabled={isDisabled || undefined}
        data-dragging={isDragging || undefined}
        data-rejecting={isRejecting || undefined}
        onClick={handleDropzoneClick}
        onKeyDown={handleDropzoneKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={classNames?.dropzone}
        css={css`
          position: relative;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isFullWidth ? '100%' : 'auto'};
          min-height: ${effectiveHeight};
          padding: 24px 20px;
          border-radius: ${theme.componentRadius[radius ?? 'lg']};
          border: 1.5px dashed ${theme.colors.border.default};
          background: ${theme.colors.bg.muted};
          color: ${theme.colors.text.secondary};
          cursor: ${isDisabled || isReadOnly ? 'not-allowed' : 'pointer'};
          text-align: center;
          transition:
            background-color 220ms ease,
            border-color 220ms ease,
            color 220ms ease,
            box-shadow 220ms ease;

          /* 柔和的径向光晕底（默认很弱，drag 时增强） */
          &::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -1;
            border-radius: inherit;
            background: radial-gradient(
              ellipse at center top,
              ${theme.colors.primary.DEFAULT}0d 0%,
              transparent 60%
            );
            opacity: 0;
            transition: opacity 260ms ease;
            pointer-events: none;
          }

          &:hover:not([aria-disabled='true']) {
            border-color: ${theme.colors.primary.DEFAULT};
            color: ${theme.colors.text.primary};
          }
          &:hover:not([aria-disabled='true'])::before {
            opacity: 0.6;
          }

          &[data-dragging='true'] {
            border-style: solid;
            border-color: ${theme.colors.primary.DEFAULT};
            color: ${theme.colors.text.primary};
            box-shadow: inset 0 0 0 1px ${theme.colors.primary.DEFAULT};
          }
          &[data-dragging='true']::before {
            opacity: 1;
          }
          &[data-dragging='true'] [data-slot='dropzone-icon'] {
            transform: translateY(-6px) scale(1.06);
          }

          &[data-rejecting='true'] {
            border-style: solid;
            border-color: ${theme.colors.status.danger};
            color: ${theme.colors.status.danger};
            box-shadow: inset 0 0 0 1px ${theme.colors.status.danger};
          }
          &[data-rejecting='true']::before {
            background: radial-gradient(
              ellipse at center top,
              ${theme.colors.status.danger}14 0%,
              transparent 60%
            );
            opacity: 1;
          }

          &[aria-disabled='true'] {
            opacity: 0.55;
          }

          &:focus-visible {
            outline: none;
            border-color: ${theme.colors.focus};
            box-shadow: inset 0 0 0 1px ${theme.colors.focus};
          }

          @media (prefers-reduced-motion: reduce) {
            transition: none;
            &::before {
              transition: none;
            }
            [data-slot='dropzone-icon'] {
              transition: none;
            }
          }
        `}
      >
        {content}
      </div>
    );
  })();

  const listNode: ReactNode =
    showFileList && listPosition !== 'none' ? (
      <UploadList
        value={currentValue}
        size={size}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        onRemove={removeFile}
        onRetry={retryFile}
        renderItem={renderItem}
        emptyContent={emptyContent}
        classNames={classNames}
      />
    ) : null;

  const rootCss = useMemo(
    () => css`
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: ${isFullWidth ? '100%' : 'auto'};
    `,
    [isFullWidth],
  );

  const control = (
    <div
      className={[classNames?.root, className].filter(Boolean).join(' ') || undefined}
      style={style}
      id={id}
      data-variant={variant}
      data-size={size}
      data-disabled={isDisabled || undefined}
      data-readonly={isReadOnly || undefined}
      data-invalid={isInvalid || undefined}
      css={rootCss}
      {...rest}
    >
      {hiddenInput}
      {hiddenName}
      {listPosition === 'top' ? listNode : null}
      {triggerNode}
      {dropzoneNode}
      {listPosition === 'bottom' ? listNode : null}
      {liveRegion}
    </div>
  );

  const needsFormField =
    (label !== undefined && label !== null && label !== false) ||
    (description !== undefined && description !== null && description !== false) ||
    hasError;

  if (!needsFormField) {
    return control;
  }

  // FormField detects `typeof children.type === 'string'` as a DOM child and will inject
  // `required` / `aria-required` / `disabled` directly onto it — invalid on a <div>. So wrap
  // the control in a non-string component that accepts those props and forwards only the ones
  // that make sense on a <div>.
  return (
    <FormField
      label={label}
      description={description}
      errorMessage={errorMessage}
      isRequired={isRequired}
      isInvalid={isInvalidProp}
      isDisabled={isDisabled}
      id={id}
    >
      <UploadFormFieldShell control={control} />
    </FormField>
  );
});

interface UploadFormFieldShellProps {
  control: ReactNode;
  // FormField may inject these:
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  required?: boolean;
}

function UploadFormFieldShell(props: UploadFormFieldShellProps) {
  // We intentionally drop `isRequired` / `required` / `aria-required` since the root is a
  // <div>, not a form control. We forward `aria-describedby` so the error id links back.
  if (!props['aria-describedby'] && !props['aria-invalid'] && !props['aria-labelledby']) {
    return <>{props.control}</>;
  }
  if (!isValidElement(props.control)) return <>{props.control}</>;
  return cloneElement(props.control as ReactElement<Record<string, unknown>>, {
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
    'aria-labelledby': props['aria-labelledby'],
  });
}

(Upload as unknown as { displayName: string }).displayName = 'Upload';

const visuallyHiddenCss = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

function defaultDropzoneContent(
  i18n: ReturnType<typeof useI18n>,
  isDragging: boolean,
  isRejecting: boolean,
  accept?: string,
): ReactNode {
  const title = isRejecting
    ? i18n.upload.dropzoneHintReject
    : isDragging
      ? i18n.upload.dropzoneHintActive
      : i18n.upload.dropzoneHint;

  return (
    <span
      css={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      `}
    >
      <span
        data-slot="dropzone-icon"
        aria-hidden="true"
        css={css`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: currentColor;
          color: inherit;
          transition: transform 220ms cubic-bezier(0.32, 0.72, 0, 1);
          position: relative;

          /* 用 stroke 颜色覆盖 currentColor 的圆背景 */
          & > svg {
            color: var(--dropzone-icon-color, currentColor);
          }
          background: transparent;

          /* 半透明底盘（用 currentColor 的低透明版本）*/
          &::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: currentColor;
            opacity: 0.08;
            z-index: -1;
          }
        `}
      >
        {isRejecting ? (
          <AlertCircleIcon width={30} height={30} strokeWidth={1.6} />
        ) : (
          <CloudUploadIcon width={30} height={30} strokeWidth={1.6} />
        )}
      </span>

      <span
        css={css`
          display: flex;
          flex-direction: column;
          gap: 3px;
          line-height: 1.4;
        `}
      >
        <span
          css={css`
            font-size: 14px;
            font-weight: 600;
            color: inherit;
          `}
        >
          {title}
        </span>
        {!isRejecting ? (
          <span
            css={css`
              font-size: 12.5px;
              color: inherit;
              opacity: 0.75;
            `}
          >
            {i18n.upload.dropzoneSecondary ?? ''}
          </span>
        ) : null}
        {accept && !isDragging && !isRejecting ? (
          <span
            css={css`
              margin-top: 4px;
              font-size: 11.5px;
              font-variant-numeric: tabular-nums;
              color: inherit;
              opacity: 0.55;
              letter-spacing: 0.02em;
            `}
          >
            {accept}
          </span>
        ) : null}
      </span>
    </span>
  );
}
