/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatVoiceWave 模块的 a11y 行为（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ChatVoiceWave } from '../ChatVoiceWave';

describe('ChatVoiceWave — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (active + inactive)',
    async (theme) => {
      const { container } = renderWithProviders(
        <div>
          <ChatVoiceWave aria-label="Recording" />
          <ChatVoiceWave aria-label="Idle" isActive={false} />
        </div>,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
