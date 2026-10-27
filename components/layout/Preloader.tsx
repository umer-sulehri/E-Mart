'use client';

import { useState, useEffect } from 'react';

const PRELOADER_SESSION_KEY = 'emart:preloader-shown';
const PRELOADER_MS = 900;

export default function Preloader() {
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Show the splash only on the first visit of a browser session. Replaying
    // a 1s full-screen overlay on every client-side return to home is a blank
    // flash over already-loaded content, which reads as jank, not polish.
    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem(PRELOADER_SESSION_KEY) === '1';
      sessionStorage.setItem(PRELOADER_SESSION_KEY, '1');
    } catch {
      alreadyShown = false;
    }

    if (alreadyShown || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setHidden(true);
      return;
    }

    const timer = setTimeout(() => setHidden(true), PRELOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[111] flex items-center justify-center bg-white transition-opacity duration-300"
      aria-hidden="true"
    >
      <div className="flex gap-2">
        <span className="h-4 w-4 rounded-full bg-primary-600 animate-bounce-dot" />
        <span className="h-4 w-4 rounded-full bg-primary-600 animate-bounce-dot [animation-delay:-0.32s]" />
        <span className="h-4 w-4 rounded-full bg-primary-600 animate-bounce-dot [animation-delay:-0.16s]" />
      </div>
    </div>
  );
}
