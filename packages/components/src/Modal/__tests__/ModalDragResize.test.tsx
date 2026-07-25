/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 验证 Modal 的拖动与缩放：把手识别、边界约束、受控 rect、键盘操作与关闭复位。
 */

import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { Modal, MODAL_DRAG_HANDLE_ATTR, type ModalRect } from '../';

/** 默认 rect 绕开 jsdom 里 getBoundingClientRect 恒为 0 的限制。 */
const RECT: ModalRect = { x: 100, y: 100, width: 400, height: 300 };

function px(value: string): number {
  return parseFloat(value);
}

function getDialog() {
  return screen.getByRole('dialog');
}

function dragBy(handle: HTMLElement, dx: number, dy: number) {
  fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, button: 0 });
  fireEvent.pointerMove(window, { clientX: dx, clientY: dy });
  fireEvent.pointerUp(window);
}

describe('Modal — drag', () => {
  it('does not mark the header draggable by default', () => {
    renderWithProviders(
      <Modal isOpen title="Plain">
        body
      </Modal>,
    );
    expect(screen.getByRole('heading', { name: 'Plain' })).not.toHaveAttribute(
      MODAL_DRAG_HANDLE_ATTR,
    );
    expect(getDialog()).not.toHaveAttribute('data-draggable');
  });

  it('turns the built-in header into a drag handle when isDraggable', () => {
    renderWithProviders(
      <Modal isOpen title="Draggable" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    expect(screen.getByRole('heading', { name: 'Draggable' })).toHaveAttribute(
      MODAL_DRAG_HANDLE_ATTR,
    );
    expect(getDialog()).toHaveAttribute('data-draggable', 'true');
  });

  it('moves the panel by the pointer delta', () => {
    renderWithProviders(
      <Modal isOpen title="Draggable" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    const dialog = getDialog();
    expect(px(dialog.style.left)).toBe(100);

    dragBy(screen.getByRole('heading', { name: 'Draggable' }), 50, 30);

    expect(px(dialog.style.left)).toBe(150);
    expect(px(dialog.style.top)).toBe(130);
    // 拖动不改变尺寸
    expect(px(dialog.style.width)).toBe(400);
    expect(px(dialog.style.height)).toBe(300);
  });

  it('keeps the panel inside the viewport', () => {
    renderWithProviders(
      <Modal isOpen title="Draggable" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    dragBy(screen.getByRole('heading', { name: 'Draggable' }), -9999, -9999);

    const dialog = getDialog();
    // viewportPadding token = 8px
    expect(px(dialog.style.left)).toBe(8);
    expect(px(dialog.style.top)).toBe(8);
  });

  it('allows leaving the viewport when constraining is disabled', () => {
    renderWithProviders(
      <Modal
        isOpen
        title="Draggable"
        isDraggable
        defaultRect={RECT}
        shouldConstrainToViewport={false}
      >
        body
      </Modal>,
    );
    dragBy(screen.getByRole('heading', { name: 'Draggable' }), -500, -400);

    const dialog = getDialog();
    expect(px(dialog.style.left)).toBe(-400);
    expect(px(dialog.style.top)).toBe(-300);
  });

  it('ignores pointerdown on interactive elements inside the handle', () => {
    renderWithProviders(
      <Modal isOpen isDraggable defaultRect={RECT} aria-label="custom">
        <div {...{ [MODAL_DRAG_HANDLE_ATTR]: '' }} data-testid="handle">
          <span>Title</span>
          <button type="button">Action</button>
        </div>
      </Modal>,
    );
    const dialog = getDialog();

    dragBy(screen.getByRole('button', { name: 'Action' }), 60, 60);
    expect(px(dialog.style.left)).toBe(100);

    dragBy(screen.getByText('Title'), 60, 60);
    expect(px(dialog.style.left)).toBe(160);
  });

  it('does not drag from a non-handle area', () => {
    renderWithProviders(
      <Modal isOpen title="Draggable" isDraggable defaultRect={RECT}>
        <p>body text</p>
      </Modal>,
    );
    dragBy(screen.getByText('body text'), 40, 40);
    expect(px(getDialog().style.left)).toBe(100);
  });
});

describe('Modal — resize', () => {
  const handleOf = (dir: string) =>
    document.querySelector<HTMLElement>(`[data-timeui-modal-resize-handle="${dir}"]`)!;

  it('renders no handles unless isResizable', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m">
        body
      </Modal>,
    );
    expect(document.querySelectorAll('[data-timeui-modal-resize-handle]')).toHaveLength(0);
  });

  it('renders all eight handles by default', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" isResizable defaultRect={RECT}>
        body
      </Modal>,
    );
    expect(document.querySelectorAll('[data-timeui-modal-resize-handle]')).toHaveLength(8);
    expect(getDialog()).toHaveAttribute('data-resizable', 'true');
  });

  it('honours an explicit resizeHandles list', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" isResizable resizeHandles={['se']} defaultRect={RECT}>
        body
      </Modal>,
    );
    expect(document.querySelectorAll('[data-timeui-modal-resize-handle]')).toHaveLength(1);
  });

  it('grows from the south-east handle', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" isResizable defaultRect={RECT}>
        body
      </Modal>,
    );
    dragBy(handleOf('se'), 60, 40);

    const dialog = getDialog();
    expect(px(dialog.style.width)).toBe(460);
    expect(px(dialog.style.height)).toBe(340);
    // 右下角缩放不动左上角
    expect(px(dialog.style.left)).toBe(100);
    expect(px(dialog.style.top)).toBe(100);
  });

  it('moves the anchored edge when resizing from the north-west handle', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" isResizable defaultRect={RECT}>
        body
      </Modal>,
    );
    dragBy(handleOf('nw'), 40, 20);

    const dialog = getDialog();
    expect(px(dialog.style.left)).toBe(140);
    expect(px(dialog.style.top)).toBe(120);
    expect(px(dialog.style.width)).toBe(360);
    expect(px(dialog.style.height)).toBe(280);
  });

  it('clamps to minWidth / minHeight', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" isResizable defaultRect={RECT} minWidth={200} minHeight={150}>
        body
      </Modal>,
    );
    dragBy(handleOf('se'), -9999, -9999);

    const dialog = getDialog();
    expect(px(dialog.style.width)).toBe(200);
    expect(px(dialog.style.height)).toBe(150);
  });

  it('keeps the opposite edge fixed when the west handle hits minWidth', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" isResizable defaultRect={RECT} minWidth={200}>
        body
      </Modal>,
    );
    dragBy(handleOf('w'), 9999, 0);

    const dialog = getDialog();
    expect(px(dialog.style.width)).toBe(200);
    // 右边界 = 100 + 400 = 500 保持不动 → 左边界落在 300
    expect(px(dialog.style.left)).toBe(300);
  });
});

describe('Modal — rect control & lifecycle', () => {
  it('reports every rect change with a reason', () => {
    const onRectChange = vi.fn();
    renderWithProviders(
      <Modal isOpen title="t" isDraggable defaultRect={RECT} onRectChange={onRectChange}>
        body
      </Modal>,
    );
    expect(onRectChange).toHaveBeenCalledWith(RECT, { reason: 'init' });

    dragBy(screen.getByRole('heading', { name: 't' }), 10, 10);
    expect(onRectChange).toHaveBeenLastCalledWith(
      { x: 110, y: 110, width: 400, height: 300 },
      { reason: 'drag' },
    );
  });

  it('supports a fully controlled rect', () => {
    const Controlled = () => {
      const [rect, setRect] = useState<ModalRect>(RECT);
      return (
        <Modal isOpen title="t" isDraggable rect={rect} onRectChange={setRect}>
          body
        </Modal>
      );
    };
    renderWithProviders(<Controlled />);

    dragBy(screen.getByRole('heading', { name: 't' }), 25, 15);
    expect(px(getDialog().style.left)).toBe(125);
    expect(px(getDialog().style.top)).toBe(115);
  });

  it('does not move a controlled rect that the owner never updates', () => {
    renderWithProviders(
      <Modal isOpen title="t" isDraggable rect={RECT}>
        body
      </Modal>,
    );
    dragBy(screen.getByRole('heading', { name: 't' }), 40, 40);
    expect(px(getDialog().style.left)).toBe(100);
  });

  it('re-centers on reopen by default', () => {
    const { rerender } = renderWithProviders(
      <Modal isOpen title="t" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    dragBy(screen.getByRole('heading', { name: 't' }), 50, 50);
    expect(px(getDialog().style.left)).toBe(150);

    rerender(
      <Modal isOpen={false} title="t" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    rerender(
      <Modal isOpen title="t" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    expect(px(getDialog().style.left)).toBe(100);
  });

  it('keeps the dragged rect across close when shouldResetRectOnClose=false', () => {
    const { rerender } = renderWithProviders(
      <Modal isOpen title="t" isDraggable defaultRect={RECT} shouldResetRectOnClose={false}>
        body
      </Modal>,
    );
    dragBy(screen.getByRole('heading', { name: 't' }), 50, 50);

    rerender(
      <Modal isOpen={false} title="t" isDraggable defaultRect={RECT} shouldResetRectOnClose={false}>
        body
      </Modal>,
    );
    rerender(
      <Modal isOpen title="t" isDraggable defaultRect={RECT} shouldResetRectOnClose={false}>
        body
      </Modal>,
    );
    expect(px(getDialog().style.left)).toBe(150);
  });

  it('pulls the panel back into view when the viewport shrinks', () => {
    renderWithProviders(
      <Modal isOpen title="t" isDraggable defaultRect={{ x: 600, y: 400, width: 400, height: 300 }}>
        body
      </Modal>,
    );
    expect(px(getDialog().style.left)).toBe(600);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    fireEvent.resize(window);

    // 800 - 400 - 8 = 392；600 - 300 - 8 = 292
    expect(px(getDialog().style.left)).toBe(392);
    expect(px(getDialog().style.top)).toBe(292);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
  });
});

describe('Modal — keyboard drag & resize', () => {
  it('moves with Ctrl + arrow keys', () => {
    renderWithProviders(
      <Modal isOpen title="t" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    const dialog = getDialog();
    fireEvent.keyDown(dialog, { key: 'ArrowRight', ctrlKey: true });
    expect(px(dialog.style.left)).toBe(116);
    fireEvent.keyDown(dialog, { key: 'ArrowUp', ctrlKey: true });
    expect(px(dialog.style.top)).toBe(84);
  });

  it('moves with Meta + arrow keys too', () => {
    renderWithProviders(
      <Modal isOpen title="t" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    fireEvent.keyDown(getDialog(), { key: 'ArrowDown', metaKey: true });
    expect(px(getDialog().style.top)).toBe(116);
  });

  it('resizes with Ctrl + Shift + arrow keys', () => {
    renderWithProviders(
      <Modal isOpen title="t" isResizable defaultRect={RECT}>
        body
      </Modal>,
    );
    const dialog = getDialog();
    fireEvent.keyDown(dialog, { key: 'ArrowRight', ctrlKey: true, shiftKey: true });
    expect(px(dialog.style.width)).toBe(416);
    fireEvent.keyDown(dialog, { key: 'ArrowUp', ctrlKey: true, shiftKey: true });
    expect(px(dialog.style.height)).toBe(284);
  });

  it('ignores movement keys when the feature is off', () => {
    renderWithProviders(
      <Modal isOpen title="t" isResizable defaultRect={RECT}>
        body
      </Modal>,
    );
    const dialog = getDialog();
    fireEvent.keyDown(dialog, { key: 'ArrowRight', ctrlKey: true });
    expect(px(dialog.style.left)).toBe(100);
  });

  it('leaves plain arrow keys alone', () => {
    renderWithProviders(
      <Modal isOpen title="t" isDraggable defaultRect={RECT}>
        body
      </Modal>,
    );
    const dialog = getDialog();
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(px(dialog.style.left)).toBe(100);
  });
});
