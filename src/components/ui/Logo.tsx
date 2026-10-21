import React from 'react';
import { cn } from '@/lib/utils';

export interface LogoProps {
  className?: string;
  variant?: 'lockup' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Brand Logo component for Radd (ردّ).
 * Theme-aware and explicitly unmirrored in RTL layouts.
 *
 * Usage:
 * ```tsx
 * <Logo variant="lockup" size="md" />
 * ```
 */
export const Logo: React.FC<LogoProps> = ({
  className,
  variant = 'lockup',
  size = 'md',
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', star: 12 },
    md: { icon: 36, text: 'text-xl', star: 16 },
    lg: { icon: 48, text: 'text-2xl', star: 20 },
  };

  const currentSize = sizeMap[size];

  // SVG Icon mark representing the custom Radd stylized arabic calligraphic character with star
  const MarkSvg = (
    <svg
      viewBox="0 0 512 512"
      width={currentSize.icon}
      height={currentSize.icon}
      aria-hidden="true"
      className="shrink-0 transition-transform"
    >
      <rect width="512" height="512" rx="128" fill="var(--primary)" />
      {/* Arabic Calligraphic shape for رد */}
      <path
        d="M290.66 401.06Q287.67 401.06 283.78 400.75Q279.9 400.44 275.63 400.06L276.73 367.82Q280.87 367.94 284.64 368.12Q288.41 368.3 290.15 368.3Q299.33 368.3 304.66 361.03Q309.98 353.76 309.98 340.19V210.94H348.21V340.19Q348.21 357.88 340.99 371.69Q333.77 385.49 320.82 393.28Q307.88 401.06 290.66 401.06Z M163.79 336.58V303.82H253.7L228.72 325.25V287.56Q228.72 270.21 225.3 260.75Q221.89 251.28 213.87 247.49Q205.85 243.7 191.91 243.7H171.66V210.94H191.91Q216.14 210.94 232.89 218.92Q249.64 226.9 258.3 243.77Q266.95 260.64 266.95 287.56V336.58Z"
        fill="#F2F7F6"
      />
      {/* Accent Star */}
      <path
        d="M215.37 110.94 L225.64 134.79 L251.51 137.19 L231.99 154.34 L237.71 179.68 L215.37 166.42 L193.03 179.68 L198.75 154.34 L179.23 137.19 L205.10 134.79 Z"
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth="7"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div
        className={cn('inline-flex items-center justify-center select-none', className)}
        aria-label="Radd"
      >
        {MarkSvg}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 select-none font-bold tracking-tight',
        className
      )}
      aria-label="Radd (ردّ)"
    >
      {MarkSvg}
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className={cn('text-text font-black', currentSize.text)}>Radd</span>
        <span className={cn('text-primary font-bold', currentSize.text)}>ردّ</span>
      </div>
    </div>
  );
};
