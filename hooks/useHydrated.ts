import { useEffect, useState } from 'react';

/**
 * Returns `true` once the component has mounted on the client.
 *
 * Zustand stores that use the `persist` middleware rehydrate synchronously
 * from localStorage before React hydrates the DOM, so their initial client
 * value can differ from the value that was rendered on the server. Components
 * that render persisted store data must gate that data behind this hook to
 * avoid React hydration mismatches ("initial UI does not match server").
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
