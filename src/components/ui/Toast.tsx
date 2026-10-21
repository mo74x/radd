/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, title, variant = 'info' }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, title, variant }]);

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast({ message: msg, title, variant: 'success' }), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast({ message: msg, title, variant: 'danger' }), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast({ message: msg, title, variant: 'warning' }), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast({ message: msg, title, variant: 'info' }), [showToast]);

  const icons: Record<ToastVariant, any> = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
    info: Info,
  };

  const variantStyles: Record<ToastVariant, string> = {
    success: 'border-success/30 bg-surface text-text',
    warning: 'border-warning/30 bg-surface text-text',
    danger: 'border-danger/30 bg-surface text-text',
    info: 'border-info/30 bg-surface text-text',
  };

  const iconColors: Record<ToastVariant, string> = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((toast) => {
          const IconComp = icons[toast.variant || 'info'];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-5',
                variantStyles[toast.variant || 'info']
              )}
            >
              <Icon
                icon={IconComp}
                size={20}
                className={cn('shrink-0 mt-0.5', iconColors[toast.variant || 'info'])}
              />
              <div className="flex-1 text-start">
                {toast.title && (
                  <h4 className="text-sm font-bold text-text leading-tight mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-text-muted leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Close notification"
                className="text-text-muted hover:text-text p-1 rounded-md transition-colors"
              >
                <Icon icon={X} size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
}
