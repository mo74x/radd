import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

/**
 * Animated shimmer Skeleton component for content loading states.
 *
 * Usage:
 * ```tsx
 * <Skeleton className="w-32 h-6" />
 * <Skeleton variant="circular" className="w-12 h-12" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantClasses = {
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
    circular: 'rounded-full',
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-neutral-200 dark:bg-neutral-800/80',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};
