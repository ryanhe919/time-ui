/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Upload 文件列表容器，可独立复用。
 */

import { forwardRef, type ReactNode } from 'react';
import { useTheme, css } from '@emotion/react';
import type { UploadListProps } from './Upload.types';
import { UploadItem } from './UploadItem';

export const UploadList = forwardRef<HTMLUListElement, UploadListProps>(function UploadList(
  {
    value,
    onRemove,
    onRetry,
    renderItem,
    size = 'md',
    isDisabled = false,
    isReadOnly = false,
    emptyContent,
    classNames,
    className,
    style,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const active = value.filter((f) => f.status !== 'removed');

  if (active.length === 0 && emptyContent !== undefined && emptyContent !== null) {
    return (
      <div
        className={classNames?.list}
        css={css`
          color: ${theme.colors.text.secondary};
          font-size: 13px;
        `}
      >
        {emptyContent as ReactNode}
      </div>
    );
  }

  return (
    <ul
      ref={ref}
      className={[classNames?.list, className].filter(Boolean).join(' ') || undefined}
      style={style}
      css={css`
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      `}
      {...rest}
    >
      {active.map((file) => {
        if (renderItem) {
          return (
            <li key={file.id}>
              {renderItem(file, {
                remove: () => onRemove?.(file),
                retry: () => onRetry?.(file),
              })}
            </li>
          );
        }
        return (
          <UploadItem
            key={file.id}
            file={file}
            size={size}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            onRemove={onRemove}
            onRetry={onRetry}
            classNames={classNames}
          />
        );
      })}
    </ul>
  );
});

(UploadList as unknown as { displayName: string }).displayName = 'UploadList';
