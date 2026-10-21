'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  className?: string;
}

/**
 * Accessible Checkbox component with minimum 44px tap target.
 *
 * Usage:
 * ```tsx
 * <Checkbox
 *   label="Send Telegram notification"
 *   checked={telegramEnabled}
 *   onChange={setTelegramEnabled}
 * />
 * ```
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  id,
  className,
}) => {
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'min-h-[44px] inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        id={checkboxId}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border bg-surface hover:border-neutral-400 dark:hover:border-neutral-500'
        )}
      >
        {checked && <Icon icon={Check} size={14} strokeWidth={3} />}
      </button>

      {(label || description) && (
        <div className="flex flex-col text-start">
          {label && (
            <span className="text-sm font-semibold text-text leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-text-muted mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
