import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { Icon } from './Icon';

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  helper?: string;
  className?: string;
}

/**
 * Metric KPI StatCard component.
 * Displays bold numbers, status trend badges, and brand icons.
 *
 * Usage:
 * ```tsx
 * <StatCard
 *   label={t('stats.totalReviews')}
 *   value="1,248"
 *   trend={{ value: "+14%", positive: true, label: t('stats.trendUp') }}
 *   icon={MessageSquare}
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  icon: IconComponent,
  helper,
  className,
}) => {
  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between gap-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-text-muted leading-tight text-start">
          {label}
        </span>
        {IconComponent && (
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-primary flex items-center justify-center shrink-0">
            <Icon icon={IconComponent} size={20} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 text-start">
        <div className="text-2xl sm:text-3xl font-extrabold text-text font-mono tracking-tight">
          {value}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full',
                trend.positive
                  ? 'bg-success-surface text-success dark:bg-success-surface/40'
                  : 'bg-danger-surface text-danger dark:bg-danger-surface/40'
              )}
            >
              <Icon
                icon={trend.positive ? TrendingUp : TrendingDown}
                size={14}
              />
              <span className="font-mono">{trend.value}</span>
            </span>

            {trend.label && (
              <span className="text-text-muted font-normal truncate">
                {trend.label}
              </span>
            )}
          </div>
        )}

        {helper && !trend && (
          <span className="text-xs text-text-muted mt-1 leading-normal">
            {helper}
          </span>
        )}
      </div>
    </Card>
  );
};
