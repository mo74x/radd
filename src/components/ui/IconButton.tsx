import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export type IconButtonVariant = 'ghost' | 'outline' | 'secondary' | 'primary';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Enforce accessible label
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
}

/**
 * Accessible IconButton component ensuring minimum 44px touch target.
 *
 * Usage:
 * ```tsx
 * <IconButton aria-label={t('common.close')} onClick={onClose}>
 *   <Icon icon={X} />
 * </IconButton>
 * ```
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      className,
      variant = 'ghost',
      size = 'md',
      loading = false,
      disabled,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-xl transition-all duration-150 select-none active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none';

    const variantClasses: Record<IconButtonVariant, string> = {
      ghost:
        'bg-transparent text-text-muted hover:text-text hover:bg-surface-raised active:bg-border-muted',
      outline:
        'border border-border bg-surface text-text hover:bg-surface-raised active:bg-border-muted shadow-xs',
      secondary:
        'bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs active:bg-primary-active',
      primary:
        'bg-accent text-accent-foreground font-semibold hover:bg-accent-hover shadow-xs active:bg-accent-active',
    };

    const sizeClasses: Record<IconButtonSize, string> = {
      sm: 'min-h-[44px] min-w-[44px] p-2',
      md: 'min-h-[44px] min-w-[44px] p-2.5',
      lg: 'min-h-[52px] min-w-[52px] p-3.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-busy={loading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
