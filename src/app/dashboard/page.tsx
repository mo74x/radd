import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EmptyState } from '@/components/ui';
import { DashboardClientView } from './DashboardClientView';

interface DashboardPageProps {
  searchParams?: Promise<{ locationId?: string }> | { locationId?: string };
}

export default async function DashboardPage(props: DashboardPageProps) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const selectedLocationId = resolvedParams.locationId;

  // 1. Fetch Business
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
          title="No Business Configured"
          description="Please seed or configure your initial business profile to start drafting AI replies."
        />
      </div>
    );
  }

  // 2. Fetch Reviews, Google Connection, Locations, and Brand Profile in parallel
  const [reviewsRes, connRes, locationsRes, brandRes] = await Promise.all([
    supabaseAdmin
      .from('reviews')
      .select(`
        *,
        locations ( id, display_name, contact_phone, signature_override ),
        drafts (*)
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false }),
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

  const rawReviews = reviewsRes.data ?? [];
  const googleConn = connRes.data;
  const locations = locationsRes.data ?? [];
  const brand = brandRes.data;

  // 3. Filter reviews by active location if selected
  const allReviews =
    selectedLocationId && selectedLocationId !== 'all'
      ? rawReviews.filter((r) => r.location_id === selectedLocationId)
      : rawReviews;

  const totalReviews = allReviews.length;

  // 4. Calculate KPI statistics
  let postedCount = 0;
  let approvedWithoutEditCount = 0;
  let editedCount = 0;
  let pendingCount = 0;

  for (const r of allReviews) {
    const draft = Array.isArray(r.drafts) ? r.drafts[0] : r.drafts;
    if (!draft) continue;

    if (draft.status === 'posted' || draft.status === 'approved' || draft.status === 'edited') {
      postedCount += 1;
      if (draft.final_body && draft.final_body.trim() !== draft.body.trim()) {
        editedCount += 1;
      } else {
        approvedWithoutEditCount += 1;
      }
    } else if (draft.status === 'pending') {
      pendingCount += 1;
    }
  }

  const shareAnsweredPct =
    totalReviews > 0 ? Math.round((postedCount / totalReviews) * 100) : 0;
  const approvedWithoutEditPct =
    postedCount > 0
      ? Math.round((approvedWithoutEditCount / postedCount) * 100)
      : 100;

  return (
    <DashboardClientView
      business={{
        id: business.id,
        name: business.name,
        plan: business.plan,
        status: business.status,
        notification_channel: business.notification_channel || 'telegram',
        notification_target: business.notification_target || '@radd_approval_bot',
      }}
      googleConn={googleConn}
      locations={locations}
      brand={brand}
      allReviews={allReviews}
      rawReviewsCount={rawReviews.length}
      selectedLocationId={selectedLocationId}
      stats={{
        totalReviews,
        postedCount,
        approvedWithoutEditCount,
        editedCount,
        pendingCount,
        shareAnsweredPct,
        approvedWithoutEditPct,
      }}
    />
  );
}