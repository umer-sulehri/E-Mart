'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Shows a persistent-but-unobtrusive notice while the browser reports no
 * connection. `navigator.onLine` can false-positive, so the banner is purely
 * informational and never blocks interaction.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-secondary-900 px-4 py-2 text-center text-xs font-medium text-white"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      You&apos;re offline. Some features may be unavailable until you reconnect.
    </div>
  );
}
