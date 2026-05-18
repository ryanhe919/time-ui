---
'@timeui/react': patch
'@timeui/tokens': patch
'@timeui/themes': patch
---

Drawer 视觉与交互打磨：

- 入场动画去掉 spring 回弹，改用 `easeOut` 平滑滑入。
- 圆角 16px → 10px，整体更克制。
- header / footer 内边距、min-height、close button 尺寸与 offset 重新调校，使标题与关闭按钮在 Y 轴自然对齐。
- 修复将 `<DrawerHeader>` / `<DrawerFooter>` 直接传给 `header` / `footer` prop 时出现的双层包裹（导致 close 按钮错位 + 双下划线）；`DrawerHeader` 自带 close 按钮右侧避让。
- header / footer 的 1px 分割线现在贯穿整个 panel 宽度，不再被内边距内缩。
