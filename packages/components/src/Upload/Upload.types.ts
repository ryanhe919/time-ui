/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 定义 Upload 模块的 TypeScript 类型约束。
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type UploadFileStatus = 'ready' | 'uploading' | 'success' | 'error' | 'removed';

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: UploadFileStatus;
  percent?: number;
  file?: File;
  previewUrl?: string;
  response?: unknown;
  error?: Error;
}

export type UploadRejectReason = 'accept' | 'size' | 'count' | 'duplicate' | 'before-upload';

export interface UploadRejection {
  file: File;
  reason: UploadRejectReason;
  message?: string;
}

export interface UploadRequestHandlers {
  onProgress: (percent: number) => void;
  onSuccess: (response?: unknown) => void;
  onError: (error: Error) => void;
}

export interface UploadRequestArgs {
  file: File;
  uploadFile: Readonly<UploadFile>;
  signal: AbortSignal;
}

export type UploadRequest = (
  args: UploadRequestArgs,
  handlers: UploadRequestHandlers,
) => void | Promise<void> | (() => void);

export type UploadVariant = 'button' | 'dropzone';
export type UploadSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type UploadColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type UploadRadius = 'sm' | 'md' | 'lg' | 'full';
export type UploadListPosition = 'bottom' | 'top' | 'none';

export interface UploadChangeMeta {
  trigger: 'add' | 'update' | 'remove' | 'reset';
  file?: UploadFile;
}

export interface UploadHandle {
  open: () => void;
  submit: (ids?: string[]) => void;
  retry: (id: string) => void;
  abort: (id: string) => void;
  clear: () => void;
}

export interface UploadClassNames {
  root?: string;
  trigger?: string;
  dropzone?: string;
  list?: string;
  item?: string;
  itemName?: string;
  itemSize?: string;
  itemProgress?: string;
  itemActions?: string;
  removeButton?: string;
  retryButton?: string;
}

type StrippedNativeKeys =
  | 'onChange'
  | 'onDrop'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onDragOver'
  | 'children'
  | 'defaultValue';

export interface UploadProps extends Omit<HTMLAttributes<HTMLDivElement>, StrippedNativeKeys> {
  value?: UploadFile[];
  defaultValue?: UploadFile[];
  onChange?: (value: UploadFile[], meta: UploadChangeMeta) => void;

  variant?: UploadVariant;
  size?: UploadSize;
  color?: UploadColor;
  radius?: UploadRadius;
  isFullWidth?: boolean;

  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxCount?: number;
  isDisabled?: boolean;
  isReadOnly?: boolean;

  customRequest?: UploadRequest;
  concurrency?: number;
  isAutoUpload?: boolean;

  beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<boolean>;
  onReject?: (rejections: UploadRejection[]) => void;
  onRemove?: (file: UploadFile) => boolean | Promise<boolean> | void;
  allowDuplicates?: boolean;

  trigger?: ReactNode;
  dropzoneContent?:
    | ReactNode
    | ((state: { isDragging: boolean; isRejecting: boolean }) => ReactNode);
  showFileList?: boolean;
  renderItem?: (file: UploadFile, actions: { remove: () => void; retry: () => void }) => ReactNode;
  emptyContent?: ReactNode;
  listPosition?: UploadListPosition;

  onUploadProgress?: (file: UploadFile, percent: number) => void;
  onUploadComplete?: (value: UploadFile[]) => void;

  dropzoneHeight?: number | string;
  disableClickToUpload?: boolean;
  disableDragAndDrop?: boolean;

  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id?: string;

  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  name?: string;

  className?: string;
  style?: CSSProperties;
  classNames?: UploadClassNames;
}

export interface UploadListProps extends HTMLAttributes<HTMLUListElement> {
  value: UploadFile[];
  onRemove?: (file: UploadFile) => void;
  onRetry?: (file: UploadFile) => void;
  renderItem?: (file: UploadFile, actions: { remove: () => void; retry: () => void }) => ReactNode;
  size?: UploadSize;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  emptyContent?: ReactNode;
  classNames?: UploadClassNames;
}

export interface UploadItemProps extends HTMLAttributes<HTMLLIElement> {
  file: UploadFile;
  onRemove?: (file: UploadFile) => void;
  onRetry?: (file: UploadFile) => void;
  size?: UploadSize;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  classNames?: UploadClassNames;
}
