/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 MenuBasicDemo（演示 onAction + sections + danger）。
 */

'use client';

import { useState } from 'react';
import { Menu, MenuItem, MenuSection, MenuDivider, Button } from '@/components/timeui-client';

export function MenuBasicDemo() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Menu
        trigger={<Button variant="bordered">Open menu</Button>}
        onAction={(key) => setLast(key)}
      >
        <MenuSection label="Account">
          <MenuItem itemKey="profile" shortcut="⌘P">
            Profile
          </MenuItem>
          <MenuItem itemKey="settings" shortcut="⌘,">
            Settings
          </MenuItem>
        </MenuSection>
        <MenuDivider />
        <MenuItem itemKey="signout" isDanger>
          Sign out
        </MenuItem>
      </Menu>
      <div
        style={{ fontSize: 12, color: 'var(--c-text-tertiary)', fontFamily: 'var(--docs-mono)' }}
      >
        last action = {last ?? '(none)'}
      </div>
    </div>
  );
}
