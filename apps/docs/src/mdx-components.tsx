/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 mdx-components 模块。
 */

import type { ComponentPropsWithoutRef } from 'react';
import {
  Callout,
  CodeBlock,
  Code,
  Button,
  Box,
  Grid,
  Container,
  Flex,
  Stack,
  Text,
  Heading,
  Paragraph,
  Link,
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
    Box,
    Grid,
    Container,
    Flex,
    Stack,
    Text,
    Heading,
    Paragraph,
    Link,
    Code,

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
