import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
}

/**
 * Accessible Select component with custom end-positioned Chevron.
 * Uses logical end-* positioning for seamless bi-directional support.
 *
 * Usage:
 * ```tsx
 * <Select
 *   label={t('common.status')}
 *   options={[
 *     { value: 'all', label: 'All Reviews' },
 *     { value: 'pending', label: 'Pending Approval' }
 *   ]}
 * />
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      options,
      children,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold text-text select-none text-start"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
            className={cn(
              'w-full min-h-[44px] ps-3.5 pe-10 py-2.5 rounded-xl text-base text-text bg-surface border transition-colors appearance-none cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
              error
                ? 'border-danger focus-visible:ring-danger'
                : 'border-border hover:border-neutral-400 dark:hover:border-neutral-500',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute end-3.5 pointer-events-none text-text-muted flex items-center">
            <Icon icon={ChevronDown} size={18} />
          </div>
        </div>

        {error ? (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="text-xs font-medium text-danger text-start mt-0.5"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${selectId}-helper`}
            className="text-xs text-text-muted text-start mt-0.5"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
