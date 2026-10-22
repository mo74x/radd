'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export const OfflineNotice: React.FC = () => {
  const { t } = useI18n();
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      const showTimer = setTimeout(() => {
        setShowReconnected(true);
      }, 0);
      const hideTimer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOnline]);

  const isOffline = !isOnline;
  if (!isOffline && !showReconnected) return null;

  return (
    <aside
      aria-label="Network connection status"
      className={`fixed bottom-4 inset-x-4 max-w-md mx-auto z-50 p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-2 ${
        isOffline
          ? 'bg-danger text-danger-foreground border-danger/40'
          : 'bg-success text-success-foreground border-success/40'
      }`}
    >
      <div className="shrink-0">
        <Icon icon={isOffline ? WifiOff : Wifi} size={18} />
      </div>

      <div className="flex-1 text-start">
        <p className="font-bold leading-tight">
          {isOffline ? t('globalStates.offlineTitle') : 'Connected back online'}
        </p>
        {isOffline && (
          <p className="text-[11px] opacity-90 mt-0.5">
            {t('globalStates.offlineDesc')}
          </p>
        )}
      </div>
    </aside>
  );
};
