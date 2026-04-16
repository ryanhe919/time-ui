import type { ComponentPropsWithoutRef } from 'react';
import {
  Callout,
  CodeBlock,
  Code,
  Button,
  Flex,
  Stack,
  FormField,
  Input,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Switch,
  Select,
  SelectOption,
} from '@/components/timeui-client';
import { PropsTable } from '@/components/mdx/PropsTable';
import { LiveDemo } from '@/components/mdx/LiveDemo';
import { SearchDialogDemo } from '@/components/mdx/SearchDialogDemo';
import { InputFormDemo } from '@/components/mdx/InputFormDemo';
import { TextareaDemo } from '@/components/mdx/TextareaDemo';
import { CheckboxGroupDemo } from '@/components/mdx/CheckboxGroupDemo';
import { RadioGroupDemo } from '@/components/mdx/RadioGroupDemo';
import { SwitchSettingsDemo } from '@/components/mdx/SwitchSettingsDemo';
import { SelectDemo } from '@/components/mdx/SelectDemo';
import { CodeBlockOnCopyDemo } from '@/components/mdx/CodeBlockOnCopyDemo';

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
    SearchDialogDemo,
    InputFormDemo,
    TextareaDemo,
    CheckboxGroupDemo,
    RadioGroupDemo,
    SwitchSettingsDemo,
    SelectDemo,
    CodeBlockOnCopyDemo,

    Button,
    Flex,
    Stack,

    FormField,
    Input,
    Textarea,
    Checkbox,
    CheckboxGroup,
    Radio,
    RadioGroup,
    Switch,
    Select,
    SelectOption,

    code: (p: ComponentPropsWithoutRef<'code'>) =>
      typeof p.children === 'string' ? <Code {...p}>{p.children}</Code> : <code {...p} />,

    ...components,
  };
}
