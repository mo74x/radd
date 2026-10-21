import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

/**
 * Accessible Input component with logical properties for bi-directional RTL/LTR support.
 *
 * Usage:
 * ```tsx
 * <Input
 *   label={t('common.search')}
 *   placeholder={t('common.search')}
 *   startIcon={<Icon icon={Search} />}
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      helperText,
      error,
      startIcon,
      endIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-text select-none text-start"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute start-3.5 flex items-center pointer-events-none text-text-muted">
              {startIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-base text-text bg-surface border transition-colors',
              'placeholder:text-text-muted/60 disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
              error
                ? 'border-danger focus-visible:ring-danger'
                : 'border-border hover:border-neutral-400 dark:hover:border-neutral-500',
              startIcon ? 'ps-10' : undefined,
              endIcon ? 'pe-10' : undefined,
              className
            )}
            {...props}
          />

          {endIcon && (
            <div className="absolute end-3.5 flex items-center text-text-muted">
              {endIcon}
            </div>
          )}
        </div>

        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs font-medium text-danger text-start mt-0.5"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-text-muted text-start mt-0.5"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
