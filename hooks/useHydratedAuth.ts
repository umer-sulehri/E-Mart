import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * True once the auth store has finished restoring its persisted state.
 *
 * Dashboard layouts must not redirect to /login before this resolves:
 * on a hard reload the store briefly reports isAuthenticated === false
 * while localStorage is still being read, which used to bounce logged-in
 * users back to the login page.
 */
export function useHydratedAuth(): boolean {
  const storeHydrated = useAuthStore((s) => s.hydrated);
  const [persisted, setPersisted] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(
    () => useAuthStore.persist.onFinishHydration(() => setPersisted(true)),
    [],
  );

  return storeHydrated || persisted;
}
