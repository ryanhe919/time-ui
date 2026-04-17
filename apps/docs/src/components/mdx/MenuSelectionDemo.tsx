/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 MenuSelectionDemo（multiple selection 受控）。
 */

'use client';

import { useState } from 'react';
import { Menu, MenuItem, Button } from '@/components/timeui-client';

export function MenuSelectionDemo() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['inbox', 'starred']));
  const sortedLabel = selected.size === 0 ? '(none)' : Array.from(selected).sort().join(', ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Menu
        trigger={<Button variant="bordered">Show columns</Button>}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        <MenuItem itemKey="inbox">Inbox</MenuItem>
        <MenuItem itemKey="starred">Starred</MenuItem>
        <MenuItem itemKey="snoozed">Snoozed</MenuItem>
        <MenuItem itemKey="sent">Sent</MenuItem>
        <MenuItem itemKey="drafts">Drafts</MenuItem>
      </Menu>
      <div
        style={{ fontSize: 12, color: 'var(--c-text-tertiary)', fontFamily: 'var(--docs-mono)' }}
      >
        selected = {sortedLabel}
      </div>
    </div>
  );
}
