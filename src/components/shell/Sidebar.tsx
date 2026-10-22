'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  BellRing,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, Badge, Icon, Logo, Tooltip } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { NavItem, ShellBusiness } from './types';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  business?: ShellBusiness;
  className?: string;
}

export const NAV_ITEMS: NavItem[] = [
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
    id: 'brand',
    labelKey: 'navigation.brandVoice',
    defaultLabel: 'Brand Voice',
    href: '/dashboard/settings?tab=brand',
    icon: Sparkles,
  },
  {
    id: 'notifications',
    labelKey: 'navigation.notifications',
    defaultLabel: 'Notifications',
    href: '/dashboard/settings?tab=notifications',
    icon: BellRing,
  },
  {
    id: 'locations',
    labelKey: 'navigation.locations',
    defaultLabel: 'Locations',
    href: '/dashboard/settings?tab=locations',
    icon: MapPin,
  },
  {
    id: 'settings',
    labelKey: 'navigation.settings',
    defaultLabel: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

/**
 * Desktop Collapsible Sidebar.
 * Uses logical borders and positioning: sits on the right in Arabic (RTL) and left in English (LTR).
 */
export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  business,
  className,
}) => {
  const pathname = usePathname();
  const { isRtl, t } = useI18n();

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={cn(
        'hidden lg:flex flex-col justify-between fixed top-0 start-0 z-40 h-screen',
        'border-e border-border bg-surface text-text transition-all duration-250 ease-in-out select-none',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Top Section: Logo & Toggle */}
      <div>
        <div
          className={cn(
            'h-16 flex items-center px-4 border-b border-border',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link href="/dashboard" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            <Logo variant={collapsed ? 'icon' : 'lockup'} size="md" />
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className={cn(
                'min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg',
                'text-text-muted hover:text-text hover:bg-surface-raised transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Icon icon={isRtl ? ChevronRight : ChevronLeft} size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav aria-label="Main Destinations" className="p-3 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : item.href.startsWith('/dashboard/reviews')
                ? pathname.startsWith('/dashboard/reviews')
                : item.href.startsWith('/dashboard/settings')
                ? pathname.startsWith('/dashboard/settings')
                : false;
            const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel;

            const LinkContent = (
              <Link
                href={item.href}
                className={cn(
                  'min-h-[44px] flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-teal-50 text-primary dark:bg-teal-900/40 dark:text-teal-200 font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text hover:bg-surface-raised'
                )}
              >
                <Icon
                  icon={item.icon}
                  size={20}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-text-muted'
                  )}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && item.badge && (
                  <Badge variant="accent" size="sm" className="ms-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id} content={label} position={isRtl ? 'top' : 'top'}>
                  {LinkContent}
                </Tooltip>
              );
            }

            return <div key={item.id}>{LinkContent}</div>;
          })}
        </nav>
      </div>

      {/* Bottom Section: Collapse expander (if collapsed) & Business Profile */}
      <div className="p-3 border-t border-border space-y-2">
        {collapsed && (
          <div className="flex justify-center mb-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className={cn(
                'min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg',
                'text-text-muted hover:text-text hover:bg-surface-raised transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Icon icon={isRtl ? ChevronLeft : ChevronRight} size={18} />
            </button>
          </div>
        )}

        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl bg-surface-raised border border-border/60',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={business?.name || 'My Store'} size="sm" />
            {!collapsed && (
              <div className="flex flex-col min-w-0 text-start">
                <span className="text-xs font-bold text-text truncate">
                  {business?.name || 'Local Business'}
                </span>
                <span className="text-[11px] text-text-muted truncate">
                  {business?.plan || 'Pro Merchant'}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          )}
        </div>
      </div>
    </aside>
  );
};
