import React, { Suspense } from 'react';
import { AppShell } from '@/components/shell';
import LoadingDashboard from './loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingDashboard />}>
      <AppShell
        business={{
          name: 'Local Business',
          plan: 'Pro Merchant',
        }}
        notificationStatus={{
          channel: 'telegram',
          connected: true,
          target: '@radd_approval_bot',
        }}
      >
        <Suspense fallback={<LoadingDashboard />}>
          {children}
        </Suspense>
      </AppShell>
    </Suspense>
  );
}
