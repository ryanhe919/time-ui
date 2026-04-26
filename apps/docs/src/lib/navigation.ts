/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 navigation 基础能力。支持 section 内按 group 分类渲染。
 */

export interface NavItem {
  slug: string;
  href: string;
}
export interface NavGroup {
  slug: string;
  items: NavItem[];
}
export interface NavSection {
  slug: string;
  /** 平铺的全部页面，TopNav 用它取首页跳转。 */
  items: NavItem[];
  /** 可选：用于 Sidebar 的小标题分组。未提供时按 `items` 平铺渲染。 */
  groups?: NavGroup[];
}
export interface Navigation {
  sections: NavSection[];
}

interface SectionConfig {
  slug: string;
  pages?: readonly string[];
  groups?: readonly { slug: string; pages: readonly string[] }[];
}

const SECTIONS: readonly SectionConfig[] = [
  { slug: 'getting-started', pages: ['introduction', 'installation', 'mcp'] },
  {
    slug: 'chat',
    pages: ['overview', 'composer', 'markdown', 'api'],
  },
  {
    slug: 'components',
    groups: [
      {
        slug: 'general',
        pages: ['button', 'typography'],
      },
      {
        slug: 'layout',
        pages: ['layout'],
      },
      {
        slug: 'forms',
        pages: [
          'form-field',
          'input',
          'textarea',
          'select',
          'search',
          'checkbox',
          'radio',
          'switch',
          'slider',
          'segmented-control',
          'date-picker',
          'date-time-picker',
          'upload',
          'rich-text-editor',
          'code-editor',
        ],
      },
      {
        slug: 'data-display',
        pages: [
          'table',
          'avatar',
          'tag',
          'badge',
          'code-block',
          'card',
          'stat-card',
          'pdf-viewer',
          'markdown-viewer',
        ],
      },
      {
        slug: 'feedback',
        pages: ['callout', 'toast', 'empty', 'skeleton'],
      },
      {
        slug: 'overlays',
        pages: ['popover', 'tooltip', 'modal', 'drawer', 'menu'],
      },
      {
        slug: 'navigation',
        pages: ['tabs', 'pagination', 'steps'],
      },
    ],
  },
];

export function getNavigation(locale: string): Navigation {
  return {
    sections: SECTIONS.map((section) => {
      const toItem = (slug: string): NavItem => ({
        slug,
        href: `/${locale}/docs/${section.slug}/${slug}`,
      });

      if (section.groups) {
        const groups: NavGroup[] = section.groups.map((g) => ({
          slug: g.slug,
          items: g.pages.map(toItem),
        }));
        return {
          slug: section.slug,
          items: groups.flatMap((g) => g.items),
          groups,
        };
      }

      return {
        slug: section.slug,
        items: (section.pages ?? []).map(toItem),
      };
    }),
  };
}
