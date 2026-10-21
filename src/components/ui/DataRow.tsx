import React from 'react';
import { cn } from '@/lib/utils';

export interface DataRowProps {
  label: string;
  value?: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  border?: boolean;
  className?: string;
}

/**
 * DataRow component for settings, detail records, and metadata displays.
 *
 * Usage:
 * ```tsx
 * <DataRow
 *   label="Telegram Bot Status"
 *   description="Receives real-time approval links"
 *   value={<Badge variant="success">Connected</Badge>}
 *   action={<Button variant="outline" size="sm">Configure</Button>}
 * />
 * ```
 */
export const DataRow: React.FC<DataRowProps> = ({
  label,
  value,
  description,
  action,
  border = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'min-h-[48px] py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start',
        border && 'border-b border-border-muted last:border-b-0',
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-text leading-tight">
          {label}
        </span>
        {description && (
          <span className="text-xs text-text-muted leading-relaxed">
            {description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 justify-start sm:justify-end">
        {value && <div className="text-sm text-text">{value}</div>}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};
