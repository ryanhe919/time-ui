export interface NavItem {
  /** Directory slug — consumers resolve display title via locale messages. */
  slug: string;
  /** Fully-qualified URL path. */
  href: string;
}
export interface NavSection {
  /** Directory slug for the section. */
  slug: string;
  items: NavItem[];
}
export interface Navigation {
  sections: NavSection[];
}

/**
 * Statically declared site navigation. Matches the directory structure under
 * `src/app/[locale]/docs/` but avoids doing an `fs.readdir` against the Next
 * bundle's opaque cwd at request time.
 *
 * Adding a new page means:
 *   1) create `src/app/[locale]/docs/<section>/<page>/{zh,en}.mdx + page.tsx`
 *   2) add its slug here
 *   3) add i18n titles under `docs-i18n.ts#sections` / `#pages`
 */
const SECTIONS: readonly { slug: string; pages: readonly string[] }[] = [
  { slug: 'getting-started', pages: ['introduction', 'installation'] },
  { slug: 'components', pages: ['button', 'callout', 'code-block', 'search'] },
];

export function getNavigation(locale: string): Navigation {
  return {
    sections: SECTIONS.map(({ slug, pages }) => ({
      slug,
      items: pages.map((p) => ({
        slug: p,
        href: `/${locale}/docs/${slug}/${p}`,
      })),
    })),
  };
}
