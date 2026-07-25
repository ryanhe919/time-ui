/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 文档站用的假后端：给 Select / MultiSelect 的远程搜索示例提供
 *              带延迟、分页与关键词过滤的数据源，行为贴近真实分页接口。
 */

export interface MockUser {
  value: string;
  label: string;
  description: string;
}

const DEPARTMENTS = ['Design', 'Engineering', 'Marketing', 'Support'] as const;

const ALL_USERS: MockUser[] = Array.from({ length: 137 }, (_, i) => {
  const id = i + 1;
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]!;
  return {
    value: `u-${id}`,
    label: `User ${String(id).padStart(3, '0')}`,
    description: dept,
  };
});

export interface MockSearchArgs {
  keyword: string;
  page: number;
  pageSize: number;
  /** 附加筛选条件，演示「搜索时把参数一起发给后端」。 */
  dept?: string;
  signal?: AbortSignal;
}

export interface MockSearchResult {
  items: MockUser[];
  hasMore: boolean;
  total: number;
}

/** 模拟一次分页查询：420ms 延迟，支持中途取消。 */
export function mockUserSearch({
  keyword,
  page,
  pageSize,
  dept,
  signal,
}: MockSearchArgs): Promise<MockSearchResult> {
  const q = keyword.trim().toLowerCase();
  const matched = ALL_USERS.filter((u) => {
    if (dept && dept !== 'all' && u.description !== dept) return false;
    if (!q) return true;
    return u.label.toLowerCase().includes(q) || u.description.toLowerCase().includes(q);
  });

  const start = (page - 1) * pageSize;
  const slice = matched.slice(start, start + pageSize);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve({ items: slice, hasMore: start + pageSize < matched.length, total: matched.length });
    }, 420);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
