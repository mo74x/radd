'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, BellRing, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

export const MOBILE_TAB_ITEMS = [
  {
    id: 'dashboard',
    labelKey: 'navigation.dashboard',
    defaultLabel: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'reviews',
    labelKey: 'navigation.reviews',
    defaultLabel: 'Reviews',
    href: '/dashboard/reviews',
    icon: MessageSquare,
  },
  {
    id: 'notifications',
    labelKey: 'navigation.notifications',
    defaultLabel: 'Notifications',
    href: '/dashboard#notifications',
    icon: BellRing,
  },
  {
    id: 'settings',
    labelKey: 'navigation.settings',
    defaultLabel: 'Settings',
    href: '/dashboard#settings',
    icon: Settings,
  },
];

/**
 * Mobile Bottom Tab Bar (<1024px).
 * Provides immediate one-thumb access to the 4 primary destinations.
 */
export const BottomTabBar: React.FC<{ className?: string }> = ({ className }) => {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-border bg-surface/95 backdrop-blur-md',
        'grid grid-cols-4 items-center px-2 shadow-lg select-none',
        className
      )}
    >
      {MOBILE_TAB_ITEMS.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : item.href === '/dashboard/reviews'
            ? pathname.startsWith('/dashboard/reviews')
            : false;
        const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'text-primary'
                : 'text-text-muted hover:text-text'
            )}
          >
            <Icon
              icon={item.icon}
              size={20}
              className={cn(
                'transition-transform',
                isActive && 'scale-110 text-primary'
              )}
            />
            <span className="text-[11px] leading-tight truncate max-w-[70px]">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
