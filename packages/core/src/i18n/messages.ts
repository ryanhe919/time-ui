/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 i18n 模块 messages。
 */

export type Locale = 'zh' | 'en';

export interface Messages {
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
  button: {
    loadingLabel: string;
  };
  codeBlock: {
    copy: string;
    copied: string;
    copyLabel: string;
  };
  search: {
    placeholder: string;
    label: string;
  };
  pagination: {
    navLabel: string;
    prev: string;
    next: string;
    jumperLabel: string;
    sizeChangerLabel: string;
    pageLabel: string;
    pageSizeOption: string;
  };
  upload: {
    triggerLabel: string;
    triggerText: string;
    dropzoneLabel: string;
    dropzoneHint: string;
    dropzoneSecondary: string;
    dropzoneHintActive: string;
    dropzoneHintReject: string;
    rejectByType: string;
    rejectBySize: string;
    rejectByCount: string;
    rejectByDuplicate: string;
    rejectByBeforeUpload: string;
    removeLabel: string;
    retryLabel: string;
    clearLabel: string;
    statusReady: string;
    statusUploading: string;
    statusSuccess: string;
    statusError: string;
    liveAdded: string;
    liveRejected: string;
    liveSuccess: string;
    liveError: string;
    liveRemoved: string;
  };
  statCard: {
    loading: string;
    deltaUp: string;
    deltaDown: string;
    deltaFlat: string;
    directionUp: string;
    directionDown: string;
    directionFlat: string;
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
  pagination: {
    navLabel: '分页',
    prev: '上一页',
    next: '下一页',
    jumperLabel: '跳至页码',
    sizeChangerLabel: '每页条数',
    pageLabel: '第 {page} 页',
    pageSizeOption: '{pageSize} 条/页',
  },
  upload: {
    triggerLabel: '选择文件',
    triggerText: '选择文件',
    dropzoneLabel: '文件上传区，按 Enter 或 Space 选择文件',
    dropzoneHint: '拖拽文件到此处',
    dropzoneSecondary: '或点击选择文件',
    dropzoneHintActive: '松开以添加文件',
    dropzoneHintReject: '不支持的文件类型',
    rejectByType: '{name} 的类型不被支持',
    rejectBySize: '{name} 超过大小限制',
    rejectByCount: '最多只能上传 {max} 个文件',
    rejectByDuplicate: '{name} 已存在',
    rejectByBeforeUpload: '{name} 被拦截',
    removeLabel: '删除',
    retryLabel: '重试',
    clearLabel: '清空',
    statusReady: '待上传',
    statusUploading: '上传中',
    statusSuccess: '已上传',
    statusError: '上传失败',
    liveAdded: '已添加 {count} 个文件',
    liveRejected: '已拒绝 {count} 个文件',
    liveSuccess: '{name} 上传成功',
    liveError: '{name} 上传失败',
    liveRemoved: '{name} 已删除',
  },
  statCard: {
    loading: '加载中',
    deltaUp: '上升 {value}',
    deltaDown: '下降 {value}',
    deltaFlat: '持平 {value}',
    directionUp: '上升',
    directionDown: '下降',
    directionFlat: '持平',
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
  pagination: {
    navLabel: 'Pagination',
    prev: 'Previous page',
    next: 'Next page',
    jumperLabel: 'Go to page',
    sizeChangerLabel: 'Items per page',
    pageLabel: 'Page {page}',
    pageSizeOption: '{pageSize} / page',
  },
  upload: {
    triggerLabel: 'Choose file',
    triggerText: 'Choose file',
    dropzoneLabel: 'File upload area, press Enter or Space to choose files',
    dropzoneHint: 'Drag files here',
    dropzoneSecondary: 'or click to browse',
    dropzoneHintActive: 'Release to add files',
    dropzoneHintReject: 'File type not supported',
    rejectByType: '{name} has an unsupported file type',
    rejectBySize: '{name} exceeds the size limit',
    rejectByCount: 'You can upload at most {max} files',
    rejectByDuplicate: '{name} already exists',
    rejectByBeforeUpload: '{name} was rejected',
    removeLabel: 'Remove',
    retryLabel: 'Retry',
    clearLabel: 'Clear',
    statusReady: 'Ready',
    statusUploading: 'Uploading',
    statusSuccess: 'Uploaded',
    statusError: 'Failed',
    liveAdded: 'Added {count} file(s)',
    liveRejected: 'Rejected {count} file(s)',
    liveSuccess: '{name} uploaded successfully',
    liveError: '{name} failed to upload',
    liveRemoved: '{name} removed',
  },
  statCard: {
    loading: 'Loading',
    deltaUp: 'Up {value}',
    deltaDown: 'Down {value}',
    deltaFlat: 'Flat {value}',
    directionUp: 'up',
    directionDown: 'down',
    directionFlat: 'flat',
  },
};

export const messages: Record<Locale, Messages> = { zh, en };

export const defaultLocale: Locale = 'zh';
