/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Utils 组件的核心渲染与交互逻辑。
 */

export const isDev =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
