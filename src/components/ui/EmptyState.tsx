import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState component for zero-data views, unreviewed lists, or empty search results.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   title={t('reviews.noReviews')}
 *   description={t('reviews.noReviewsDesc')}
 *   action={<Button variant="primary">Refresh</Button>}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-primary flex items-center justify-center mb-4">
        <Icon icon={icon} size={32} />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-text mb-1 max-w-md">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-text-muted max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {action && <div className="inline-flex items-center">{action}</div>}
    </div>
  );
};
