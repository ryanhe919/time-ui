/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description StatCard 内部使用的 delta 方向箭头图标。
 *   所有图标用 currentColor stroke，12×12 viewBox，保持在 delta pill 内的紧凑比例。
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const BASE_PROPS = {
  width: 10,
  height: 10,
  viewBox: '0 0 12 12',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
} as const;

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M6 10V2" />
      <path d="M2.5 5.5L6 2L9.5 5.5" />
    </svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M6 2V10" />
      <path d="M2.5 6.5L6 10L9.5 6.5" />
    </svg>
  );
}

export function FlatIcon(props: IconProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M2.5 6H9.5" />
    </svg>
  );
}
