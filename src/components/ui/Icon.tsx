'use client';

import React from 'react';
import { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IconProps extends LucideProps {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /**
   * Set to true if the icon indicates direction (e.g. ChevronRight, ArrowLeft, Send).
   * Directional icons will be automatically flipped horizontally in RTL (Arabic) layout.
   * Star ratings and logos should NEVER be marked directional.
   */
  directional?: boolean;
}

/**
 * Accessible Icon wrapper for Lucide icons.
 * Automatically mirrors directional icons in RTL while maintaining proper semantics.
 *
 * Usage:
 * ```tsx
 * <Icon icon={ChevronRight} directional className="w-5 h-5 text-text-muted" />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  directional = false,
  className,
  size = 20,
  'aria-hidden': ariaHidden = true,
  ...props
}) => {
  return (
    <IconComponent
      size={size}
      aria-hidden={ariaHidden}
      className={cn(
        'inline-block shrink-0 transition-transform duration-150',
        directional && 'rtl:-scale-x-100',
        className
      )}
      {...props}
    />
  );
};
