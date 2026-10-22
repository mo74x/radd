'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';

export interface TagInputProps {
  label?: string;
  helperText?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  variant?: 'primary' | 'teal' | 'amber' | 'danger' | 'neutral';
  disabled?: boolean;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  helperText,
  tags,
  onChange,
  placeholder = 'Add a tag...',
  addLabel = 'Add',
  variant = 'teal',
  disabled = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addCurrentTag = () => {
    const trimmed = inputValue.trim().replace(/^[,،]+|[,،]+$/g, '');
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
      e.preventDefault();
      addCurrentTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, tags.length - 1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const variantStyles = {
    teal: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15',
    amber: 'bg-accent/15 text-accent-foreground border-accent/30 hover:bg-accent/20',
    danger: 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/15',
    neutral: 'bg-surface-raised text-text border-border hover:bg-neutral-200 dark:hover:bg-neutral-800',
    primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-semibold text-text select-none text-start">
          {label}
        </label>
      )}

      {/* Tags display */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              variantStyles[variant]
            )}
          >
            <span className="truncate max-w-[260px]">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="text-current/70 hover:text-current rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Remove rule ${tag}`}
              >
                <Icon icon={X} size={12} />
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Input row */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            dir="auto"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl text-sm text-text bg-surface border border-border placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-colors"
          />
          <button
            type="button"
            onClick={addCurrentTag}
            disabled={!inputValue.trim()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-raised border border-border text-sm font-medium text-text hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <Icon icon={Plus} size={16} />
            <span>{addLabel}</span>
          </button>
        </div>
      )}

      {helperText && (
        <p className="text-xs text-text-muted text-start mt-0.5 leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
};
