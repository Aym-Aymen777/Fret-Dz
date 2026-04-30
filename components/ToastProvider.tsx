"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_STYLES: Record<ToastType, { bar: string; bg: string; text: string; icon: string }> = {
  success: {
    bar:  "bg-emerald-500",
    bg:   "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-900 dark:text-emerald-100",
    icon: "✅",
  },
  error: {
    bar:  "bg-red-500",
    bg:   "bg-red-50 dark:bg-red-950/40",
    text: "text-red-900 dark:text-red-100",
    icon: "❌",
  },
  warning: {
    bar:  "bg-amber-400",
    bg:   "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-900 dark:text-amber-100",
    icon: "⚠️",
  },
  info: {
    bar:  "bg-blue-500",
    bg:   "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-900 dark:text-blue-100",
    icon: "ℹ️",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 4000);
    timers.current.set(id, timer);
  }, []);

  const success = useCallback((m: string) => addToast("success", m), [addToast]);
  const error   = useCallback((m: string) => addToast("error",   m), [addToast]);
  const warning = useCallback((m: string) => addToast("warning", m), [addToast]);
  const info    = useCallback((m: string) => addToast("info",    m), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}

      {/* ── Toast container — bottom-right, clear of navbar ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={`relative flex items-start gap-3 overflow-hidden rounded-xl border border-[var(--border)] shadow-lg px-4 py-3 animate-fade-in ${s.bg}`}
            >
              {/* Left accent bar */}
              <span className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${s.bar}`} />

              {/* Icon */}
              <span className="mt-0.5 text-base leading-none">{s.icon}</span>

              {/* Message */}
              <p className={`flex-1 text-sm font-medium leading-snug ${s.text}`}>
                {t.message}
              </p>

              {/* Dismiss */}
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Fermer"
                className={`mt-0.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity ${s.text}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}