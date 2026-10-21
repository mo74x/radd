/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export type BannerVariant = 'info' | 'warning' | 'danger' | 'success';

export interface InlineBannerProps {
  variant?: BannerVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Accessible InlineBanner component for notices, tips, and alerts.
 *
 * Usage:
 * ```tsx
 * <InlineBanner variant="warning" title="Google OAuth expired">
 *   Please reconnect your Google Business Profile to resume automated replies.
 * </InlineBanner>
 * ```
 */
export const InlineBanner: React.FC<InlineBannerProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}) => {
  const icons: Record<BannerVariant, any> = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
    success: CheckCircle2,
  };

  const variantStyles: Record<BannerVariant, string> = {
    info: 'border-info/30 bg-info-surface/80 dark:bg-info-surface/30 text-text',
    warning: 'border-warning/30 bg-warning-surface/80 dark:bg-warning-surface/30 text-text',
    danger: 'border-danger/30 bg-danger-surface/80 dark:bg-danger-surface/30 text-text',
    success: 'border-success/30 bg-success-surface/80 dark:bg-success-surface/30 text-text',
  };

  const iconColors: Record<BannerVariant, string> = {
    info: 'text-info',
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
  };

  const IconComp = icons[variant];

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-start',
        variantStyles[variant],
        className
      )}
    >
      <Icon
        icon={IconComp}
        size={20}
        className={cn('shrink-0 mt-0.5', iconColors[variant])}
      />
      <div className="flex-1 text-sm leading-relaxed">
        {title && (
          <h4 className="font-bold text-text mb-0.5 leading-tight">{title}</h4>
        )}
        <div className="text-text-muted">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss banner"
          className="text-text-muted hover:text-text p-1 rounded-md transition-colors shrink-0"
        >
          <Icon icon={X} size={16} />
        </button>
      )}
    </div>
  );
};
