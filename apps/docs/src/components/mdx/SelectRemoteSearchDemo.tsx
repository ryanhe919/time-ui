/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 实现文档站 MDX 示例组件 SelectRemoteSearchDemo
 *              （演示 loadOptions 托管远程搜索 + searchParams 联动 + 滚动分页）。
 */

'use client';

import { useState } from 'react';
import { Flex, Select } from '@/components/timeui-client';
import { mockUserSearch } from '@/lib/mockUserSearch';

const DEPTS = [
  { value: 'all', label: 'All departments' },
  { value: 'Design', label: 'Design' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Support', label: 'Support' },
];

export function SelectRemoteSearchDemo() {
  const [assignee, setAssignee] = useState('');
  const [dept, setDept] = useState('all');

  return (
    <Flex direction="column" gap={16}>
      <Select
        label="Department"
        description="Changing it re-runs the search on the server."
        items={DEPTS}
        value={dept}
        onChange={setDept}
        isFullWidth
      />

      <Select
        label="Assignee"
        description="Type to search; scroll to the bottom to load more."
        placeholder="Search users…"
        searchPlaceholder="Search by name or team…"
        isSearchable
        isFullWidth
        value={assignee}
        onChange={setAssignee}
        pageSize={20}
        searchParams={{ dept }}
        loadOptions={async ({ keyword, page, pageSize, params, signal }) => {
          const res = await mockUserSearch({
            keyword,
            page,
            pageSize,
            dept: params?.dept as string,
            signal,
          });
          return { items: res.items, hasMore: res.hasMore, total: res.total };
        }}
      />
    </Flex>
  );
}
