/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 SliderRangeDemo（带 formatValue 的范围 Slider）。
 */

'use client';

import type { SliderValue } from '@timeui/react';
import { Slider } from '@timeui/react';

const formatPrice = (v: SliderValue): string =>
  Array.isArray(v) ? `US$${v[0].toFixed(2)} – US$${v[1].toFixed(2)}` : `US$${v.toFixed(2)}`;

export function SliderRangeDemo() {
  return (
    <Slider
      label="Price Range"
      max={1000}
      defaultValue={[100, 500]}
      showValue
      formatValue={formatPrice}
    />
  );
}
