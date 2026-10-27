'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker on the web build only. The Capacitor
 * shell already provides the native offline experience, and its WebView cannot
 * reliably register a worker for the remote origin.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isNative = Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor?.isNativePlatform?.()
    );
    if (isNative) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('[pwa] Service worker registration failed:', error);
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
