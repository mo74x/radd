'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
}

/**
 * Accessible Textarea component with live character counter.
 *
 * Usage:
 * ```tsx
 * <Textarea
 *   label={t('reviews.draftReply')}
 *   maxLength={500}
 *   showCount
 *   rows={4}
 * />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [charCount, setCharCount] = useState<number>(
      (typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0)
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-semibold text-text select-none text-start"
            >
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span
              className={cn(
                'text-xs font-mono',
                charCount >= maxLength
                  ? 'text-danger font-bold'
                  : 'text-text-muted'
              )}
            >
              {charCount} / {maxLength}
            </span>
          )}
        </div>

        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          className={cn(
            'w-full min-h-[88px] px-3.5 py-2.5 rounded-xl text-base text-text bg-surface border transition-colors resize-y',
            'placeholder:text-text-muted/60 disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
            error
              ? 'border-danger focus-visible:ring-danger'
              : 'border-border hover:border-neutral-400 dark:hover:border-neutral-500',
            className
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
