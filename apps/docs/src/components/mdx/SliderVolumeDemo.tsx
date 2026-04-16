/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 SliderVolumeDemo。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Slider } from '@timeui/react';

export function SliderVolumeDemo() {
  const [vol, setVol] = useState(30);
  const [price, setPrice] = useState<[number, number]>([100, 500]);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 28px;
        width: min(420px, 100%);
      `}
    >
      <Slider
        label="Volume"
        showValue
        value={vol}
        onChange={(v) => setVol(typeof v === 'number' ? v : v[0])}
      />
      <Slider
        label="Price Range"
        max={1000}
        showValue
        formatValue={(v) =>
          Array.isArray(v) ? `US$${v[0].toFixed(2)} – US$${v[1].toFixed(2)}` : `US$${v.toFixed(2)}`
        }
        value={price}
        onChange={(v) => Array.isArray(v) && setPrice(v)}
      />
    </div>
  );
}
