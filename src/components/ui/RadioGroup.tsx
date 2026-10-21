'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  name?: string;
  label?: string;
  className?: string;
}

/**
 * Accessible RadioGroup component with 44px+ touch targets and keyboard navigation.
 *
 * Usage:
 * ```tsx
 * <RadioGroup
 *   label="Reply Tone"
 *   value={tone}
 *   onChange={setTone}
 *   options={[
 *     { value: 'friendly', label: 'Friendly & Welcoming', description: 'Best for cafes & hospitality' },
 *     { value: 'formal', label: 'Professional & Courteous', description: 'Best for clinics & legal' }
 *   ]}
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  name = 'radio-group',
  label,
  className,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex flex-col gap-2', className)}
    >
      {label && (
        <span className="text-sm font-semibold text-text mb-1 select-none text-start">
          {label}
        </span>
      )}

      {options.map((option) => {
        const isSelected = value === option.value;
        const optionId = `${name}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              'min-h-[44px] flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none',
              option.disabled && 'opacity-50 cursor-not-allowed',
              isSelected
                ? 'border-primary bg-teal-50/50 dark:bg-teal-900/20'
                : 'border-border bg-surface hover:bg-surface-raised'
            )}
          >
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={option.disabled}
              onChange={() => !option.disabled && onChange(option.value)}
              className="sr-only"
            />

            <span
              aria-hidden="true"
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                isSelected
                  ? 'border-primary'
                  : 'border-neutral-400 dark:border-neutral-600'
              )}
            >
              {isSelected && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </span>

            <div className="flex flex-col text-start">
              <span className="text-sm font-semibold text-text leading-tight">
                {option.label}
              </span>
              {option.description && (
                <span className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  {option.description}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
