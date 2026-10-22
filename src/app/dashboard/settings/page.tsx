import React, { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EmptyState, Spinner } from '@/components/ui';
import { LocationItem } from '@/app/onboarding/Step1Google';
import { SettingsClientView } from './SettingsClientView';

export default async function SettingsPage() {
  // Fetch active business
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!business) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <EmptyState
          title="No Business Found"
          description="Please seed or configure a business profile first."
        />
      </div>
    );
  }

  // Fetch related Google connection, locations, and brand profile
  const [connRes, locationsRes, brandRes] = await Promise.all([
    supabaseAdmin
      .from('google_connections')
      .select('status, google_email, last_error, updated_at')
      .eq('business_id', business.id)
      .maybeSingle(),
    supabaseAdmin
      .from('locations')
      .select('*')
      .eq('business_id', business.id)
      .order('display_name', { ascending: true }),
    supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Spinner size="lg" className="text-primary" />
        </div>
      }
    >
      <SettingsClientView
        business={{
          id: business.id,
          name: business.name,
          plan: business.plan,
          status: business.status,
          trial_ends_at: business.trial_ends_at,
          notification_channel: business.notification_channel || 'telegram',
          notification_target: business.notification_target || '',
        }}
        googleConnection={connRes.data}
        locations={(locationsRes.data as LocationItem[]) ?? []}
        brand={brandRes.data}
      />
    </Suspense>
  );
}
