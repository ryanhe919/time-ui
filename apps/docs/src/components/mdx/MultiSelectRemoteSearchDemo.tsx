/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 实现文档站 MDX 示例组件 MultiSelectRemoteSearchDemo
 *              （演示多选 + 远程分页搜索 + 已选项在翻页/搜索后仍保留 label）。
 */

'use client';

import { useState } from 'react';
import { Flex, MultiSelect } from '@/components/timeui-client';

import { mockUserSearch } from '@/lib/mockUserSearch';

export function MultiSelectRemoteSearchDemo() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <Flex direction="column" gap={12}>
      <MultiSelect
        label="Reviewers"
        description="137 users on the server — loaded 20 at a time."
        placeholder="Search and pick reviewers…"
        searchPlaceholder="Search by name or team…"
        isSearchable
        isClearable
        isFullWidth
        value={value}
        onChange={setValue}
        pageSize={20}
        maxTagCount={3}
        loadOptions={async ({ keyword, page, pageSize, signal }) => {
          const res = await mockUserSearch({ keyword, page, pageSize, signal });
          return { items: res.items, hasMore: res.hasMore, total: res.total };
        }}
      />
      <code style={{ fontSize: 12, opacity: 0.7 }}>value = {JSON.stringify(value)}</code>
    </Flex>
  );
}
