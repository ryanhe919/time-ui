/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Upload 组件族内部使用的图标集合。inline SVG，跟随 currentColor，
 *   避免把整个 @timeui/icons 依赖拖进来（该包目前只覆盖通用 10 个）。
 *   所有图标 24×24 viewBox、1.5 stroke-width，与 TimeUI 既有 icon 规格一致。
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const BASE_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
} as const;

export function CloudUploadIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M7 19a4 4 0 0 1-.88-7.9 5.5 5.5 0 0 1 10.77-1.6 4.5 4.5 0 0 1 1 8.9" />
      <path d="M12 12v7" />
      <path d="m8.5 15.5 3.5-3.5 3.5 3.5" />
    </svg>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <circle cx="12" cy="16" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function ArrowUpTrayIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M12 4v12" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M5 7 6 20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function RotateCwIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M21 12a9 9 0 1 1-3.2-6.9" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  // 四分之三圆弧 + 旋转动画（使用内联 style，便于外部覆盖）
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}

export function FileGenericIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export function FileImageIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <circle cx="10" cy="13" r="1.4" />
      <path d="m7 18 3-3 3 3 3-4 3 4" />
    </svg>
  );
}

export function FileVideoIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="m10 13 4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FileAudioIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 17v-4l4-1v4" />
      <circle cx="8.5" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FileArchiveIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M10 12h1v1h-1z" fill="currentColor" stroke="none" />
      <path d="M11 14h1v1h-1z" fill="currentColor" stroke="none" />
      <path d="M10 16h1v1h-1z" fill="currentColor" stroke="none" />
      <path d="M11 18h1v1h-1z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 16h6" />
      <path d="M9 10h2" />
    </svg>
  );
}

export function FileCodeIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 13 2 2-2 2" />
    </svg>
  );
}

/** 按 MIME / 扩展名挑选最合适的文件图标。 */
export function pickFileIcon(mime: string, name: string): (props: IconProps) => JSX.Element {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  if (mime.startsWith('image/')) return FileImageIcon;
  if (mime.startsWith('video/')) return FileVideoIcon;
  if (mime.startsWith('audio/')) return FileAudioIcon;
  if (
    mime === 'application/zip' ||
    mime === 'application/x-tar' ||
    mime === 'application/x-7z-compressed' ||
    mime === 'application/x-rar-compressed' ||
    mime === 'application/gzip' ||
    ['zip', 'tar', 'gz', '7z', 'rar', 'bz2', 'xz'].includes(ext)
  ) {
    return FileArchiveIcon;
  }
  if (
    mime.startsWith('text/') ||
    mime === 'application/pdf' ||
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ['txt', 'md', 'rtf', 'pdf', 'doc', 'docx'].includes(ext)
  ) {
    return FileTextIcon;
  }
  if (
    mime === 'application/json' ||
    mime === 'application/javascript' ||
    mime === 'application/xml' ||
    [
      'js',
      'ts',
      'tsx',
      'jsx',
      'json',
      'xml',
      'html',
      'css',
      'scss',
      'py',
      'rs',
      'go',
      'c',
      'cc',
      'cpp',
      'h',
      'hpp',
      'java',
      'kt',
      'swift',
      'rb',
      'php',
      'sh',
      'yml',
      'yaml',
      'toml',
    ].includes(ext)
  ) {
    return FileCodeIcon;
  }
  return FileGenericIcon;
}
