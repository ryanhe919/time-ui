/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Upload 模块的同步校验与模板插值工具。
 */

import type { UploadFile, UploadRejectReason } from './Upload.types';

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const patterns = accept
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  for (const p of patterns) {
    if (!p) continue;
    if (p.startsWith('.')) {
      if (name.endsWith(p)) return true;
      continue;
    }
    if (p.endsWith('/*')) {
      const prefix = p.slice(0, -1);
      if (type.startsWith(prefix)) return true;
      continue;
    }
    if (type === p) return true;
  }
  return false;
}

export interface SyncValidateContext {
  accept?: string;
  maxSize?: number;
  maxCount?: number;
  allowDuplicates?: boolean;
  currentActive: UploadFile[];
}

export interface SyncValidationResult {
  accepted: File[];
  rejections: Array<{ file: File; reason: UploadRejectReason }>;
}

function isDuplicate(file: File, list: UploadFile[]): boolean {
  return list.some((u) => u.status !== 'removed' && u.name === file.name && u.size === file.size);
}

export function validateFiles(incoming: File[], ctx: SyncValidateContext): SyncValidationResult {
  const accepted: File[] = [];
  const rejections: Array<{ file: File; reason: UploadRejectReason }> = [];
  const activeCount = ctx.currentActive.filter((f) => f.status !== 'removed').length;
  const maxCount = ctx.maxCount ?? Infinity;
  const maxSize = ctx.maxSize ?? Infinity;
  const allowDup = ctx.allowDuplicates ?? true;

  let projectedCount = activeCount;
  const projectedList: UploadFile[] = [...ctx.currentActive];

  for (const file of incoming) {
    if (!matchesAccept(file, ctx.accept)) {
      rejections.push({ file, reason: 'accept' });
      continue;
    }
    if (file.size > maxSize) {
      rejections.push({ file, reason: 'size' });
      continue;
    }
    if (!allowDup && isDuplicate(file, projectedList)) {
      rejections.push({ file, reason: 'duplicate' });
      continue;
    }
    if (projectedCount >= maxCount) {
      rejections.push({ file, reason: 'count' });
      continue;
    }
    accepted.push(file);
    projectedCount += 1;
    projectedList.push({
      id: '__projected__',
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ready',
    });
  }

  return { accepted, rejections };
}
