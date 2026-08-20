'use client';

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XCircleIcon } from '@/components/icons';
import { useHydrated } from '@/hooks/useHydrated';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const hydrated = useHydrated();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.body);
  }, []);

  if (!hydrated || !container) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>,
    container
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgMap = {
    success: 'bg-success/10 border-success',
    error: 'bg-error/10 border-error',
    info: 'bg-surface-alt border-border',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-[12px] border shadow-lg animate-in slide-in-from-right ${bgMap[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      <p className="text-base text-text-primary flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full hover:bg-surface transition-colors"
        aria-label="Dismiss notification"
      >
        <XCircleIcon className="w-5 h-5 text-text-secondary" />
      </button>
    </div>
  );
}
