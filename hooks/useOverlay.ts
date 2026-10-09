'use client';

import { useEffect } from 'react';

/**
 * Body-scroll lock shared by every overlay (mobile nav, cart drawer, dialogs).
 *
 * A counter rather than a boolean, because overlays nest: the mobile nav used
 * to reset `document.body.style.overflow` to `''` on unmount, which re-enabled
 * background scrolling behind a cart drawer that was still open.
 */
let lockCount = 0;
let savedOverflow = '';

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = savedOverflow;
    };
  }, [locked]);
}

/** Calls `onEscape` when Escape is pressed while `active`. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}
