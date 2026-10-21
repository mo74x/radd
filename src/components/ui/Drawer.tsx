'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * Mobile-first Drawer / Bottom Sheet component.
 *
 * Usage:
 * ```tsx
 * <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Filters">
 *   <div>Drawer content</div>
 * </Drawer>
 * ```
 */
export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  children,
  title,
  className,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-border bg-surface text-text shadow-2xl',
          'flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250 sm:zoom-in-95',
          className
        )}
      >
        {/* Mobile drag handle bar */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-border-muted" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-text">{title}</h3>
            <IconButton aria-label="Close" onClick={onClose} size="sm">
              <Icon icon={X} size={18} />
            </IconButton>
          </div>
        )}

        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
};
