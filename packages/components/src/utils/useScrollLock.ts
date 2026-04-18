/**
 * @author Ryan He
 * @date 2026-04-18
 * @description body 滚动锁 hook：overlay（Modal / Drawer / 其它全屏层）打开时锁住
 *   body 滚动，并用 padding-right 补偿滚动条消失产生的空位，避免页面内容水平抖动。
 *   使用模块级 ref-count 处理多层 overlay 叠加的场景——只有最外层解锁时才真正还原。
 */

import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

let lockCount = 0;
let originalOverflow: string | null = null;
let originalPaddingRight: string | null = null;

export function useScrollLock(lock: boolean): void {
  useIsomorphicLayoutEffect(() => {
    if (!lock || typeof document === 'undefined') return;

    lockCount += 1;
    if (lockCount === 1) {
      const body = document.body;
      // 滚动条宽度 = 视口宽 − documentElement 可用宽。macOS overlay 滚动条两者
      // 相等，差为 0，天然不补 padding；Windows / Linux 永久滚动条差 ~15–17px。
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      originalOverflow = body.style.overflow;
      originalPaddingRight = body.style.paddingRight;
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        // 读 computed padding-right 保留任何来源（CSS / inline）的已有值，叠加
        // 滚动条宽度后以 inline 形式写回。解锁时置回原 inline 值，让 CSS 规则
        // 自然接管。
        const currentPaddingRight = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
      }
    }

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        const body = document.body;
        if (originalOverflow !== null) body.style.overflow = originalOverflow;
        if (originalPaddingRight !== null) body.style.paddingRight = originalPaddingRight;
        originalOverflow = null;
        originalPaddingRight = null;
      }
    };
  }, [lock]);
}
