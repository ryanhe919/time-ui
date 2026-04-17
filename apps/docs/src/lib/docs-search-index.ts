/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 把 navigation + i18n 平铺成 SearchDialog 可用的搜索索引。
 */

import type { ReactNode } from 'react';
import type { Locale } from '@timeui/react';
import type { SearchDialogItem } from '@timeui/react';
import type { Navigation } from './navigation';
import { getDocsMessages } from './docs-i18n';

/** 每条索引会附带 href，供 TopNav 在 onSelect 时跳转。 */
export interface DocsSearchItem extends SearchDialogItem {
  href: string;
  /** 顶级 section（用作 sectionId 显示，如 "组件" / "AI 对话"）。 */
  section: string;
  /** 二级分组（forms / general），可选。 */
  group?: string;
}

/** 顶层每个 section 的图标（emoji 简洁，跨平台稳定）。 */
const SECTION_ICON: Record<string, string> = {
  'getting-started': '🚀',
  chat: '💬',
  components: '🧩',
};

/** 把 navigation + i18n 展开成可搜索的页面索引。 */
export function buildDocsSearchIndex(navigation: Navigation, locale: Locale): DocsSearchItem[] {
  const messages = getDocsMessages(locale);
  const items: DocsSearchItem[] = [];

  for (const section of navigation.sections) {
    const sectionLabel = messages.sections[section.slug] ?? section.slug;
    const sectionIcon: ReactNode = SECTION_ICON[section.slug] ?? '📄';

    if (section.groups) {
      for (const group of section.groups) {
        const groupLabel = messages.groups[group.slug] ?? group.slug;
        for (const item of group.items) {
          const pageLabel = messages.pages[item.slug] ?? item.slug;
          items.push({
            id: item.href,
            href: item.href,
            label: pageLabel,
            // 把"section · group"放到 hint 里，便于辨识
            hint: `${sectionLabel} · ${groupLabel}`,
            icon: sectionIcon,
            section: sectionLabel,
            group: groupLabel,
          });
        }
      }
    } else {
      for (const item of section.items) {
        const pageLabel = messages.pages[item.slug] ?? item.slug;
        items.push({
          id: item.href,
          href: item.href,
          label: pageLabel,
          hint: sectionLabel,
          icon: sectionIcon,
          section: sectionLabel,
        });
      }
    }
  }

  return items;
}
