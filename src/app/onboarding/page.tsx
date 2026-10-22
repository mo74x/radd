'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Spinner } from '@/components/ui';
import { OnboardingWizard } from './OnboardingWizard';
import { LocationItem } from './Step1Google';
import { NotificationChannel } from './Step3Notifications';

interface SettingsResponse {
  business: {
    id: string;
    name: string;
    notification_channel?: NotificationChannel | null;
    notification_target?: string | null;
  };
  googleConnection: {
    status?: 'active' | 'revoked' | 'none';
    google_email?: string | null;
    last_error?: string | null;
  } | null;
  locations: LocationItem[];
  brand?: {
    tone?: string | null;
    arabic_dialect?: string | null;
    signature?: string | null;
    do_list?: string[] | null;
    dont_list?: string[] | null;
    example_replies?: string[] | null;
  } | null;
}

function OnboardingContent() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/settings');
        if (!res.ok) {
          throw new Error('Failed to load business profile settings');
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4">
        <Spinner size="lg" className="text-primary" />
        <p className="text-sm text-text-muted font-medium">Loading onboarding settings...</p>
      </main>
    );
  }

  if (error || !data?.business) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-surface text-center space-y-4 shadow-xs">
          <p className="text-sm font-semibold text-danger">
            {error || 'No business found in database'}
          </p>
          <a
            href="/dashboard"
            className="inline-block min-h-[44px] leading-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <OnboardingWizard
      initialBusiness={data.business}
      initialGoogleConnection={data.googleConnection}
      initialLocations={data.locations || []}
      initialBrandProfile={data.brand}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
          <Spinner size="lg" className="text-primary" />
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
