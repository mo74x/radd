import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'      // Amber accent CTA (primary action e.g. Approve & Publish)
  | 'secondary'    // Deep teal (secondary action e.g. Save, Edit)
  | 'outline'      // Bordered neutral
  | 'ghost'        // Subtle hover
  | 'destructive'; // Red danger

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

/**
 * Accessible Button component.
 * Features 44px+ touch targets, visible focus rings, and RTL logical spacing.
 *
 * Usage:
 * ```tsx
 * <Button variant="primary" loading={isSubmitting}>
 *   {t('reviews.approveReply')}
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled,
      startIcon,
      endIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'min-h-[44px] inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none';

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-accent text-accent-foreground font-semibold hover:bg-accent-hover shadow-xs active:bg-accent-active',
      secondary:
        'bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs active:bg-primary-active',
      outline:
        'border border-border bg-surface text-text hover:bg-surface-raised active:bg-border-muted shadow-xs',
      ghost:
        'bg-transparent text-text-muted hover:text-text hover:bg-surface-raised active:bg-border-muted',
      destructive:
        'bg-danger text-danger-foreground hover:opacity-90 shadow-xs active:opacity-100',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'min-h-[44px] px-3.5 py-1.5 text-sm gap-2',
      md: 'min-h-[44px] px-5 py-2.5 text-base gap-2.5',
      lg: 'min-h-[52px] px-6 py-3.5 text-lg gap-3',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {loading ? (
          <Spinner
            size={size === 'lg' ? 'md' : 'sm'}
            className="me-2 text-current"
          />
        ) : (
          startIcon && <span className="inline-flex shrink-0">{startIcon}</span>
        )}
        <span>{children}</span>
        {!loading && endIcon && (
          <span className="inline-flex shrink-0">{endIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
