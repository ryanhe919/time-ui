/**
 * @author Ryan He
 * @description 将 TimeUI 主题 token 映射到 CodeMirror 6 EditorView 样式与语法高亮。
 */

import type { TimeUITheme } from '@timeui/themes';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export function createCodeEditorTheme(theme: TimeUITheme, isDark: boolean): Extension {
  const editorTheme = EditorView.theme(
    {
      '&': {
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.bg.surface,
        fontFamily: theme.typography.fontFamily.mono,
        height: '100%',
      },
      '.cm-content': {
        caretColor: theme.colors.primary[500],
        padding: '8px 0',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: theme.colors.primary[500],
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: isDark
          ? `${theme.colors.primary[200]}44`
          : `${theme.colors.primary[200]}88`,
      },
      '.cm-panels': {
        backgroundColor: theme.colors.bg.muted,
        color: theme.colors.text.primary,
      },
      '.cm-panels.cm-panels-top': {
        borderBottom: `1px solid ${theme.colors.border.subtle}`,
      },
      '.cm-panels.cm-panels-bottom': {
        borderTop: `1px solid ${theme.colors.border.subtle}`,
      },
      '.cm-searchMatch': {
        backgroundColor: `${theme.colors.primary[200]}66`,
        outline: `1px solid ${theme.colors.primary[200]}`,
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: `${theme.colors.primary[200]}88`,
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? `${theme.colors.bg.muted}88` : `${theme.colors.bg.sunken}88`,
      },
      '.cm-selectionMatch': {
        backgroundColor: `${theme.colors.primary[100]}88`,
      },
      '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: `${theme.colors.primary[200]}66`,
      },
      '.cm-gutters': {
        backgroundColor: theme.colors.bg.muted,
        color: theme.colors.text.disabled,
        border: 'none',
        borderRight: `1px solid ${theme.colors.border.subtle}`,
      },
      '.cm-activeLineGutter': {
        backgroundColor: isDark ? `${theme.colors.bg.sunken}88` : `${theme.colors.bg.canvas}88`,
      },
      '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: theme.colors.text.muted,
      },
      '.cm-tooltip': {
        border: `1px solid ${theme.colors.border.default}`,
        backgroundColor: theme.colors.bg.surface,
        boxShadow: theme.shadows.md,
        borderRadius: theme.componentRadius.sm,
      },
      '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      },
      '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: theme.colors.bg.surface,
        borderBottomColor: theme.colors.bg.surface,
      },
      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: isDark ? theme.colors.primary[600] : theme.colors.primary[100],
          color: isDark ? theme.colors.primary[100] : theme.colors.primary[600],
        },
      },
    },
    { dark: isDark },
  );

  const highlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: theme.colors.text.disabled, fontStyle: 'italic' },
    { tag: tags.lineComment, color: theme.colors.text.disabled, fontStyle: 'italic' },
    { tag: tags.blockComment, color: theme.colors.text.disabled, fontStyle: 'italic' },
    { tag: tags.docComment, color: theme.colors.text.disabled, fontStyle: 'italic' },
    {
      tag: tags.keyword,
      color: isDark ? theme.colors.primary[200] : theme.colors.primary[600],
    },
    {
      tag: [tags.deleted, tags.character, tags.propertyName, tags.macroName],
      color: isDark ? theme.colors.primary[200] : theme.colors.primary[600],
    },
    {
      tag: [tags.function(tags.variableName), tags.definition(tags.variableName), tags.labelName],
      color: isDark ? theme.colors.primary[200] : theme.colors.primary[500],
    },
    {
      tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
      color: isDark ? theme.colors.primary[200] : theme.colors.primary[600],
    },
    {
      tag: [tags.definition(tags.name), tags.separator],
      color: theme.colors.text.primary,
    },
    {
      // Type names, class names — use cyan-ish tone
      tag: [
        tags.typeName,
        tags.className,
        tags.changed,
        tags.annotation,
        tags.modifier,
        tags.self,
        tags.namespace,
      ],
      color: isDark ? '#79b8ff' : '#0086b3',
    },
    {
      tag: [tags.number],
      // orange for numbers — use warning color if available
      color: isDark ? theme.colors.warning[200] : theme.colors.warning[600],
    },
    {
      tag: [
        tags.operator,
        tags.operatorKeyword,
        tags.escape,
        tags.regexp,
        tags.link,
        tags.special(tags.string),
      ],
      color: theme.colors.text.secondary,
    },
    {
      tag: [tags.url],
      color: theme.colors.text.link,
    },
    {
      tag: [tags.meta],
      color: theme.colors.text.muted,
    },
    {
      tag: tags.strong,
      fontWeight: 'bold',
    },
    {
      tag: tags.emphasis,
      fontStyle: 'italic',
    },
    {
      tag: tags.strikethrough,
      textDecoration: 'line-through',
    },
    {
      tag: tags.link,
      color: theme.colors.text.link,
      textDecoration: 'underline',
    },
    {
      tag: tags.heading,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
    },
    {
      tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
      color: isDark ? theme.colors.primary[200] : theme.colors.primary[600],
    },
    {
      // green tones for strings
      tag: [tags.processingInstruction, tags.string, tags.inserted],
      color: isDark ? '#85e89d' : '#22863a',
    },
    {
      tag: tags.invalid,
      color: isDark ? theme.colors.danger[200] : theme.colors.danger[600],
    },
  ]);

  return [editorTheme, syntaxHighlighting(highlightStyle)];
}
