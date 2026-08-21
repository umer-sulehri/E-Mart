'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the hydration render, `true` afterwards.
 * Implemented with useSyncExternalStore so server and client snapshots
 * match without triggering cascading renders.
 */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
