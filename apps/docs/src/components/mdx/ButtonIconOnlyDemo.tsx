/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description 实现文档站 MDX 示例组件 ButtonIconOnlyDemo（icon-only 按钮：尺寸 / 变体 / pill）。
 */

'use client';

import { css } from '@emotion/react';
import { Button } from '@timeui/react';

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

const XIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden {...stroke}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden {...stroke}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const SearchIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden {...stroke}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden {...stroke}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const MenuIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden {...stroke}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

const HeartIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden {...stroke}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const row = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const stack = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export function ButtonIconOnlyDemo() {
  return (
    <div css={stack}>
      <div css={row}>
        <Button isIconOnly size="xs" color="primary" aria-label="Close (xs)">
          <XIcon />
        </Button>
        <Button isIconOnly size="sm" color="primary" aria-label="Close (sm)">
          <XIcon />
        </Button>
        <Button isIconOnly size="md" color="primary" aria-label="Close (md)">
          <XIcon />
        </Button>
        <Button isIconOnly size="lg" color="primary" aria-label="Close (lg)">
          <XIcon />
        </Button>
        <Button isIconOnly size="xl" color="primary" aria-label="Close (xl)">
          <XIcon />
        </Button>
      </div>

      <div css={row}>
        <Button isIconOnly variant="solid" color="primary" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button isIconOnly variant="bordered" color="default" aria-label="Search">
          <SearchIcon />
        </Button>
        <Button isIconOnly variant="light" color="default" aria-label="Menu">
          <MenuIcon />
        </Button>
        <Button isIconOnly variant="flat" color="secondary" aria-label="Settings">
          <SettingsIcon />
        </Button>
        <Button isIconOnly variant="faded" color="default" aria-label="Like">
          <HeartIcon />
        </Button>
        <Button isIconOnly variant="shadow" color="danger" aria-label="Delete">
          <XIcon />
        </Button>
        <Button isIconOnly variant="ghost" color="success" aria-label="Confirm add">
          <PlusIcon />
        </Button>
      </div>

      <div css={row}>
        <Button isIconOnly radius="full" color="primary" aria-label="Add (pill xs)" size="xs">
          <PlusIcon />
        </Button>
        <Button isIconOnly radius="full" color="primary" aria-label="Add (pill sm)" size="sm">
          <PlusIcon />
        </Button>
        <Button isIconOnly radius="full" color="primary" aria-label="Add (pill md)" size="md">
          <PlusIcon />
        </Button>
        <Button
          isIconOnly
          radius="full"
          variant="shadow"
          color="primary"
          aria-label="FAB"
          size="lg"
        >
          <PlusIcon />
        </Button>
        <Button
          isIconOnly
          radius="full"
          variant="bordered"
          color="default"
          aria-label="Like (pill)"
        >
          <HeartIcon />
        </Button>
      </div>
    </div>
  );
}
