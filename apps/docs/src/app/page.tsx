/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现当前路由页面的渲染逻辑。
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/zh/docs/getting-started/introduction');
}
