'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  exiting?: boolean;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    icon: 'text-emerald-500',
    title: 'text-emerald-800 dark:text-emerald-200',
    msg: 'text-emerald-600 dark:text-emerald-400',
    progress: 'bg-emerald-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    border: 'border-red-200 dark:border-red-800/60',
    icon: 'text-red-500',
    title: 'text-red-800 dark:text-red-200',
    msg: 'text-red-600 dark:text-red-400',
    progress: 'bg-red-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800/60',
    icon: 'text-amber-500',
    title: 'text-amber-800 dark:text-amber-200',
    msg: 'text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-400',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    border: 'border-sky-200 dark:border-sky-800/60',
    icon: 'text-sky-500',
    title: 'text-sky-800 dark:text-sky-200',
    msg: 'text-sky-600 dark:text-sky-400',
    progress: 'bg-sky-400',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Start exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Remove after animation finishes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 250);
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newToast: Toast = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss
    const timer = setTimeout(() => {
      removeToast(id);
      timers.current.delete(id);
    }, duration);
    timers.current.set(id, timer);

    return id;
  }, [removeToast]);

  const handleDismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    removeToast(id);
  }, [removeToast]);

  const contextValue: ToastContextType = {
    toast: addToast,
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    info: (title, message) => addToast('info', title, message),
    warning: (title, message) => addToast('warning', title, message),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          const Icon = TOAST_ICONS[toast.type];
          const styles = TOAST_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto ${styles.bg} border ${styles.border} rounded-2xl shadow-xl backdrop-blur-md overflow-hidden ${
                toast.exiting ? 'toast-exit' : 'toast-enter'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`shrink-0 mt-0.5 ${styles.icon}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${styles.title}`}>{toast.title}</p>
                  {toast.message && (
                    <p className={`text-xs mt-1 leading-relaxed ${styles.msg}`}>{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDismiss(toast.id)}
                  className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Progress bar */}
              <div className="h-0.5 w-full bg-black/5 dark:bg-white/5">
                <div
                  className={`h-full ${styles.progress} toast-progress`}
                  style={{ animationDuration: `${toast.duration || 4000}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
