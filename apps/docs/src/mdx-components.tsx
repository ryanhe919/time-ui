/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 mdx-components 模块。
 */

import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
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
  Slider,
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
import { SliderVolumeDemo } from '@/components/mdx/SliderVolumeDemo';
import { SliderRangeDemo } from '@/components/mdx/SliderRangeDemo';
import { SelectDemo } from '@/components/mdx/SelectDemo';
import { CodeBlockOnCopyDemo } from '@/components/mdx/CodeBlockOnCopyDemo';

type MDXComponents = Record<string, unknown>;

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getTextContent(node.props.children);
  return '';
}

function getCodeBlockPropsFromPre(children: ReactNode) {
  const [firstChild] = Children.toArray(children);
  if (!isValidElement<{ children?: ReactNode; className?: string }>(firstChild)) return null;

  const className = firstChild.props.className ?? '';
  const code = getTextContent(firstChild.props.children).replace(/\n$/, '');
  if (!code) return null;
  const language =
    className
      .split(/\s+/)
      .find((token) => token.startsWith('language-'))
      ?.replace(/^language-/, '') || 'tsx';

  return { code, language };
}

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
    SliderVolumeDemo,
    SliderRangeDemo,
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
    Slider,
    Select,
    SelectOption,

    code: (p: ComponentPropsWithoutRef<'code'>) =>
      typeof p.children === 'string' ? <Code {...p}>{p.children}</Code> : <code {...p} />,

    pre: (p: ComponentPropsWithoutRef<'pre'>) => {
      const extracted = getCodeBlockPropsFromPre(p.children);
      if (!extracted) return <pre {...p} />;
      return <CodeBlock code={extracted.code} language={extracted.language} />;
    },

    ...components,
  };
}
