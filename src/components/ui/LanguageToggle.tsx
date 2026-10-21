'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';

export interface LanguageToggleProps {
  className?: string;
  variant?: 'button' | 'compact' | 'pill';
}

/**
 * Accessible Language Toggle Component.
 * Allows toggling between Arabic (RTL) and English (LTR).
 * Persists choice to cookies and dynamically updates <html lang dir>.
 *
 * Usage:
 * ```tsx
 * <LanguageToggle variant="pill" />
 * ```
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className,
  variant = 'button',
}) => {
  const { locale, setLocale, t } = useI18n();

  const handleToggle = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    setLocale(nextLocale);
  };

  const nextLabel = locale === 'ar' ? 'English' : 'العربية';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`${t('common.language')}: ${nextLabel}`}
        title={`${t('common.language')}: ${nextLabel}`}
        className={cn(
          'min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg',
          'text-text-muted hover:text-text hover:bg-surface-raised transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          className
        )}
      >
        <Icon icon={Globe} size={18} className="me-1.5" />
        <span className="text-xs font-semibold uppercase">{locale === 'ar' ? 'EN' : 'عربي'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`${t('common.language')}: ${nextLabel}`}
      className={cn(
        'min-h-[44px] px-3.5 py-2 inline-flex items-center gap-2 rounded-xl text-sm font-medium',
        'border border-border bg-surface text-text hover:bg-surface-raised transition-all duration-150',
        'shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className
      )}
    >
      <Icon icon={Globe} size={18} className="text-primary" />
      <span>{nextLabel}</span>
    </button>
  );
};
