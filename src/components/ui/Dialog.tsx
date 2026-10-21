'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Accessible Modal Dialog with focus management, Esc key dismissal, and scroll lock.
 *
 * Usage:
 * ```tsx
 * <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
 *   <DialogHeader>
 *     <DialogTitle>Confirm Reply</DialogTitle>
 *   </DialogHeader>
 *   <div>Are you sure?</div>
 * </Dialog>
 * ```
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  children,
  className,
  size = 'md',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc key listener & scroll lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element inside dialog
    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'w-full rounded-2xl border border-border bg-surface text-text shadow-2xl overflow-hidden',
          'flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150',
          sizeClasses[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}> = ({ children, onClose, className }) => (
  <div
    className={cn(
      'flex items-center justify-between p-5 sm:p-6 border-b border-border',
      className
    )}
  >
    <div className="flex flex-col gap-1">{children}</div>
    {onClose && (
      <IconButton aria-label="Close" onClick={onClose} size="sm">
        <Icon icon={X} size={18} />
      </IconButton>
    )}
  </div>
);

export const DialogTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h2 className={cn('text-lg sm:text-xl font-bold text-text', className)}>
    {children}
  </h2>
);

export const DialogDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={cn('text-sm text-text-muted leading-relaxed', className)}>
    {children}
  </p>
);

export const DialogBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('p-5 sm:p-6 overflow-y-auto space-y-4', className)}>
    {children}
  </div>
);

export const DialogFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-border bg-surface-raised',
      className
    )}
  >
    {children}
  </div>
);
