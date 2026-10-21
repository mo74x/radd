import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Accessible Avatar component with image support and fallback initials generator.
 *
 * Usage:
 * ```tsx
 * <Avatar name="Ahmed Mahmoud" size="md" />
 * ```
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Derive initials from name (Arabic or Latin)
  const getInitials = (inputName?: string): string => {
    if (!inputName) return '?';
    const parts = inputName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return inputName.substring(0, 2).toUpperCase();
  };

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden font-bold select-none border border-border shadow-xs',
        showFallback ? 'bg-teal-100 text-primary dark:bg-teal-900/60 dark:text-teal-200' : 'bg-surface',
        sizeClasses[size],
        className
      )}
      aria-label={alt || name || 'User avatar'}
    >
      {!showFallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt || name || 'Avatar'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
