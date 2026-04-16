import type { ComponentPropsWithoutRef } from 'react';
import { Callout, CodeBlock, Code, Button, Flex, Stack } from '@/components/timeui-client';
import { PropsTable } from '@/components/mdx/PropsTable';
import { LiveDemo } from '@/components/mdx/LiveDemo';

type MDXComponents = Record<string, unknown>;

/**
 * MDX components. Plain h1-h6/p/a/ul/ol/li are kept as native HTML — they're
 * styled by `.mdx-article *` selectors in `globals.css`, which lets the
 * editorial typography system (Instrument Serif / Geist) flow through without
 * being overridden by `@timeui/react`'s Typography component defaults.
 *
 * Inline `<code>` still routes through TimeUI's themed Code chip.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    PropsTable,
    CodeBlock,
    LiveDemo,

    Button,
    Flex,
    Stack,

    code: (p: ComponentPropsWithoutRef<'code'>) =>
      typeof p.children === 'string' ? <Code {...p}>{p.children}</Code> : <code {...p} />,

    ...components,
  };
}
