/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description 实现 CodeEditor 组件的核心渲染与交互逻辑（基于 CodeMirror 6）。
 */

// Side-effect import 触发 @timeui/themes 对 @emotion/react Theme 的 module augmentation；
// 否则 tsup 的独立 DTS bundle 看不到 theme.colors / theme.typography 的类型。
import type {} from '@timeui/themes';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme, css } from '@emotion/react';

// CodeMirror 6 imports — all optional peer deps
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';

// Language support
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css as langCss } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';

import type { Extension } from '@codemirror/state';

import { createCodeEditorTheme } from './CodeEditor.theme';
import { CodeEditorToolbar } from './CodeEditor.toolbar';
import type {
  CodeEditorProps,
  CodeEditorLanguage,
  CodeEditorSize,
  CodeEditorVariant,
  ToolbarConfig,
  AISuggestion,
} from './CodeEditor.types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getLanguageExtension(language: CodeEditorLanguage): Extension {
  switch (language) {
    case 'javascript':
      return javascript();
    case 'typescript':
      return javascript({ typescript: true });
    case 'python':
      return python();
    case 'css':
      return langCss();
    case 'html':
      return html();
    case 'json':
      return json();
    default:
      return javascript();
  }
}

function toCssLength(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? `${value}px` : value;
}

function resolveToolbarConfig(toolbar: CodeEditorProps['toolbar']): ToolbarConfig | false {
  if (toolbar === false) return false;
  if (toolbar === true || toolbar === undefined) return {};
  return toolbar;
}

const SIZE_TO_FONT: Record<CodeEditorSize, string> = {
  sm: '12px',
  md: '13px',
  lg: '14px',
};

const SIZE_TO_MIN_HEIGHT: Record<CodeEditorSize, string> = {
  sm: '120px',
  md: '200px',
  lg: '280px',
};

// ─── component ────────────────────────────────────────────────────────────────

export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(function CodeEditor(
  {
    value,
    defaultValue,
    onChange,
    language: languageProp = 'javascript',
    onLanguageChange,
    size = 'md',
    variant = 'bordered',
    placeholder,
    isDisabled = false,
    isReadOnly = false,
    isInvalid = false,
    showLineNumbers: showLineNumbersProp = true,
    lineWrap: lineWrapProp = false,
    toolbar,
    minHeight,
    maxHeight,
    extensions: extraExtensions,
    onAISuggest,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
  },
  ref,
) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  // controlled language / lineWrap / lineNumbers state
  const [language, setLanguageInternal] = useState<CodeEditorLanguage>(languageProp);
  const [lineWrap, setLineWrap] = useState(lineWrapProp);
  const [showLineNumbers, setShowLineNumbers] = useState(showLineNumbersProp);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync from props if they change
  useEffect(() => {
    setLanguageInternal(languageProp);
  }, [languageProp]);
  useEffect(() => {
    setLineWrap(lineWrapProp);
  }, [lineWrapProp]);
  useEffect(() => {
    setShowLineNumbers(showLineNumbersProp);
  }, [showLineNumbersProp]);

  // Wrap language setter so toolbar selection is observable by the parent.
  const setLanguage = useCallback(
    (lang: CodeEditorLanguage) => {
      setLanguageInternal(lang);
      onLanguageChange?.(lang);
    },
    [onLanguageChange],
  );

  // Compartments for dynamic reconfiguration
  const languageCompartment = useMemo(() => new Compartment(), []);
  const themeCompartment = useMemo(() => new Compartment(), []);
  const lineWrapCompartment = useMemo(() => new Compartment(), []);
  const lineNumbersCompartment = useMemo(() => new Compartment(), []);
  const readOnlyCompartment = useMemo(() => new Compartment(), []);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Track the last externally-set value to avoid feedback loops
  const lastExternalValue = useRef<string | undefined>(value);

  // Build base extensions (excluding compartmented ones)
  const buildExtensions = useCallback((): Extension[] => {
    const exts: Extension[] = [
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      foldGutter(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          lastExternalValue.current = newValue;
          onChangeRef.current?.(newValue);
        }
      }),
    ];

    if (placeholder) {
      exts.push(cmPlaceholder(placeholder));
    }

    if (extraExtensions && extraExtensions.length > 0) {
      exts.push(...extraExtensions);
    }

    return exts;
  }, [placeholder, extraExtensions]);

  // Mount editor
  useEffect(() => {
    if (!editorRef.current) return;

    const initialDoc = value ?? defaultValue ?? '';
    lastExternalValue.current = initialDoc;

    const startState = EditorState.create({
      doc: initialDoc,
      extensions: [
        ...buildExtensions(),
        lineNumbersCompartment.of(showLineNumbers ? lineNumbers() : []),
        lineWrapCompartment.of(lineWrap ? EditorView.lineWrapping : []),
        readOnlyCompartment.of([
          EditorState.readOnly.of(isReadOnly || isDisabled),
          EditorView.editable.of(!isDisabled),
        ]),
        languageCompartment.of(getLanguageExtension(language)),
        themeCompartment.of(createCodeEditorTheme(theme, isDark)),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // We only want to mount/unmount once — dynamic updates handled via effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync controlled value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (value === undefined) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    lastExternalValue.current = value;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  // Reconfigure language
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(language)),
    });
  }, [language, languageCompartment]);

  // Reconfigure theme
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.reconfigure(createCodeEditorTheme(theme, isDark)),
    });
  }, [theme, isDark, themeCompartment]);

  // Reconfigure line wrap
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: lineWrapCompartment.reconfigure(lineWrap ? EditorView.lineWrapping : []),
    });
  }, [lineWrap, lineWrapCompartment]);

  // Reconfigure line numbers
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: lineNumbersCompartment.reconfigure(showLineNumbers ? lineNumbers() : []),
    });
  }, [showLineNumbers, lineNumbersCompartment]);

  // Reconfigure read-only / disabled
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: readOnlyCompartment.reconfigure([
        EditorState.readOnly.of(isReadOnly || isDisabled),
        EditorView.editable.of(!isDisabled),
      ]),
    });
  }, [isReadOnly, isDisabled, readOnlyCompartment]);

  // ─── toolbar ────────────────────────────────────────────────────────────────

  const toolbarConfig = resolveToolbarConfig(toolbar);
  const hasToolbar = toolbarConfig !== false;

  const handleAISuggest = useCallback(() => {
    if (!onAISuggest || !viewRef.current) return;
    const view = viewRef.current;
    const pos = view.state.selection.main.head;
    const code = view.state.doc.toString();
    onAISuggest(code, pos).then((suggestions: AISuggestion[]) => {
      const best = suggestions[0];
      if (!best) return;
      view.dispatch({
        changes: { from: pos, to: pos, insert: best.text },
      });
    });
  }, [onAISuggest]);

  // ─── styles ─────────────────────────────────────────────────────────────────

  const minHeightCss = toCssLength(minHeight) ?? SIZE_TO_MIN_HEIGHT[size];
  const maxHeightCss = toCssLength(maxHeight ?? null);
  const fontSizeCss = SIZE_TO_FONT[size];

  const getVariantBorder = (v: CodeEditorVariant) => {
    if (v === 'flat') return 'none';
    if (v === 'bordered')
      return `${theme.borders.width.thin} solid ${isInvalid ? theme.colors.danger[500] : theme.colors.border.default}`;
    if (v === 'faded')
      return `${theme.borders.width.thin} solid ${isInvalid ? theme.colors.danger[500] : theme.colors.border.subtle}`;
    return 'none';
  };

  const getVariantBg = (v: CodeEditorVariant) => {
    if (v === 'faded') return theme.colors.bg.muted;
    return theme.colors.bg.surface;
  };

  const containerCss = css`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    font-family: ${theme.typography.fontFamily.mono};
    font-size: ${fontSizeCss};
    line-height: 1.6;
    border-radius: ${theme.componentRadius.md};
    border: ${getVariantBorder(variant)};
    background-color: ${getVariantBg(variant)};
    overflow: hidden;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
    ${isDisabled ? 'opacity: 0.6; pointer-events: none;' : ''}
    ${isFullscreen
      ? `
        position: fixed;
        inset: 0;
        z-index: ${theme.zIndex.modal};
        border-radius: 0;
        border: none;
        max-height: 100vh;
      `
      : ''}

    &:focus-within {
      ${variant !== 'flat'
        ? `
        border-color: ${isInvalid ? theme.colors.danger[500] : theme.colors.primary[500]};
        box-shadow: 0 0 0 2px ${isInvalid ? theme.colors.danger[100] : theme.colors.primary[100]};
      `
        : ''}
    }
  `;

  const editorScrollCss = css`
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    ${maxHeightCss && !isFullscreen ? `max-height: ${maxHeightCss};` : ''}

    /* CodeMirror editor sizing */
    .cm-editor {
      font-size: ${fontSizeCss};
      min-height: ${minHeightCss};
      height: ${isFullscreen ? '100%' : 'auto'};
    }

    .cm-scroller {
      overflow: auto;
      font-family: ${theme.typography.fontFamily.mono};
      min-height: ${minHeightCss};
    }
  `;

  const currentValue = viewRef.current?.state.doc.toString() ?? value ?? defaultValue ?? '';

  return (
    <div
      ref={ref}
      css={containerCss}
      data-variant={variant}
      data-size={size}
      data-fullscreen={isFullscreen || undefined}
      data-disabled={isDisabled || undefined}
      data-readonly={isReadOnly || undefined}
      data-invalid={isInvalid || undefined}
      className={className}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
    >
      {hasToolbar && (
        <CodeEditorToolbar
          value={currentValue}
          language={language}
          onLanguageChange={setLanguage}
          lineWrap={lineWrap}
          onLineWrapToggle={() => setLineWrap((v) => !v)}
          showLineNumbers={showLineNumbers}
          onLineNumbersToggle={() => setShowLineNumbers((v) => !v)}
          isFullscreen={isFullscreen}
          onFullscreenToggle={() => setIsFullscreen((v) => !v)}
          config={toolbarConfig}
          hasAI={!!onAISuggest}
          onAISuggest={handleAISuggest}
        />
      )}
      <div ref={editorRef} css={editorScrollCss} data-slot="code-editor-mount" />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
