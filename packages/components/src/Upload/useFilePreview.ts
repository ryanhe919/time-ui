/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 管理 Upload 模块里 ObjectURL 的生命周期。
 */

import { useEffect, useRef } from 'react';
import type { UploadFile } from './Upload.types';

function hasObjectURL(): boolean {
  return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
}

/**
 * 根据当前 value diff 维护 previewUrl：
 *  - value 中新出现且有 file 的 image 项 → 创建 ObjectURL。
 *  - value 中消失的 id → 吊销对应 URL。
 *  - 组件卸载 → 全部吊销。
 *
 * 返回 id → previewUrl 的只读 map（可用 Map.get）。
 */
export function useFilePreview(value: UploadFile[]): Map<string, string> {
  const mapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!hasObjectURL()) return;
    const current = mapRef.current;
    const seen = new Set<string>();

    for (const item of value) {
      seen.add(item.id);
      if (current.has(item.id)) continue;
      if (!item.file) continue;
      if (!item.type || !item.type.startsWith('image/')) continue;
      try {
        const url = URL.createObjectURL(item.file);
        current.set(item.id, url);
      } catch {
        // 静默：浏览器不支持或 file 不可读
      }
    }

    for (const [id, url] of current) {
      if (!seen.has(id)) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // 忽略
        }
        current.delete(id);
      }
    }
  }, [value]);

  useEffect(() => {
    const current = mapRef.current;
    return () => {
      if (!hasObjectURL()) return;
      for (const url of current.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // 忽略
        }
      }
      current.clear();
    };
  }, []);

  return mapRef.current;
}
