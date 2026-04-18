/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：Upload 自定义 renderItem（缩略图 + 自定义删除按钮）。
 */

'use client';

import { css } from '@emotion/react';
import { Upload } from '@/components/timeui-client';
import type { UploadFile } from '@timeui/react';

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function UploadCustomRenderDemo() {
  return (
    <div style={{ width: 'min(460px, 100%)' }}>
      <Upload
        multiple
        accept="image/*"
        renderItem={(file: UploadFile, actions) => (
          <li
            key={file.id}
            css={css`
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 8px 10px;
              border: 1px solid var(--c-hairline);
              border-radius: 10px;
              background: var(--c-bg);
            `}
          >
            <div
              css={css`
                width: 40px;
                height: 40px;
                border-radius: 8px;
                overflow: hidden;
                background: var(--c-bg-secondary);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex: 0 0 40px;
              `}
            >
              {file.previewUrl ? (
                <img
                  src={file.previewUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span aria-hidden>IMG</span>
              )}
            </div>
            <div
              css={css`
                flex: 1;
                min-width: 0;
              `}
            >
              <div
                css={css`
                  font-size: 13px;
                  font-weight: 500;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                `}
              >
                {file.name}
              </div>
              <div
                css={css`
                  font-size: 11px;
                  color: var(--c-text-tertiary);
                `}
              >
                {formatSize(file.size)} · {file.status}
              </div>
            </div>
            <button
              type="button"
              onClick={actions.remove}
              css={css`
                font-size: 12px;
                color: var(--c-text-tertiary);
                background: transparent;
                border: 1px solid var(--c-hairline);
                border-radius: 999px;
                padding: 4px 10px;
                cursor: pointer;
                &:hover {
                  color: var(--c-danger, #e5484d);
                  border-color: var(--c-danger, #e5484d);
                }
              `}
            >
              Remove
            </button>
          </li>
        )}
      />
    </div>
  );
}
