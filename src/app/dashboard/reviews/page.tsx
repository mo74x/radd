import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EmptyState } from '@/components/ui';
import { ReviewWithRelations } from './review-helpers';
import { ReviewsClientView } from './ReviewsClientView';

const SAFE_DRAFT_COLUMNS = `
  id,
  business_id,
  review_id,
  body,
  status,
  final_body,
  token_expires_at,
  expires_at,
  last_renewed_at,
  renewal_count,
  decided_at,
  posted_at,
  last_error,
  attempts,
  posting_started_at,
  next_retry_at,
  google_reply_posted_at,
  model,
  prompt_version,
  created_at
`;

export default async function ReviewsPage() {
  // 1. Fetch active business
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
          description="Please seed or configure your initial business profile to start viewing customer reviews."
        />
      </div>
    );
  }

  // 2. Fetch reviews (with locations & safe draft columns), locations, and google connection in parallel
  const [reviewsRes, locationsRes, connRes] = await Promise.all([
    supabaseAdmin
      .from('reviews')
      .select(
        `
        *,
        locations ( id, display_name, contact_phone, contact_email, signature_override ),
        drafts ( ${SAFE_DRAFT_COLUMNS} )
      `
      )
      .eq('business_id', business.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('locations')
      .select('id, display_name')
      .eq('business_id', business.id)
      .order('display_name', { ascending: true }),
    supabaseAdmin
      .from('google_connections')
      .select('status, last_error')
      .eq('business_id', business.id)
      .maybeSingle(),
  ]);

  const reviews = (reviewsRes.data ?? []) as ReviewWithRelations[];
  const locations = locationsRes.data ?? [];
  const googleConn = connRes.data;

  const isRevoked =
    business.status === 'revoked' ||
    googleConn?.status === 'revoked' ||
    (googleConn?.status === 'error' && Boolean(googleConn.last_error?.includes('revoked')));

  return (
    <ReviewsClientView
      reviews={reviews}
      locations={locations}
      isRevoked={isRevoked}
    />
  );
}
