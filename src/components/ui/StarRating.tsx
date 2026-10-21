/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  value: number; // 0 to 5
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  showScore?: boolean;
  className?: string;
  name?: string;
}

/**
 * StarRating component supporting display and interactive input.
 * CRITICAL: Star ratings must NEVER be mirrored in RTL!
 * Numbers always render in Western digits (0-9).
 *
 * Usage:
 * ```tsx
 * <StarRating value={5} showScore />
 * <StarRating value={rating} interactive onChange={setRating} />
 * ```
 */
export const StarRating: React.FC<StarRatingProps> = ({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  showScore = false,
  className,
  name = 'rating',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeMap = {
    sm: { icon: 16, text: 'text-xs' },
    md: { icon: 20, text: 'text-sm' },
    lg: { icon: 28, text: 'text-base' },
  };

  const currentSize = sizeMap[size];
  const activeRating = hoverValue !== null ? hoverValue : value;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 select-none',
        // Important: Keep stars order constant in RTL
        '[direction:ltr]',
        className
      )}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${value} out of ${max} stars`}
    >
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: max }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= activeRating;

          if (interactive) {
            return (
              <button
                key={starNumber}
                type="button"
                role="radio"
                aria-checked={value === starNumber}
                aria-label={`${starNumber} star${starNumber > 1 ? 's' : ''}`}
                className={cn(
                  'min-h-[44px] min-w-[32px] p-1 inline-flex items-center justify-center transition-transform active:scale-125 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg'
                )}
                onMouseEnter={() => setHoverValue(starNumber)}
                onMouseLeave={() => setHoverValue(null)}
                onClick={() => onChange?.(starNumber)}
              >
                <Star
                  size={currentSize.icon}
                  className={cn(
                    'transition-colors duration-150',
                    isFilled
                      ? 'fill-accent text-accent'
                      : 'fill-transparent text-neutral-300 dark:text-neutral-700'
                  )}
                />
              </button>
            );
          }

          return (
            <Star
              key={starNumber}
              size={currentSize.icon}
              aria-hidden="true"
              className={cn(
                'shrink-0',
                isFilled
                  ? 'fill-accent text-accent'
                  : 'fill-transparent text-neutral-300 dark:text-neutral-700'
              )}
            />
          );
        })}
      </div>

      {showScore && (
        <span
          className={cn(
            'font-bold text-text ms-1 font-mono tracking-tight',
            currentSize.text
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};
