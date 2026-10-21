/* eslint-disable @next/next/no-location-assign-relative-destination */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Send, Mail, MessageCircle, LogOut, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Icon,
  IconButton,
  LanguageToggle,
  Logo,
  ThemeToggle,
} from '@/components/ui';
import { LocationSwitcher } from './LocationSwitcher';
import { ShellBusiness, ShellLocation, ShellNotificationStatus } from './types';

export interface TopBarProps {
  onOpenMobileNav: () => void;
  locations?: ShellLocation[];
  currentLocationId?: string;
  onSelectLocation?: (id: string) => void;
  notificationStatus?: ShellNotificationStatus;
  business?: ShellBusiness;
  className?: string;
}

/**
 * TopBar navigation header.
 * Houses LocationSwitcher, Notification status chip, Language & Theme toggles, and Account menu.
 */
export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileNav,
  locations = [],
  currentLocationId,
  onSelectLocation,
  notificationStatus = { channel: 'telegram', connected: true, target: '@radd_bot' },
  business,
  className,
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen]);

  // Channel icons & names
  const channelIcons = {
    telegram: Send,
    whatsapp: MessageCircle,
    email: Mail,
  };
  const ChannelIcon = channelIcons[notificationStatus.channel] || Send;

  return (
    <header
      role="banner"
      className={cn(
        'sticky top-0 z-30 h-16 w-full border-b border-border bg-surface/85 backdrop-blur-md px-4 sm:px-6',
        'flex items-center justify-between gap-3 shadow-2xs select-none',
        className
      )}
    >
      {/* Start Area: Mobile menu trigger & Location Switcher */}
      <div className="flex items-center gap-3">
        <IconButton
          aria-label="Open navigation menu"
          onClick={onOpenMobileNav}
          className="lg:hidden"
        >
          <Icon icon={Menu} size={22} />
        </IconButton>

        <div className="lg:hidden">
          <Link href="/dashboard">
            <Logo variant="icon" size="sm" />
          </Link>
        </div>

        {/* Location Switcher */}
        <div className="hidden sm:block">
          <LocationSwitcher
            locations={locations}
            currentLocationId={currentLocationId}
            onSelect={onSelectLocation}
          />
        </div>
      </div>

      {/* End Area: Notification status chip, Language, Theme, Account */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Status Chip */}
        <div className="hidden md:inline-flex">
          <Badge
            variant={notificationStatus.connected ? 'success' : 'warning'}
            size="md"
            dot
            className="capitalize"
          >
            <Icon icon={ChannelIcon} size={14} className="me-1" />
            <span>{notificationStatus.channel}: {notificationStatus.connected ? 'Active' : 'Setup'}</span>
          </Badge>
        </div>

        {/* Language Toggle */}
        <LanguageToggle variant="compact" />

        {/* Theme Toggle */}
        <ThemeToggle variant="icon" />

        {/* Account Menu */}
        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            aria-label="User Account Menu"
            className="flex items-center rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar name={business?.name || 'Store'} size="sm" />
          </button>

          {accountMenuOpen && (
            <div
              role="menu"
              className={cn(
                'absolute end-0 mt-2 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-xl z-50 text-start',
                'animate-in fade-in zoom-in-95 duration-100 divide-y divide-border-muted'
              )}
            >
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-text truncate">
                  {business?.name || 'Local Merchant'}
                </p>
                <p className="text-[11px] text-text-muted truncate">
                  {business?.plan || 'Owner Account'}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard#settings"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-surface-raised transition-colors"
                >
                  <Icon icon={Settings} size={16} className="text-text-muted" />
                  <span>Business Settings</span>
                </Link>
                <Link
                  href="/onboarding"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-surface-raised transition-colors"
                >
                  <Icon icon={User} size={16} className="text-text-muted" />
                  <span>Account Setup</span>
                </Link>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    // Standard signout
                    window.location.href = '/api/google/oauth/connect';
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger-surface transition-colors"
                >
                  <Icon icon={LogOut} size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
