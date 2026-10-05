/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Tag 组件：支持 solid/soft/outline 三档 variant 与可选关闭 / 交互态。
 */

'use client';

import { forwardRef, useId, type MouseEvent, type ReactElement } from 'react';
import { css, useTheme } from '@emotion/react';
import type { TagColor, TagProps, TagVariant } from './Tag.types';

function colorKey(
  color: TagColor,
): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  return color === 'neutral' ? 'default' : color;
}

const CloseIcon = ({ size }: { size: number }) => (
  <svg
    aria-hidden
    viewBox="0 0 12 12"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3l6 6M9 3l-6 6" />
  </svg>
);

export const Tag = forwardRef<HTMLElement, TagProps>(function Tag(props, ref) {
  const {
    color = 'neutral',
    variant = 'soft',
    size = 'md',
    shape = 'rounded',
    isClosable = false,
    isDisabled = false,
    isInteractive = false,
    startContent,
    endContent,
    onClose,
    onPress,
    children,
    className,
    'aria-label': ariaLabel,
    closeButtonTabIndex = 0,
    closeButtonAriaLabel = 'Remove',
  } = props;

  const theme = useTheme();
  const palette = theme.colors[colorKey(color)];
  const sizeTokens = theme.components.tagSize[size];
  const tag = theme.components.tag;
  const focusColor = theme.colors.focus;
  const duration = tag.transitionDuration;

  let bg = 'transparent';
  let fg: string = palette.DEFAULT;
  let border = '0 solid transparent';

  switch (variant as TagVariant) {
    case 'solid':
      bg = palette[500] ?? palette.DEFAULT;
      fg = palette.foreground ?? theme.colors.text.primary;
      break;
    case 'soft':
      bg = palette[100] ?? palette.DEFAULT;
      fg = palette[600] ?? palette.DEFAULT;
      break;
    case 'outline':
      bg = 'transparent';
      fg = palette[500] ?? palette.DEFAULT;
      border = `${tag.outlineBorderWidth} solid ${palette[500] ?? palette.DEFAULT}`;
      break;
  }

  const radius = shape === 'pill' ? tag.pillRadius : sizeTokens.radius;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');

  const handleClose = (e: MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    onClose?.(e);
  };

  const canPress = isInteractive && !isDisabled;
  const renderAsButton = canPress && !isClosable;
  const Comp = (renderAsButton ? 'button' : 'span') as 'button' | 'span';

  const content = (
    <>
      {startContent ? (
        <span
          aria-hidden
          css={css`
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: ${sizeTokens.iconSize};
            line-height: 1;
          `}
        >
          {startContent}
        </span>
      ) : null}
      {children != null ? <span>{children}</span> : null}
      {endContent ? (
        <span
          aria-hidden
          css={css`
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: ${sizeTokens.iconSize};
            line-height: 1;
          `}
        >
          {endContent}
        </span>
      ) : null}
    </>
  );

  return (
    <Comp
      ref={ref as never}
      id={`timeui-tag-${safeAutoId}`}
      type={renderAsButton ? 'button' : undefined}
      onClick={renderAsButton ? () => onPress?.() : undefined}
      disabled={renderAsButton ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-label={canPress && isClosable ? undefined : ariaLabel}
      data-color={color}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-interactive={isInteractive || undefined}
      data-disabled={isDisabled || undefined}
      className={className}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: ${sizeTokens.gap};
        box-sizing: border-box;
        height: ${sizeTokens.height};
        padding: 0 ${sizeTokens.paddingX};
        border-radius: ${radius};
        background-color: ${bg};
        color: ${fg};
        border: ${border};
        font-family: inherit;
        font-size: ${sizeTokens.fontSize};
        line-height: 1;
        font-weight: ${tag.fontWeight};
        white-space: nowrap;
        user-select: none;
        vertical-align: middle;
        cursor: ${isDisabled ? 'not-allowed' : canPress ? 'pointer' : 'default'};
        transition:
          background-color ${duration},
          color ${duration},
          border-color ${duration},
          opacity ${duration};

        &:hover {
          opacity: ${canPress ? tag.hoverOpacity : 1};
        }
        &:active {
          opacity: ${canPress ? tag.activeOpacity : 1};
        }

        &:focus-visible {
          outline: 2px solid ${focusColor};
          outline-offset: 2px;
        }

        &[data-disabled='true'] {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
      `}
    >
      {canPress && isClosable ? (
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={() => onPress?.()}
          css={css`
            display: inline-flex;
            align-items: center;
            gap: ${sizeTokens.gap};
            padding: 0;
            border: 0;
            background: transparent;
            color: inherit;
            font: inherit;
            line-height: inherit;
            cursor: pointer;
            border-radius: inherit;
            &:focus-visible {
              outline: 2px solid ${focusColor};
              outline-offset: 2px;
            }
          `}
        >
          {content}
        </button>
      ) : (
        content
      )}
      {isClosable ? (
        <button
          type="button"
          aria-label={closeButtonAriaLabel}
          tabIndex={closeButtonTabIndex}
          disabled={isDisabled}
          onClick={handleClose}
          data-testid="tag-close"
          css={css`
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${sizeTokens.closeSize};
            height: ${sizeTokens.closeSize};
            padding: 0;
            margin-left: 2px;
            border: 0;
            background: transparent;
            color: inherit;
            border-radius: ${tag.closeButtonRadius};
            cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
            opacity: 0.7;
            transition:
              opacity ${duration},
              background-color ${duration};

            &:hover {
              opacity: 1;
              background-color: rgba(0, 0, 0, 0.08);
            }
            &:focus-visible {
              outline: 2px solid ${focusColor};
              outline-offset: 1px;
            }
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
          `}
        >
          <CloseIcon size={parseFloat(sizeTokens.closeSize) - 2} />
        </button>
      ) : null}
    </Comp>
  );
}) as <T extends HTMLElement = HTMLElement>(
  props: TagProps & { ref?: React.Ref<T> },
) => ReactElement;

(Tag as unknown as { displayName: string }).displayName = 'TimeUI.Tag';
