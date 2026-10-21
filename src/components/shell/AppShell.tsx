/* eslint-disable @next/next/no-location-assign-relative-destination */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer, Icon, InlineBanner } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { Sidebar, NAV_ITEMS } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomTabBar } from './BottomTabBar';
import { LocationSwitcher } from './LocationSwitcher';
import { ShellBusiness, ShellLocation, ShellNotificationStatus } from './types';

export interface AppShellProps {
  children: React.ReactNode;
  locations?: ShellLocation[];
  currentLocationId?: string;
  business?: ShellBusiness;
  notificationStatus?: ShellNotificationStatus;
  systemBanner?: {
    variant: 'warning' | 'danger' | 'info' | 'success';
    title: string;
    message: string;
    actionLabel?: string;
    actionHref?: string;
  };
}

/**
 * Authenticated App Shell.
 *
 * Implements:
 * - Desktop collapsible sidebar on start-side (RTL-aware right/left flip)
 * - Sticky top bar with location switcher, status badges, and toggles
 * - Mobile bottom tab bar + slide-over drawer
 * - Persistent system message banner slot
 * - Accessible skip-to-content link and landmark roles
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  locations = [],
  currentLocationId,
  business,
  notificationStatus,
  systemBanner,
}) => {
  const pathname = usePathname();
  const { t } = useI18n();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Restore sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('radd_sidebar_collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('radd_sidebar_collapsed', String(next));
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col antialiased">
      {/* 1. Skip-to-content Accessibility Link */}
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 z-50',
          'px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        Skip to main content (الانتقال إلى المحتوى الرئيسي)
      </a>

      {/* 2. Desktop Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        business={business}
      />

      {/* 3. Main Column Layout: Shifts with logical start padding in desktop */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-250 ease-in-out',
          sidebarCollapsed ? 'lg:ps-20' : 'lg:ps-64'
        )}
      >
        {/* TopBar */}
        <TopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          locations={locations}
          currentLocationId={currentLocationId}
          business={business}
          notificationStatus={notificationStatus}
        />

        {/* 4. Persistent System Message Banner Slot */}
        {systemBanner && !bannerDismissed && (
          <div className="px-4 sm:px-6 pt-4">
            <InlineBanner
              variant={systemBanner.variant}
              title={systemBanner.title}
              onDismiss={() => setBannerDismissed(true)}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
                <span>{systemBanner.message}</span>
                {systemBanner.actionHref && (
                  <Link
                    href={systemBanner.actionHref}
                    className="inline-flex items-center gap-1.5 text-xs font-bold underline hover:opacity-80"
                  >
                    <span>{systemBanner.actionLabel || 'Fix Connection'}</span>
                    <Icon icon={ExternalLink} size={13} />
                  </Link>
                )}
              </div>
            </InlineBanner>
          </div>
        )}

        {/* 5. Main Content Landmark */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 p-4 sm:p-6 pb-20 lg:pb-8 transition-opacity duration-200 motion-reduce:transition-none focus:outline-none'
          )}
        >
          {children}
        </main>
      </div>

      {/* 6. Mobile Bottom Tab Bar */}
      <BottomTabBar />

      {/* 7. Mobile Navigation Drawer */}
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigation Menu"
      >
        <div className="space-y-6">
          {/* Location Switcher in Mobile Drawer */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Active Location
            </span>
            <LocationSwitcher
              locations={locations}
              currentLocationId={currentLocationId}
              className="w-full"
            />
          </div>

          {/* Full Navigation Links */}
          <nav aria-label="Mobile Drawer Navigation" className="space-y-1">
            {NAV_ITEMS.map((item) => {
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
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-50 text-primary dark:bg-teal-900/40 font-semibold'
                      : 'text-text hover:bg-surface-raised'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      icon={item.icon}
                      size={20}
                      className={isActive ? 'text-primary' : 'text-text-muted'}
                    />
                    <span>{label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Business & Sign Out */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                {(business?.name || 'R')[0]}
              </div>
              <div className="text-start">
                <p className="text-xs font-bold text-text truncate">
                  {business?.name || 'Local Store'}
                </p>
                <p className="text-[11px] text-text-muted">
                  {business?.plan || 'Merchant'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                window.location.href = '/api/google/oauth/connect';
              }}
              className="text-danger p-2 hover:bg-danger-surface rounded-lg transition-colors"
              aria-label="Log Out"
            >
              <Icon icon={LogOut} size={18} />
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
