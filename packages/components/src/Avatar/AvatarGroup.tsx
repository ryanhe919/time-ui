/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 AvatarGroup 组件：堆叠显示多个 Avatar 并支持折叠 +N。
 */

'use client';

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { Avatar } from './Avatar';
import type { AvatarGroupProps, AvatarGroupSpacing, AvatarProps, AvatarSize } from './Avatar.types';

const NAMED_SIZES: ReadonlyArray<AvatarSize> = ['xs', 'sm', 'md', 'lg', 'xl'];

const SPACING_MULTIPLIER: Record<AvatarGroupSpacing, number> = {
  tight: 1.5,
  normal: 1,
  loose: 0.4,
};

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { max, total, size, spacing = 'normal', renderSurplus, children, className },
  ref,
) {
  const theme = useTheme();
  const rawChildren = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<AvatarProps>[];
  const totalCount = total ?? rawChildren.length;

  const visible = typeof max === 'number' && max >= 0 ? rawChildren.slice(0, max) : rawChildren;
  const surplus = Math.max(0, totalCount - visible.length);

  const baseOverlap = parseFloat(theme.components.avatar.groupOverlap); // negative
  const ml = `${baseOverlap * SPACING_MULTIPLIER[spacing]}px`;

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Avatar group"
      data-spacing={spacing}
      className={className}
      css={css`
        display: inline-flex;
        align-items: center;
        & > *:not(:first-of-type) {
          margin-left: ${ml};
        }
      `}
    >
      {visible.map((child, idx) => {
        const childProps = child.props as AvatarProps;
        return cloneElement(child, {
          key: child.key ?? idx,
          isBordered: childProps.isBordered ?? true,
          size: childProps.size ?? size,
        });
      })}
      {surplus > 0 ? (
        <SurplusItem surplus={surplus} size={size} renderSurplus={renderSurplus} />
      ) : null}
    </div>
  );
});

(AvatarGroup as unknown as { displayName: string }).displayName = 'TimeUI.AvatarGroup';

const SurplusItem = ({
  surplus,
  size,
  renderSurplus,
}: {
  surplus: number;
  size?: AvatarProps['size'];
  renderSurplus?: (count: number) => ReactNode;
}) => {
  const theme = useTheme();
  if (renderSurplus) {
    return <>{renderSurplus(surplus)}</>;
  }
  const isNamed = typeof size === 'string' && (NAMED_SIZES as ReadonlyArray<string>).includes(size);
  const sizeKey: AvatarSize = isNamed ? (size as AvatarSize) : 'md';
  const fontSize =
    typeof size === 'number'
      ? `${Math.max(10, Math.round(size * 0.36))}px`
      : theme.components.avatarSize[sizeKey].fontSize;
  return (
    <Avatar
      size={size}
      color="neutral"
      alt={`${surplus} more`}
      isBordered
      fallbackIcon={
        <span
          css={css`
            font-size: ${fontSize};
            font-weight: ${theme.components.avatar.fallbackFontWeight};
            line-height: 1;
          `}
        >
          {`+${surplus}`}
        </span>
      }
    />
  );
};

(SurplusItem as unknown as { displayName: string }).displayName = 'TimeUI.AvatarGroup.Surplus';
