import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

/**
 * Visual Badge / Chip indicator for statuses, languages, and ratings.
 *
 * Usage:
 * ```tsx
 * <Badge variant="success" dot>{t('reviews.approved')}</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center font-medium rounded-full select-none transition-colors';

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
    accent: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
    success: 'bg-success-surface text-success dark:bg-success-surface/40 dark:text-emerald-300',
    warning: 'bg-warning-surface text-warning dark:bg-warning-surface/40 dark:text-amber-300',
    danger: 'bg-danger-surface text-danger dark:bg-danger-surface/40 dark:text-red-300',
    neutral: 'bg-border-muted text-text-muted dark:bg-surface-raised dark:text-neutral-300',
    outline: 'border border-border text-text bg-transparent',
  };

  const dotColorClasses: Record<BadgeVariant, string> = {
    default: 'bg-teal-500',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    neutral: 'bg-neutral-400',
    outline: 'bg-text-muted',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs sm:text-sm gap-2',
  };

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColorClasses[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
