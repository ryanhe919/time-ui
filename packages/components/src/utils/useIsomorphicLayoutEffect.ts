import { useEffect, useLayoutEffect } from 'react';

/**
 * SSR-safe alias for `useLayoutEffect`. Falls back to `useEffect` on the
 * server so Next.js / React DOM server doesn't emit the "useLayoutEffect
 * does nothing on the server" warning during RSC / SSG. Behaviour in the
 * browser is identical to `useLayoutEffect`.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
