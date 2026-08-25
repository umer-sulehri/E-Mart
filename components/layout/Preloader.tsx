'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Preloader() {
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setHidden(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[111] flex items-center justify-center bg-white transition-opacity duration-500',
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      aria-hidden="true"
    >
      <div className="flex gap-2">
        <span className="h-4 w-4 rounded-full bg-primary animate-bounce-dot" />
        <span className="h-4 w-4 rounded-full bg-primary animate-bounce-dot [animation-delay:-0.32s]" />
        <span className="h-4 w-4 rounded-full bg-primary animate-bounce-dot [animation-delay:-0.16s]" />
      </div>
    </div>
  );
}
