/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'icon';
}

/**
 * Accessible Theme Toggle Component.
 * Supports light and dark modes with prefers-color-scheme detection and manual override.
 *
 * Usage:
 * ```tsx
 * <ThemeToggle variant="icon" />
 * ```
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = 'icon',
}) => {
  const { t } = useI18n();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage or document class
    const savedTheme = localStorage.getItem('radd_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('radd_theme', nextDark ? 'dark' : 'light');

    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const label = isDark ? t('common.lightMode') : t('common.darkMode');

  if (!mounted) {
    return (
      <div className={cn('min-h-[44px] min-w-[44px] rounded-xl', className)} />
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        title={label}
        className={cn(
          'min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl',
          'border border-border bg-surface text-text hover:bg-surface-raised transition-colors',
          'shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          className
        )}
      >
        <Icon
          icon={isDark ? Sun : Moon}
          size={18}
          className={isDark ? 'text-accent' : 'text-primary'}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className={cn(
        'min-h-[44px] px-3.5 py-2 inline-flex items-center gap-2 rounded-xl text-sm font-medium',
        'border border-border bg-surface text-text hover:bg-surface-raised transition-colors',
        'shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className
      )}
    >
      <Icon
        icon={isDark ? Sun : Moon}
        size={18}
        className={isDark ? 'text-accent' : 'text-primary'}
      />
      <span>{label}</span>
    </button>
  );
};
