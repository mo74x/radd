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
  headerActions?: React.ReactNode;
  side?: 'bottom' | 'end';
  className?: string;
}

/**
 * Mobile-first Drawer / Bottom Sheet / Side Sheet component.
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
  headerActions,
  side = 'bottom',
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

  const isEndSide = side === 'end';

  return (
    <div
      role="presentation"
      className={cn(
        'fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 motion-reduce:animate-none',
        isEndSide
          ? 'flex-col justify-end lg:flex-row lg:justify-end p-0'
          : 'flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Detail drawer'}
        className={cn(
          'w-full border border-border bg-surface text-text shadow-2xl flex flex-col motion-reduce:animate-none',
          isEndSide
            ? 'rounded-t-3xl max-h-[90vh] lg:max-h-screen lg:h-full lg:max-w-2xl lg:rounded-none lg:rounded-s-2xl lg:border-y-0 lg:border-e-0 animate-in slide-in-from-bottom lg:fade-in duration-250'
            : 'sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] animate-in slide-in-from-bottom duration-250 sm:zoom-in-95',
          className
        )}
      >
        {/* Mobile drag handle bar */}
        <div className={cn('flex justify-center pt-3 pb-1', isEndSide ? 'lg:hidden' : 'sm:hidden')}>
          <div className="w-12 h-1.5 rounded-full bg-border-muted" />
        </div>

        {(title || headerActions) && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
            {title ? (
              <h3 className="text-lg font-bold text-text truncate text-start">{title}</h3>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <IconButton aria-label="Close" onClick={onClose} size="sm">
                <Icon icon={X} size={18} />
              </IconButton>
            </div>
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>
      </div>
    </div>
  );
};
