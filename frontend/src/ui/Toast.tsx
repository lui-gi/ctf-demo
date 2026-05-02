import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { strings } from '@/theme/strings';
import './Toast.css';

export type ToastVariant = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastContextValue {
  push: (t: Omit<Toast, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, 'id'> & { id?: string }): string => {
      const id = t.id ?? `toast-${Date.now()}-${counter.current++}`;
      const next: Toast = {
        id,
        message: t.message,
        variant: t.variant,
        durationMs: t.durationMs,
      };
      setToasts((prev) => [...prev, next]);
      return id;
    },
    [],
  );

  // Auto-dismiss
  useEffect(() => {
    const timers = toasts.map((t) =>
      window.setTimeout(() => dismiss(t.id), t.durationMs),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [toasts, dismiss]);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pc-toast-stack"
        role="region"
        aria-live="polite"
        aria-label={strings.toast.region}
      >
        {toasts.map((t) => (
          <div key={t.id} className={`pc-toast pc-toast--${t.variant}`} role="status">
            <span className="pc-toast__msg">{t.message}</span>
            <button
              type="button"
              className="pc-toast__dismiss"
              onClick={() => dismiss(t.id)}
              aria-label={strings.toast.dismiss}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
