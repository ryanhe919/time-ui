/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 验证 RichTextEditor 模块的渲染、受控/非受控、状态、变体、工具条与扩展行为。
 */

import { describe, it, expect, vi } from 'vitest';
import { useRef } from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Extension, type Editor } from '@tiptap/core';

import { renderWithProviders, type RenderWithProvidersOptions } from '../../test-utils';
import { RichTextEditor } from '../';

/**
 * 等待 TipTap 实例 onCreate 完成（useEditor 是异步的）。
 */
async function waitForEditor(getEditor: () => Editor | null): Promise<Editor> {
  await waitFor(() => {
    expect(getEditor()).not.toBeNull();
  });
  const editor = getEditor();
  if (!editor) throw new Error('editor never created');
  return editor;
}

/**
 * Toolbar tests assert against English labels (Bold / Italic / ...). The default
 * locale is `zh`, so for label-asserting tests we explicitly force `en` via
 * ConfigProvider — covers the label text without coupling the test file to zh strings.
 */
function renderEditor(
  ui: Parameters<typeof renderWithProviders>[0],
  opts?: RenderWithProvidersOptions,
) {
  return renderWithProviders(ui, { ...opts, config: { locale: 'en', ...(opts?.config ?? {}) } });
}

describe('RichTextEditor — rendering', () => {
  it('renders a role="textbox" element with the given aria-label', async () => {
    renderWithProviders(<RichTextEditor aria-label="Editor" />);
    const box = await screen.findByRole('textbox', { name: 'Editor' });
    expect(box).toBeInTheDocument();
    expect(box).toHaveAttribute('aria-multiline', 'true');
  });

  it('renders defaultValue as initial HTML inside ProseMirror', async () => {
    const { container } = renderWithProviders(
      <RichTextEditor aria-label="Editor" defaultValue="<p>hi</p>" />,
    );
    await waitFor(() => {
      const pm = container.querySelector('.ProseMirror');
      expect(pm?.textContent).toContain('hi');
    });
  });

  it('renders placeholder text via [data-placeholder] when content is empty', async () => {
    const { container } = renderWithProviders(
      <RichTextEditor aria-label="Editor" placeholder="Type here..." />,
    );
    await waitFor(() => {
      const placeholderNode = container.querySelector('[data-placeholder]');
      expect(placeholderNode).not.toBeNull();
      expect(placeholderNode?.getAttribute('data-placeholder')).toBe('Type here...');
    });
  });
});

describe('RichTextEditor — controlled / uncontrolled', () => {
  it('controlled: updates editor content when `value` prop changes', async () => {
    const editorRef: { current: Editor | null } = { current: null };
    const { container, rerender } = renderWithProviders(
      <RichTextEditor
        aria-label="Editor"
        value="<p>one</p>"
        onChange={() => {}}
        onCreate={(e) => {
          editorRef.current = e;
        }}
      />,
    );
    const editor = await waitForEditor(() => editorRef.current);
    expect(editor.getHTML()).toContain('one');

    rerender(
      <RichTextEditor
        aria-label="Editor"
        value="<p>two</p>"
        onChange={() => {}}
        onCreate={(e) => {
          editorRef.current = e;
        }}
      />,
    );

    await waitFor(() => {
      const pm = container.querySelector('.ProseMirror');
      expect(pm?.textContent).toContain('two');
    });
    expect(editor.getHTML()).toContain('two');
  });

  it('uncontrolled: onChange fires when content changes via editor command', async () => {
    const editorRef: { current: Editor | null } = { current: null };
    const onChange = vi.fn();
    renderWithProviders(
      <RichTextEditor
        aria-label="Editor"
        defaultValue="<p>hello</p>"
        onChange={onChange}
        onCreate={(e) => {
          editorRef.current = e;
        }}
      />,
    );
    const editor = await waitForEditor(() => editorRef.current);

    await act(async () => {
      editor.chain().selectAll().insertContent(' world').run();
    });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain('world');
  });

  it('onChange fires when content is inserted into the editor', async () => {
    const editorRef: { current: Editor | null } = { current: null };
    const onChange = vi.fn();
    renderWithProviders(
      <RichTextEditor
        aria-label="Editor"
        defaultValue=""
        onChange={onChange}
        onCreate={(e) => {
          editorRef.current = e;
        }}
      />,
    );
    const editor = await waitForEditor(() => editorRef.current);

    await act(async () => {
      editor.chain().insertContent('a').run();
    });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain('a');
  });

  it('defaultValue mode: onChange still fires after programmatic edit', async () => {
    const editorRef: { current: Editor | null } = { current: null };
    const onChange = vi.fn();
    renderWithProviders(
      <RichTextEditor
        aria-label="Editor"
        defaultValue="<p>seed</p>"
        onChange={onChange}
        onCreate={(e) => {
          editorRef.current = e;
        }}
      />,
    );
    const editor = await waitForEditor(() => editorRef.current);

    await act(async () => {
      editor.chain().selectAll().insertContent('seed updated').run();
    });

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toContain('seed updated');
  });
});

describe('RichTextEditor — disabled / readOnly / invalid', () => {
  it('isDisabled wires aria-disabled and contenteditable=false', async () => {
    const { container } = renderWithProviders(
      <RichTextEditor aria-label="Editor" isDisabled defaultValue="<p>x</p>" />,
    );
    const box = await screen.findByRole('textbox', { name: 'Editor' });
    expect(box).toHaveAttribute('aria-disabled', 'true');

    await waitFor(() => {
      const pm = container.querySelector('.ProseMirror');
      expect(pm).not.toBeNull();
      expect(pm?.getAttribute('contenteditable')).toBe('false');
    });
  });

  it('isReadOnly wires aria-readonly and contenteditable=false', async () => {
    const { container } = renderWithProviders(
      <RichTextEditor aria-label="Editor" isReadOnly defaultValue="<p>x</p>" />,
    );
    const box = await screen.findByRole('textbox', { name: 'Editor' });
    expect(box).toHaveAttribute('aria-readonly', 'true');

    await waitFor(() => {
      const pm = container.querySelector('.ProseMirror');
      expect(pm?.getAttribute('contenteditable')).toBe('false');
    });
  });

  it('isInvalid wires aria-invalid="true"', async () => {
    renderWithProviders(<RichTextEditor aria-label="Editor" isInvalid />);
    const box = await screen.findByRole('textbox', { name: 'Editor' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('RichTextEditor — size & variant', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    'renders with size="%s" and exposes data-size',
    async (size) => {
      renderWithProviders(<RichTextEditor aria-label="Editor" size={size} />);
      const box = await screen.findByRole('textbox', { name: 'Editor' });
      expect(box).toHaveAttribute('data-size', size);
    },
  );

  it.each(['flat', 'bordered', 'faded'] as const)(
    'renders with variant="%s" and exposes data-variant',
    async (variant) => {
      renderWithProviders(<RichTextEditor aria-label="Editor" variant={variant} />);
      const box = await screen.findByRole('textbox', { name: 'Editor' });
      expect(box).toHaveAttribute('data-variant', variant);
    },
  );
});

describe('RichTextEditor — toolbar', () => {
  it('default (no prop) = basic preset and exposes a Bold button', async () => {
    renderEditor(<RichTextEditor aria-label="Editor" />);
    expect(await screen.findByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });

  it('toolbar="minimal" only renders bold/italic/underline (no h1)', async () => {
    renderEditor(<RichTextEditor aria-label="Editor" toolbar="minimal" />);
    await screen.findByRole('toolbar', { name: 'Formatting' });
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Heading 1' })).toBeNull();
  });

  it('toolbar={false} hides the toolbar entirely', async () => {
    const { container } = renderEditor(<RichTextEditor aria-label="Editor" toolbar={false} />);
    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).not.toBeNull();
    });
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('toolbar={[...]} custom array renders only the specified buttons', async () => {
    renderEditor(<RichTextEditor aria-label="Editor" toolbar={['bold', 'separator', 'italic']} />);
    await screen.findByRole('toolbar', { name: 'Formatting' });
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Underline' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Heading 1' })).toBeNull();
  });

  it('toolbar labels follow ConfigProvider locale (zh by default)', async () => {
    renderWithProviders(<RichTextEditor aria-label="Editor" toolbar="minimal" />);
    expect(await screen.findByRole('toolbar', { name: '格式工具栏' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '加粗' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '斜体' })).toBeInTheDocument();
  });

  it('clicking Bold toggles bold mark on the current selection', async () => {
    const editorRef: { current: Editor | null } = { current: null };
    renderEditor(
      <RichTextEditor
        aria-label="Editor"
        defaultValue="<p>hello</p>"
        onCreate={(e) => {
          editorRef.current = e;
        }}
      />,
    );
    const editor = await waitForEditor(() => editorRef.current);

    await act(async () => {
      editor.chain().focus().selectAll().run();
    });

    const boldBtn = await screen.findByRole('button', { name: 'Bold' });
    await act(async () => {
      await userEvent.click(boldBtn);
    });

    expect(editor.isActive('bold')).toBe(true);
  });
});

describe('RichTextEditor — onCreate & extensions', () => {
  it('onCreate is invoked with a usable Editor instance', async () => {
    const onCreate = vi.fn();
    renderWithProviders(<RichTextEditor aria-label="Editor" onCreate={onCreate} />);

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalled();
    });
    const firstCall = onCreate.mock.calls[0];
    expect(firstCall).toBeDefined();
    const editor = firstCall?.[0] as Editor;
    expect(typeof editor.getHTML).toBe('function');
    expect(typeof editor.getHTML()).toBe('string');
  });

  it('passes additional `extensions` through to TipTap', async () => {
    const NoopExtension = Extension.create({ name: 'timeui-test-noop' });
    const editorRef: { current: Editor | null } = { current: null };

    renderWithProviders(
      <RichTextEditor
        aria-label="Editor"
        extensions={[NoopExtension]}
        onCreate={(e) => {
          editorRef.current = e;
        }}
      />,
    );
    const editor = await waitForEditor(() => editorRef.current);

    const names = editor.extensionManager.extensions.map((ext) => ext.name);
    expect(names).toContain('timeui-test-noop');
  });

  it('exposes a forwarded ref to the wrapper div', async () => {
    function Harness() {
      const ref = useRef<HTMLDivElement | null>(null);
      return (
        <>
          <RichTextEditor ref={ref} aria-label="Editor" />
          <button
            type="button"
            onClick={() => {
              (
                document.querySelector('[data-probe="ref-tag"]') as HTMLElement | null
              )?.setAttribute('data-tag', ref.current?.tagName ?? '');
            }}
          >
            probe
          </button>
          <span data-probe="ref-tag" />
        </>
      );
    }
    renderWithProviders(<Harness />);
    await screen.findByRole('textbox', { name: 'Editor' });
    await userEvent.click(screen.getByRole('button', { name: 'probe' }));
    const probe = document.querySelector('[data-probe="ref-tag"]');
    expect(probe?.getAttribute('data-tag')).toBe('DIV');
  });
});
