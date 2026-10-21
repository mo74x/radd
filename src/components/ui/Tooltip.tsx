'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * Accessible Tooltip component triggered by hover or keyboard focus.
 *
 * Usage:
 * ```tsx
 * <Tooltip content="Copy approval link to clipboard">
 *   <button>Copy</button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        'aria-describedby': isVisible ? 'tooltip-content' : undefined,
      })}

      {isVisible && (
        <div
          id="tooltip-content"
          role="tooltip"
          className={cn(
            'absolute start-1/2 -translate-x-1/2 z-50 px-2.5 py-1 text-xs font-medium rounded-lg shadow-lg pointer-events-none select-none whitespace-nowrap',
            'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
            'animate-in fade-in zoom-in-95 duration-100',
            positionClasses[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};